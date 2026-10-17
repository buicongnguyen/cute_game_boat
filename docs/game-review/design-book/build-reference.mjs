import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';
import {buildBookData} from './book-data.mjs';
import {validateGraphFacts} from './validate-graph-facts.mjs';

const sourceDir=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i++) {
  if(args[i]==='--help'){console.log('node build-reference.mjs [--repo-root PATH] [--review-dir PATH] [--output FILE]');process.exit(0);}
  if(!['--repo-root','--review-dir','--output'].includes(args[i]) || !args[i+1]) throw new Error(`Unknown or incomplete option: ${args[i]}`);
  options[args[i].slice(2)]=args[++i];
}
const repoRoot=path.resolve(options['repo-root'] ?? path.join(sourceDir,'..','..','..'));
const reviewDir=path.resolve(options['review-dir'] ?? path.join(repoRoot,'docs','game-review'));
const output=path.resolve(options.output ?? path.join(sourceDir,'..','design-reference.html'));
const reportPath=path.join(sourceDir,'reference-build-report.json');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const readJSON=async file=>JSON.parse((await readFile(file,'utf8')).replace(/^\uFEFF/,''));
const exists=async file=>{try{await access(file);return true;}catch{return false;}};
const unique=array=>[...new Set(array.filter(Boolean))];
const within=(base,file)=>{const relative=path.relative(base,file);return relative!== '..'&&!relative.startsWith(`..${path.sep}`)&&!path.isAbsolute(relative);};
const mimeFor=file=>({'.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'})[path.extname(file).toLowerCase()];

const graphValidation=await validateGraphFacts({repoRoot});
const inputs=['template.html','book.css','book.js','graph-spec.json','book-config.json','book-data.mjs','chapters.mjs','validate-graph-facts.mjs'];
const inputHashes=await Promise.all(inputs.map(async file=>({path:file,sha256:sha(await readFile(path.join(sourceDir,file)))})));
const [template,css,client,graphSpec]=await Promise.all([
  readFile(path.join(sourceDir,'template.html'),'utf8'),readFile(path.join(sourceDir,'book.css'),'utf8'),
  readFile(path.join(sourceDir,'book.js'),'utf8'),readJSON(path.join(sourceDir,'graph-spec.json')),
]);
new Script(client,{filename:'book.js'}); // Parse only; never execute browser code in Node.
const data=await buildBookData({repoRoot,reviewDir});
if(graphSpec.baselineCommit!==data.meta.baselineCommit) throw new Error('Graph and catalog baseline commits disagree');
const mapPath=await exists(path.join(sourceDir,'asset-map.json'))?path.join(sourceDir,'asset-map.json'):path.join(sourceDir,'assets','asset-map.json');
if(!await exists(mapPath)) throw new Error(`Visual map is required: ${mapPath}`);
const visualMap=await readJSON(mapPath),mapped=visualMap.assets ?? visualMap;
if(!mapped || typeof mapped!=='object' || Array.isArray(mapped)) throw new Error('asset-map.json must contain an assets object');
const imageCache=new Map(),imageReport=[];

async function embedFile(file,meta={}) {
  const absolute=path.resolve(file);
  if(!within(repoRoot,absolute)&&!within(sourceDir,absolute)) throw new Error(`Image escapes the repository and book source roots: ${file}`);
  const mime=mimeFor(absolute);if(!mime) throw new Error(`Unsupported image type: ${file}`);
  let cached=imageCache.get(absolute);
  if(!cached){const bytes=await readFile(absolute);cached={src:`data:${mime};base64,${bytes.toString('base64')}`,sha256:sha(bytes),bytes:bytes.length};imageCache.set(absolute,cached);}
  const kind=meta.kind ?? (String(meta.type ?? '').includes('icon')?'icon':'model-preview');
  const source=Array.isArray(meta.source)?meta.source.join(' · '):meta.source ?? path.relative(repoRoot,absolute).split(path.sep).join('/');
  return {src:cached.src,kind,caption:meta.caption ?? meta.description ?? 'Existing game asset reference',source,sha256:cached.sha256};
}

