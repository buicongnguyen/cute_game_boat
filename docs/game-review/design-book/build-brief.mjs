import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const sourceDir=path.dirname(fileURLToPath(import.meta.url));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inline=value=>escape(value).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
const slug=value=>value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function buildBrief(options={}) {
  const repoRoot=path.resolve(options.repoRoot||path.join(sourceDir,'../../..'));
  const reviewDir=path.resolve(options.reviewDir||path.join(repoRoot,'docs/game-review'));
  const source=path.join(reviewDir,'DESIGN-BRIEF.md'),output=path.resolve(options.output||path.join(reviewDir,'design-book.html'));
  const markdown=(await fs.readFile(source,'utf8')).replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
  const wordCount=markdown.split(/\s+/).filter(word=>/[\p{L}\p{N}]/u.test(word)).length;
  if(wordCount>500)throw new Error(`Brief exceeds its 500-word budget (${wordCount})`);
  const title=markdown.match(/^# (.+)$/m)?.[1];if(!title)throw new Error('Brief needs one title');
  const sections=[...markdown.matchAll(/^## (.+)$/gm)].map(match=>({title:match[1],id:slug(match[1])}));
  if(sections.length!==5)throw new Error('Keep the brief to its five numbered sections');
  const lines=markdown.split('\n');let html='',i=0,inSection=false,tableRows=0;
  const isBoundary=line=>!line.trim()||/^(#{1,2} |```|\||- )/.test(line);
  while(i<lines.length){const line=lines[i];if(!line.trim()||line.startsWith('# ')){i++;continue;}
    if(line.startsWith('## ')){if(inSection)html+='</section>';const heading=line.slice(3);html+=`<section class="spec-section" id="${slug(heading)}"><h2>${escape(heading)}</h2>`;inSection=true;i++;continue;}
    if(line.startsWith('```')){const code=[];i++;while(i<lines.length&&!lines[i].startsWith('```'))code.push(lines[i++]);if(i>=lines.length)throw new Error('Unclosed code block');i++;html+=`<pre>${escape(code.join('\n'))}</pre>`;continue;}
    if(line.startsWith('|')){const rows=[];while(i<lines.length&&lines[i].startsWith('|'))rows.push(lines[i++].trim().slice(1,-1).split('|').map(cell=>cell.trim()));if(rows.length<3)throw new Error('Incomplete checkpoint table');const [head,,...body]=rows;if(body.some(row=>row.length!==head.length))throw new Error('Checkpoint column mismatch');tableRows+=body.length;html+=`<div class="table-wrap"><table><thead><tr>${head.map(cell=>`<th scope="col">${inline(cell)}</th>`).join('')}</tr></thead><tbody>${body.map(row=>`<tr>${row.map(cell=>`<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;continue;}
    if(line.startsWith('- ')){const items=[];while(i<lines.length&&lines[i].startsWith('- '))items.push(lines[i++].slice(2));html+=`<ul>${items.map(item=>`<li>${inline(item)}</li>`).join('')}</ul>`;continue;}
    const paragraph=[line];i++;while(i<lines.length&&!isBoundary(lines[i]))paragraph.push(lines[i++]);html+=`<p>${inline(paragraph.join(' '))}</p>`;
  }
  if(inSection)html+='</section>';if(tableRows!==7)throw new Error('Expected seven concise checkpoint groups');
  const css=`:root{color-scheme:light;--ink:#243b32;--muted:#5b6861;--line:#dce2da;--paper:#fcfcf9}*{box-sizing:border-box}html{scroll-padding-top:20px}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.65 "Segoe UI",Arial,sans-serif}main{max-width:1020px;margin:32px auto;padding:0 28px}header{border-bottom:2px solid var(--ink);padding-bottom:16px}h1{font-size:30px;line-height:1.25;margin:0 0 13px;letter-spacing:-.03em}nav{display:flex;flex-wrap:wrap;gap:8px 20px;font-size:12px}a{color:#325e45;text-underline-offset:3px}a:focus-visible{outline:3px solid #ab843f;outline-offset:4px}h2{font-size:18px;margin:0 0 10px;line-height:1.4}p{margin:8px 0}.spec-section{padding:23px 0 2px}.spec-section+.spec-section{border-top:1px solid var(--line);margin-top:16px}pre{font:13px/1.8 Consolas,monospace;white-space:pre;overflow:auto;padding:16px 20px;margin:8px 0;background:#eef2e9;border:1px solid var(--line);border-radius:4px}code{font:12px Consolas,monospace;background:#eef2e9;padding:2px 4px}.table-wrap{overflow:auto;margin:12px 0}table{width:100%;border-collapse:collapse;font-size:13px;text-align:left;table-layout:fixed}th,td{padding:10px 12px;border:1px solid var(--line);vertical-align:top;overflow-wrap:anywhere}th{background:#edf2e8;font-weight:600}th:first-child,td:first-child{width:68px}th:nth-child(2){width:53%}ul{padding-left:20px;margin:8px 0}li{margin:4px 0}footer{border-top:1px solid var(--line);margin:26px 0;padding:17px 0;display:flex;flex-wrap:wrap;gap:12px 22px;font-size:12px;color:var(--muted)}.source-note{font-size:12px;color:var(--muted)}@media(max-width:650px){main{margin:22px auto;padding:0 16px}h1{font-size:25px}body{font-size:14px}table{font-size:12px}th,td{padding:8px}th:first-child,td:first-child{width:47px}th:nth-child(2){width:49%}pre{font-size:11px;padding:12px}nav{gap:7px 13px}}@page{size:A4;margin:15mm}@media print{body{font-size:10pt;background:white}main{max-width:none;margin:0;padding:0}h1{font-size:21pt}h2{font-size:13pt}nav{display:none}.spec-section{padding-top:5mm}.spec-section+.spec-section{margin-top:4mm}pre{font-size:8pt;padding:3mm}table{font-size:8pt}th,td{padding:2mm}tr,pre{break-inside:avoid}h2{break-after:avoid}footer{font-size:8pt}a{color:inherit}}`;
  const document=`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Concise game structure, checkpoints, attention goals and review priorities."><title>${escape(title)}</title><style>${css}</style></head><body><main><header><h1>${escape(title)}</h1><nav aria-label="Document sections">${sections.map(section=>`<a href="#${section.id}">${escape(section.title)}</a>`).join('')}</nav></header>${html}<footer><span>${wordCount} source words · 5 sections</span><a href="DESIGN-BRIEF.md">Markdown source</a><a href="design-reference.html">Detailed reference</a></footer></main></body></html>\n`;
  const ids=[...document.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);if(ids.length!==new Set(ids).size)throw new Error('Duplicate section IDs');
  if(/<script|https?:\/\/|src=/.test(document))throw new Error('Concise document must stay static and self-contained');
  await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,document);
  const report={kind:'Concise design brief',generatedAt:new Date().toISOString(),output:path.relative(repoRoot,output).split(path.sep).join('/'),outputBytes:Buffer.byteLength(document),sha256:sha(document),source:'../DESIGN-BRIEF.md',sourceSha256:sha(markdown),wordCount,sections:sections.length,checkpointGroups:tableRows,checks:['Source stays below 500 words','Five numbered sections and seven checkpoint groups','Markdown structure parsed and escaped','Section IDs unique','No scripts or external runtime assets'],limits:['Browser and print layout unrun']};
  await fs.writeFile(path.join(sourceDir,'build-report.json'),JSON.stringify(report,null,2)+'\n');
  await fs.writeFile(path.join(sourceDir,'artifact-checks.json'),JSON.stringify({...report,kind:'Static concise-brief verification'},null,2)+'\n');return report;
}
