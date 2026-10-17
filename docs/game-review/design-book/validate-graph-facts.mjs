import assert from 'node:assert/strict';
import {readFile, writeFile, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';

const stage = path.dirname(fileURLToPath(import.meta.url));
export async function validateGraphFacts({repoRoot=path.resolve(stage,'../../..'),reportPath=path.join(stage,'graph-fact-validation.json')}={}) {
const repo = repoRoot;
const source = file => import(pathToFileURL(path.join(repo,file)).href);
const graphBytes = await readFile(path.join(stage,'graph-spec.json'));
const graph = JSON.parse(graphBytes.toString('utf8'));
const content = await source('src/content.ts');
const model = await source('src/model.ts');
const forge = await source('src/weapon-forge.ts');
const upgrades = await source('src/upgrades.ts');
const ceiling = await source('src/gear-ceiling.ts');
const gates = await source('src/level-gates.ts');
const gifts = await source('src/story-gifts.ts');
const fishing = await source('src/fishing.ts');
let assertions = 0;
const eq = (actual,expected,message) => {assert.deepEqual(actual,expected,message); assertions++;};
const ok = (actual,message) => {assert.ok(actual,message); assertions++;};
const byId = Object.fromEntries(graph.diagrams.map(d=>[d.id,d]));
eq(graph.diagrams.length,4,'four validated upgrade/acquisition diagrams');
for (const d of graph.diagrams) {
  const ids = new Set(d.nodes.map(n=>n.id));
  eq(ids.size,d.nodes.length,`${d.id}: unique nodes`);
  ok(d.nodes.length<=12,`${d.id}: small readable graph`);
  for (const edge of d.edges) {
    ok(ids.has(edge.from)&&ids.has(edge.to),`${d.id}: edge endpoints exist`);
    ok(edge.from!==edge.to,`${d.id}: no self edge`);
    ok(['upgrade','acquire','requires','unlock'].includes(edge.kind),`${d.id}: supported edge kind`);
  }
  for (const file of d.sourcePaths) {await access(path.join(repo,file)); assertions++;}
}

const bed = byId['bed-growth'];
eq(model.BED_MAX_LEVEL,5,'bed maximum');
for (const node of bed.nodes) {
  eq(node.state.growthSpeedMultiplier,model.bedSpeedUp(node.state.level),'bed speed');
  eq(node.state.ordinaryDurationShare,1/model.bedSpeedUp(node.state.level),'bed duration share');
}
for (const step of bed.stepTable) {
  eq(step.easyEnergy,model.bedUpgradeCost({settings:{difficulty:'easy'}},step.fromLevel),'Easy bed price');
  for (const difficulty of ['normal','hard']) eq(step.normalHardEnergy,model.bedUpgradeCost({settings:{difficulty}},step.fromLevel),`${difficulty} bed price`);
}
eq(bed.totals.easyEnergy,bed.stepTable.reduce((n,s)=>n+s.easyEnergy,0),'Easy bed total');
eq(bed.totals.normalHardEnergy,bed.stepTable.reduce((n,s)=>n+s.normalHardEnergy,0),'Normal/Hard bed total');

const wishes = byId['permanent-wishes'];
for (const step of wishes.stepTable) {
  const rule=content.UPGRADES[step.id];
  eq(step.effectPerRank,rule.step,'wish effect');
  eq(step.basePrice,rule.base,'wish initial price');
  eq(step.maximumRank,rule.max??null,'wish explicit cap');
  for (let rank=0;rank<step.firstFourEnergyCosts.length;rank++) {
    const state={healthUp:0,attackUp:0,defenseUp:0,critUp:0};
    state[`${step.id}Up`]=rank;
    eq(step.firstFourEnergyCosts[rank],model.upgradeCost(state,step.id),'wish current-rank price');
  }
}

const rods = byId['fishing-tools'];
for (const step of rods.stepTable) {
  const item=content.ITEMS[step.id], recipe=content.RECIPES.find(r=>r.result===step.id);
  eq(step.state.quality,item.weapon.quality,'rod quality');
  eq(step.state.steady,item.weapon.steady===true,'rod steady flag');
  eq(step.state.breakChancePerStrain,fishing.lineBreakChance(item.weapon),'per-strain line-break chance');
  eq(step.state.playerLevelGate,gates.gearLevel(step.id),'rod level gate');
  eq(step.acquisition.energy,recipe.energy,'rod purchase price');
  eq(step.acquisition.materials,recipe.materials,'rod purchase materials');
  eq(recipe.station,'shop','rod is a shop acquisition');
  eq(step.acquisition.consumesPreviousRod,false,'no prior rod consumption');
  for (const other of rods.stepTable) ok(!Object.hasOwn(recipe.materials,other.id),'no rod evolution ingredient');
  eq(upgrades.upgradableGear(step.id),false,'rod outside gear bench');
  eq(forge.canForge({bag:{[step.id]:1},energy:Number.MAX_SAFE_INTEGER,planet:'home',chest:{bone:9999,leather:9999,starshard:9999}},step.id),false,'rod outside forge');
}
eq(gifts.STORY_GIFTS[4],{rod:1,worm:5},'visible story step five rod gift');
eq(fishing.STEADY.bite,.4,'steady bite-window bonus');

const owned = byId['owned-gear-strengthening'];
eq(forge.MAX_FORGE_LEVEL,15,'forge cap');
eq(upgrades.MAX_GEAR_LEVEL,10,'bench cap');
const woodRecipe=content.RECIPES.find(r=>r.result==='sword_wood');
eq({energy:woodRecipe.energy,materials:woodRecipe.materials,station:woodRecipe.station},{energy:25,materials:{},station:'shop'},'Wood sword acquisition');
eq(content.ITEMS.sword_wood.stats.atk,6,'Wood sword item attack');
eq(content.ITEMS.sword_wood.weapon.range,2.3,'Wood sword base range');
eq(content.ITEMS.hat_straw.stats,{def:3,hp:10},'Straw hat base stats');
eq(content.RECIPES.find(r=>r.result==='hat_straw').energy,20,'Straw hat purchase price');
eq(gifts.STORY_GIFTS[2],{hat_straw:1},'visible story step three hat gift');
for (const step of owned.stepTables.woodSwordForge) {
  const cost=forge.forgeCost(step.fromLevel);
  eq(step.energy,cost.energy,'forge attempt energy');
  eq(step.materials,cost.materials,'forge attempt materials');
  eq(step.successProbability,forge.forgeChance(step.fromLevel),'forge probability');
  eq(step.expectedAttemptsForThisLevel,1/forge.forgeChance(step.fromLevel),'forge expected attempts');
}
for (const step of owned.stepTables.strawHatBench) {
  const cost=upgrades.gearCost('hat_straw',step.fromLevel);
  eq(step.energy,cost.energy,'hat bench energy');
  eq(step.materials,cost.materials,'hat bench materials');
  eq(step.resultStats,ceiling.lineAtLevel('hat_straw',step.toLevel),'hat bench exact resulting stats');
}
eq(owned.totals.strawHatTo10,upgrades.gearCostToMax('hat_straw',0),'hat complete bench total');
eq(owned.nodes.find(n=>n.id==='hat-10').state,ceiling.SLOT_CEILING.hat,'hat ceiling');
for (const id of ['rod','rod_gold','rod_steady','sword_wood','hat_straw']) eq(gates.gearLevel(id),0,`${id} level gate`);

const files=[...new Set(graph.diagrams.flatMap(d=>d.sourcePaths))].sort();
const hashes=[];
for(const file of files){const bytes=await readFile(path.join(repo,file));hashes.push({path:file,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});}
const report={date:'2026-10-17',baselineCommit:graph.baselineCommit,method:'Read-only imports of maintained source rules plus graph/data/source-path assertions. No game suite, browser launch, save access or gameplay playtest.',result:'Pass',assertions,graphSha256:createHash('sha256').update(graphBytes).digest('hex'),diagramCounts:graph.diagrams.map(d=>({id:d.id,nodes:d.nodes.length,edges:d.edges.length})),sourceHashes:hashes,sourceInspectionOnly:['forge failure pays full attempt without consuming weapon or downgrading','whole derived attack includes held-weapon forge multiplier','online gear upgrades require accepted indoor proximity to bench'],unrun:['full game automated suites','generated HTML structure/build checks owned by root','browser layout/navigation/search/dialog/print/file-open verification','designer comprehension and fresh-player acceptance']};
await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);
  if(args.length && (args.length!==2||args[0]!=='--repo-root'))throw new Error('Usage: node validate-graph-facts.mjs [--repo-root PATH]');
  const report=await validateGraphFacts(args.length?{repoRoot:path.resolve(args[1])}:{});
  console.log(JSON.stringify({result:report.result,assertions:report.assertions,diagrams:report.diagramCounts,sourceFiles:report.sourceHashes.length,graphSha256:report.graphSha256}));
}