async function fromMap(id) {
  const entry=mapped[id];if(!entry)return null;
  const file=entry.file ?? entry.path;if(!file)throw new Error(`Mapped image has no file: ${id}`);
  const candidates=path.isAbsolute(file)?[file]:unique([
    path.join(path.dirname(mapPath),file),path.join(sourceDir,file),path.join(repoRoot,file),
  ]);
  const found=[];for(const candidate of candidates)if(await exists(candidate))found.push(candidate);
  if(!found.length)throw new Error(`Mapped image not found for ${id}: ${file}`);
  const image=await embedFile(found[0],entry);imageReport.push({id,file:path.relative(sourceDir,found[0]).split(path.sep).join('/'),kind:image.kind,sha256:image.sha256});return image;
}

async function fallbackIcon(id,candidates=[]) {
  const paths=unique([...candidates,`public/assets/icons/items/${id}.webp`,`public/assets/icons/crops/${id}.webp`,`public/assets/icons/fish/${id}.webp`]);
  for(const candidate of paths)if(await exists(path.join(repoRoot,candidate))){
    const image=await embedFile(path.join(repoRoot,candidate),{kind:'icon',source:candidate,caption:'Existing in-game item icon; not a newly authored asset.'});
    imageReport.push({id,file:candidate,kind:image.kind,sha256:image.sha256});return image;
  }
  return null;
}

data.images={};
for(const asset of data.assets) {
  asset.image=await fromMap(asset.id) ?? await fallbackIcon(asset.id,asset.iconCandidates);
  if(!asset.image)throw new Error(`Selected asset has no embedded visual: ${asset.id}`);
}
data.images.keeper=await fromMap('keeper') ?? await fromMap('hero');
if(!data.images.keeper)throw new Error('A current keeper model preview is required for the cover');

const graphs=structuredClone(graphSpec.diagrams);
if(!Array.isArray(graphs)||graphs.length!==4)throw new Error('Expected the four source-verified progression graphs');
for(const id of ['crop-unlocks','material-recipe']) {
  const graph=structuredClone(data.diagrams.find(candidate=>candidate.id===id));
  if(!graph)throw new Error(`Extracted diagram missing: ${id}`);
  graph.description=graph.meaning;graph.notes=graph.limits;
  if(id==='crop-unlocks') {
    let cropRow=0;
    for(const node of graph.nodes) {
      if(node.kind==='level'){node.column=0;node.row=graph.nodes.filter(n=>n.kind==='level').findIndex(n=>n.id===node.id);}
      else {node.column=1;node.row=cropRow++;node.subtitle=node.detail;}
    }
    // Give each level its group's vertical centre, including the two level-one crops.
    for(const node of graph.nodes.filter(n=>n.kind==='level')) {
      const targets=graph.edges.filter(e=>e.from===node.id).map(e=>graph.nodes.find(n=>n.id===e.to).row);
      node.row=targets.reduce((sum,value)=>sum+value,0)/targets.length;
    }
    graph.sourcePaths=['src/content.ts','src/first-run.ts','src/model.ts'];
  } else {
    const positions={'leather-input':[0,0],'energy-input':[0,1],'mirror-recipe':[1,.5],'leather-output':[2,.5]};
    for(const node of graph.nodes)[node.column,node.row]=positions[node.id];
    graph.edges=graph.edges.map(edge=>({...edge,semanticKind:edge.kind,kind:edge.kind==='result'?'acquire':'requires'}));
    graph.stepTable=[{result:graph.recipe.result,station:graph.recipe.station,energy:graph.recipe.energy,materials:graph.recipe.materials}];
    graph.sourcePaths=['src/content.ts','src/model.ts','src/house-activities.ts'];
  }
  graphs.push(graph);
}

