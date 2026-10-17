const clean=value=>JSON.parse(JSON.stringify(value));
const ref=(path,symbol)=>({path,symbol});
const slug=text=>text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

export function extractSection(markdown,heading) {
  const lines=markdown.replace(/^\uFEFF/,'').split(/\r?\n/),start=lines.findIndex(line=>line.trim()===heading);
  if(start<0)throw new Error(`Maintained story heading missing: ${heading}`);
  const depth=heading.match(/^#+/)[0].length;
  let end=start+1;for(;end<lines.length;end++){const next=lines[end].match(/^(#+) /);if(next&&next[1].length<=depth)break;}
  return {heading,line:start+1,markdown:lines.slice(start+1,end).join('\n').trim()};
}

export function extractTable(markdown) {
  const rows=markdown.split('\n').filter(line=>line.trim().startsWith('|')).map(line=>line.trim().slice(1,-1).split('|').map(cell=>cell.trim()));
  if(rows.length<3)return [];
  return rows.slice(2).map(cells=>Object.fromEntries(rows[0].map((key,index)=>[key,cells[index]??''])));
}

export function createMilestones({catalog,progression,gifts}) {
  let priorLevel=1;
  return catalog.story.map((step,index)=>{
    const sampleLevel=step.condition==='level'?step.target:priorLevel;
    if(step.condition==='level')priorLevel=Math.max(priorLevel,step.target);
    const completion=step.condition==='equipped'?'A weapon or disguise is currently equipped'
      :step.condition==='level'?`Current level is at least ${step.target}`
      :step.condition==='plots'?`At least ${step.target} extra garden bed is placed beyond the nine starter beds`
      :step.condition==='decor'?`At least ${step.target} decorations are currently placed`
      :step.condition==='visited'?`At least ${step.target} worlds have been visited, including home; spotting a world alone does not count`
      :step.condition==='disguise'?'A disguise is currently equipped'
      :step.event==='craft'?`Current craft or purchase events reach ${step.target}, or ordinary owned gear satisfies catch-up`
      :step.event==='sell'?`Sales during this active step earn ${step.target} energy`
      :`Matching ${step.event} events during this active step reach ${step.target}`;
    const extra=gifts.storyItems(index,step.end)??{};
    const variant=index===11?{title:'Locked-kitchen substitute',condition:'Normal or Hard while below kitchen level 14',event:'harvest',target:10,
      completion:'Harvest ten crops while this substituted goal is active. The robot companion gift remains the same.',
      note:'Changing the active event through difficulty or kitchen availability resets event progress; the new prose does not override that rule.'}:null;
    return {id:`story-${index+1}`,step:index+1,index,chapter:step.chapter,title:step.title,event:step.event??null,condition:step.condition??null,target:step.target,
      icon:step.icon,completion,status:'Current implementation',claimRequired:true,...(variant?{variant,difficultyVariant:variant.note}:{}),
      reward:{formula:'Energy and XP scale with claim-time level; see shared storyRewardAt',exampleLevel:sampleLevel,
        example:clean(progression.storyRewardAt(sampleLevel,index,step.end)),
        items:Object.entries(extra).map(([id,count])=>({id,name:catalog.items[id]?.name??id,count})),
        examples:[...new Set([sampleLevel,Math.max(sampleLevel,8),Math.max(sampleLevel,25)])].map(level=>({level,...clean(progression.storyRewardAt(level,index,step.end))})),
        caveat:'Arithmetic samples at the stated level, not a simulated route or predicted claim-time level. Full-world visitation also needs its actual landing gates.'},
      evidence:[ref('src/content.ts','STORY_STEPS'),ref('src/progression.ts','storyStep / condition / recordEvent / claimProgress'),ref('src/story-gifts.ts','STORY_GIFTS / storyItems / storyEnergy / storyXp')]};
  });
}

export function createChapters({config,storyText,allMilestones,currentChapter,proposedChapter}) {
  if(!Array.isArray(config.chapters)||config.chapters.length!==4)throw new Error('book-config must select exactly four main-story chapters');
  const counts=[9,6,6,8],chapters=[];
  for(const metadata of config.chapters) {
    const index=metadata.index,number=index+1,milestones=allMilestones.filter(step=>step.chapter===index);
    if(milestones.length!==counts[index])throw new Error(`Chapter ${number} milestone count differs from current catalog`);
    const common={id:`chapter-${number}`,index,title:metadata.title,subtitle:metadata.subtitle,stepRange:metadata.stepRange,
      coverAssetId:metadata.coverAssetId,assetIds:metadata.assetIds,current:{milestones},
      sourcePaths:['docs/game-review/STORY.md','src/content.ts','src/progression.ts','src/story-gifts.ts',...(metadata.sourcePaths??[])]};
    if(index===0) {
      chapters.push({...common,current:{...currentChapter,milestones},proposal:{...proposedChapter,reviewQuestions:[],sourcePaths:common.sourcePaths}});continue;
    }
    const heading=`### Proposed chapter ${number} ${metadata.title}`,chapter=extractSection(storyText,heading);
    const narrative=extractSection(chapter.markdown,'#### Narrative');
    const scenes=extractSection(chapter.markdown,'#### Playable scenes');
    const pacing=extractSection(chapter.markdown,'#### Pacing and player choice');
    const acceptance=extractSection(chapter.markdown,'#### Review and acceptance');
    const paragraphs=body=>body.split(/\n\s*\n/).map(p=>p.trim()).filter(p=>p&&!/^(Current-rule references:|Source grounding:|Source references:|Sources:)/.test(p));
    const openingBeats=extractTable(scenes.markdown).map(row=>({id:slug(row.Beat),title:row.Beat,moment:row['Proposed moment'],
      action:row['Player action and consequence'],boundary:row['Existing support / change required'],status:'Proposal not implemented'}));
    const reviewQuestions=extractTable(acceptance.markdown).map(row=>({id:row.ID,question:row.Question,check:row['Evidence needed']}));
    if(openingBeats.length!==counts[index])throw new Error(`Chapter ${number} scene count must match its ${counts[index]} milestones`);
    if(reviewQuestions.length<3||reviewQuestions.some(row=>!row.id||!row.question||!row.check))throw new Error(`Chapter ${number} needs its maintained review questions`);
    const linkedSources=[...chapter.markdown.matchAll(/\]\(\.\.\/\.\.\/((?:src|tests)\/[^)]+)\)/g)].map(match=>match[1]);
    common.sourcePaths=[...new Set([...common.sourcePaths,...linkedSources])];
    chapters.push({...common,proposal:{id:`proposal-chapter-${number}`,status:'Proposal not implemented',title:metadata.title,
      source:'docs/game-review/STORY.md',sourceHeading:heading,sourceLine:chapter.line,sourcePaths:common.sourcePaths,
      sections:[{id:`chapter-${number}-narrative`,title:'Narrative',paragraphs:paragraphs(narrative.markdown)},
        {id:`chapter-${number}-pacing`,title:'Pacing and player choice',paragraphs:paragraphs(pacing.markdown)}],openingBeats,reviewQuestions}});
  }
  const steps=chapters.flatMap(chapter=>chapter.current.milestones.map(step=>step.step));
  if(steps.length!==29||steps.some((step,index)=>step!==index+1))throw new Error('Main-story step coverage must be unique and complete from 1 through 29');
  return chapters;
}