const graphSourcePaths=[];
for(const graph of graphs) {
  graph.description ??= graph.summary ?? graph.meaning;
  graph.notes ??= graph.caveats ?? graph.limits ?? [];
  graph.sourcePaths=unique([...(graph.sourcePaths ?? []),...(graph.sources ?? []).map(source=>typeof source==='string'?source:source.path)]);
  graphSourcePaths.push(...graph.sourcePaths);
  if(!graph.stepTable&&graph.stepTables)graph.stepTable=Object.entries(graph.stepTables).flatMap(([branch,rows])=>Array.isArray(rows)?rows.map(row=>({branch,...row})):[]);
  const ids=new Set();
  for(const [index,node] of graph.nodes.entries()) {
    if(!node.id||ids.has(node.id))throw new Error(`Missing or duplicate node ID in ${graph.id}: ${node.id}`);ids.add(node.id);
    node.column ??= index;node.row ??= 0;node.assetId ??= node.assetKey;
    node.sourcePaths ??= graph.sourcePaths;
    if(!Number.isFinite(node.column)||!Number.isFinite(node.row)||node.column<0||node.row<0)throw new Error(`Invalid node position: ${graph.id}/${node.id}`);
    const imageId=node.assetId ?? node.id;
    if(!data.assets.some(asset=>asset.id===imageId)&&!data.images[imageId]) {
      const image=await fromMap(imageId) ?? await fallbackIcon(imageId);
      if(image)data.images[imageId]=image;
      else if(node.assetId)throw new Error(`Graph image unavailable: ${graph.id}/${imageId}`);
    }
  }
  for(const edge of graph.edges) {
    if(!ids.has(edge.from)||!ids.has(edge.to))throw new Error(`Dangling graph edge in ${graph.id}: ${edge.from} -> ${edge.to}`);
    if(!['upgrade','acquire','requires','unlock'].includes(edge.kind))throw new Error(`Unsupported graph edge kind: ${edge.kind}`);
    if(edge.cost?.energy!==undefined&&(!Number.isFinite(edge.cost.energy)||edge.cost.energy<0))throw new Error(`Invalid graph cost in ${graph.id}`);
  }
}
data.graphs=graphs; // Keep data.diagrams as the independently extracted simple diagrams.
data.graphEvidence={baselineCommit:graphSpec.baselineCommit,globalCaveats:graphSpec.globalCaveats,edgeLegend:graphSpec.edgeLegend};

const backlogText=await readFile(path.join(reviewDir,'BACKLOG.md'),'utf8');
const wanted=['UX-001','UX-002','PACE-001','STORY-001'];
data.reviewQuestions=wanted.map(id=>{
  const line=backlogText.split(/\r?\n/).find(line=>line.trim().startsWith(`| ${id} |`));
  if(!line)throw new Error(`Maintained question missing from BACKLOG.md: ${id}`);
  const cells=line.trim().slice(1,-1).split('|').map(cell=>cell.trim());
  return {id:cells[0],status:cells[1],question:cells[2],context:'Maintained question from BACKLOG.md; player acceptance remains open.',check:cells[3]};
});
data.chapters[0].proposal.reviewQuestions=data.reviewQuestions;

const chapterSourcePaths=unique(data.chapters.flatMap(chapter=>chapter.sourcePaths));
const resolveSource=relative=>relative.startsWith('docs/game-review/')?path.join(reviewDir,relative.slice('docs/game-review/'.length)):path.join(repoRoot,relative);
const referencedPaths=unique([...data.assets.flatMap(asset=>asset.sourcePaths),...graphSourcePaths,...chapterSourcePaths]);
for(const relative of referencedPaths)if(!await exists(resolveSource(relative)))throw new Error(`Missing source reference: ${relative}`);
data.meta.chapterSourceFiles=await Promise.all(chapterSourcePaths.map(async relative=>({path:relative,sha256:sha(await readFile(resolveSource(relative)))})));
data.meta.graphSourceFiles=await Promise.all(unique(graphSourcePaths).map(async relative=>({path:relative,sha256:sha(await readFile(path.join(repoRoot,relative)))})));
data.meta.bookSources=[...inputHashes,{path:path.relative(sourceDir,mapPath).split(path.sep).join('/'),sha256:sha(await readFile(mapPath))},{path:'BACKLOG.md',sha256:sha(backlogText)}];
data.meta.visuals={embeddedImages:imageCache.size,assetMapSchema:visualMap.schemaVersion ?? visualMap.schema ?? null,render:visualMap.render ?? null};
data.meta.validation={kind:'Static build validation',browserAcceptance:'Unrun. Browser-control surfaces were unavailable in this session; no interactive or visual pass is claimed.'};
data.meta.validation.ruleAssertions=graphValidation.assertions;
data.meta.limits.push('Rendered model references are documentation previews, not in-game screenshots.','Browser, print and physical-device acceptance remain unrun.');

const engineeringText=await readFile(path.join(reviewDir,'ENGINEERING-MAP.md'),'utf8');
const engineeringMatch=engineeringText.match(/```text\r?\n([\s\S]*?)```/);
if(!engineeringMatch)throw new Error('ENGINEERING-MAP.md needs its maintained text tree');
const escapeHTML=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const engineeringNotes=engineeringText.replace(/^# .+\r?\n/,'').replace(/```text[\s\S]*?```/,'').trim().split(/\n\s*\n/);
const engineeringHTML=`<p class="section-deck engineering-intro">${escapeHTML(engineeringNotes[0])}</p><pre class="engineering-tree">${escapeHTML(engineeringMatch[1].trimEnd())}</pre>${engineeringNotes.slice(1).map(note=>`<p class="engineering-note">${escapeHTML(note)}</p>`).join('')}`;
data.meta.bookSources.push({path:'../ENGINEERING-MAP.md',sha256:sha(engineeringText)});
const placeholders={'/*__BOOK_CSS__*/':css,'/*__BOOK_DATA__*/':JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029'),'/*__BOOK_JS__*/':client,'/*__ENGINEERING_MAP__*/':engineeringHTML};
let html=template;
for(const [marker,value] of Object.entries(placeholders)) {
  if(html.split(marker).length!==2)throw new Error(`Template must contain exactly one ${marker}`);
  html=html.replace(marker,()=>value);
}
if(/\/\*__BOOK_[A-Z]+__\*\//.test(html))throw new Error('Unresolved template placeholder');
if(/<script[^>]+src\s*=|<link[^>]+rel\s*=\s*["']stylesheet/i.test(html))throw new Error('Book unexpectedly requires external scripts or styles');
const chapterCounts=data.chapters.map(chapter=>chapter.current.milestones.length);
const allSteps=data.chapters.flatMap(chapter=>chapter.current.milestones.map(step=>step.step));
const sceneCount=data.chapters.reduce((count,chapter)=>count+chapter.proposal.openingBeats.length,0);
if(data.chapters.length!==4||JSON.stringify(chapterCounts)!=='[9,6,6,8]'||data.totalMilestones!==29||allSteps.some((step,index)=>step!==index+1)||sceneCount!==29||data.assets.length<20||data.assets.length>100)throw new Error('Four-chapter story coverage check failed');
for(const chapter of data.chapters)for(const id of [...chapter.assetIds,chapter.coverAssetId])if(!data.assets.some(asset=>asset.id===id&&asset.image?.src?.startsWith('data:image/')))throw new Error(`Unillustrated chapter asset: ${chapter.id}/${id}`);
if(data.assets.some(asset=>!asset.image.src.startsWith('data:image/')))throw new Error('Asset image failed self-contained check');
await mkdir(path.dirname(output),{recursive:true});await writeFile(output,html,'utf8');
const report={schemaVersion:1,generatedAt:data.meta.generatedAt,output:path.relative(repoRoot,output).split(path.sep).join('/'),outputBytes:Buffer.byteLength(html),sha256:sha(html),baselineCommit:data.meta.baselineCommit,
  counts:{chapters:data.chapters.length,chapterMilestones:chapterCounts,milestones:data.totalMilestones,assets:data.assets.length,openingBeats:sceneCount,worlds:data.worlds.length,graphs:data.graphs.length,graphNodes:data.graphs.reduce((n,g)=>n+g.nodes.length,0),graphEdges:data.graphs.reduce((n,g)=>n+g.edges.length,0),uniqueImages:imageCache.size},
  checks:['Browser JavaScript parses without execution','Four chapters cover all 29 ordered current milestones and 29 proposed scenes in groups 9 6 6 8','Every selected asset embeds an existing icon or rendered preview','Every graph node ID is unique and every edge resolves','Graph positions and costs are finite and valid','Catalog and verified-graph baseline commits agree','All referenced source files exist','Canonical backlog and chapter acceptance questions are extracted','Template placeholders resolve and styles scripts and images are inline'],
  sourceHashes:data.meta.bookSources,graphSourceHashes:data.meta.graphSourceFiles,chapterSourceHashes:data.meta.chapterSourceFiles,visuals:imageReport,
  limits:['No browser interaction layout print or physical-device acceptance was performed.','No gameplay test suite was run for this documentation build.','The proposed narrative remains unimplemented.']};
await writeFile(reportPath,JSON.stringify(report,null,2)+'\n','utf8');
console.log(JSON.stringify({output,report:reportPath,bytes:report.outputBytes,...report.counts},null,2));
