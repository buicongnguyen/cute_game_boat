import {readFile, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createMilestones,createChapters} from './chapters.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ref = (file, symbol, note = '') => ({path:file, symbol, note});
const clean = value => JSON.parse(JSON.stringify(value));
const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

function section(markdown, heading) {
  const lines = markdown.replace(/^\uFEFF/,'').split(/\r?\n/);
  const start = lines.findIndex(line => line.trim() === heading);
  if(start < 0) throw new Error(`STORY.md heading missing: ${heading}`);
  const depth = heading.match(/^#+/)[0].length;
  let end = start + 1;
  for(;end < lines.length;end++) {
    const next = lines[end].match(/^(#+) /);
    if(next && next[1].length <= depth) break;
  }
  return {heading, line:start+1, markdown:lines.slice(start+1,end).join('\n').trim()};
}

function table(markdown) {
  const rows = markdown.split('\n').filter(line => line.trim().startsWith('|')).map(line => line.trim().slice(1,-1).split('|').map(cell => cell.trim()));
  return rows.length < 3 ? [] : rows.slice(2).map(cells => Object.fromEntries(rows[0].map((key,index) => [key,cells[index] ?? ''])));
}

/**
 * Read-only extraction for the designer book. Selectors/captions live in book-config.json;
 * values come from the resolved catalog and exported source rules. STORY.md remains the
 * only authoring source for the proposed plot. No save is read, written or simulated.
 * Node 24+ is required for the project's TypeScript source modules.
 */
export async function buildBookData({repoRoot, reviewDir = path.join(repoRoot,'docs','game-review')} = {}) {
  if(!repoRoot) throw new Error('buildBookData needs repoRoot');
  repoRoot = path.resolve(repoRoot); reviewDir = path.resolve(reviewDir);
  const configPath = path.join(here,'book-config.json');
  const [configText, catalogText, storyText] = await Promise.all([
    readFile(configPath,'utf8'),
    readFile(path.join(reviewDir,'catalog-snapshot.json'),'utf8'),
    readFile(path.join(reviewDir,'STORY.md'),'utf8'),
  ]);
  const config = JSON.parse(configText.replace(/^\uFEFF/,''));
  const catalog = JSON.parse(catalogText.replace(/^\uFEFF/,''));
  const source = file => import(pathToFileURL(path.join(repoRoot,file)).href);
  // Import content first, then model, matching the repository's catalog extractor.
  const content = await source('src/content.ts');
  const model = await source('src/model.ts');
  const progression = await source('src/progression.ts');
  const gifts = await source('src/story-gifts.ts');
  const first = await source('src/first-run.ts');
  const friends = await source('src/friends.ts');
  const friendState = await source('src/friends-state.ts');
  const house = await source('src/house-activities.ts');
  const enemies = await source('src/enemy-types.ts');
  const gates = await source('src/level-gates.ts');
  const icons = await source('src/item-icons.ts');
  const exists = async relative => {try {await access(path.join(repoRoot,relative));return true;} catch{return false;}};
  const fileInfo = async relative => {const raw=await readFile(path.join(repoRoot,relative));return {path:relative,sha256:createHash('sha256').update(raw).digest('hex')};};
  const premise = section(storyText,config.premiseHeading);
  const chapter = section(storyText,config.storyHeading);
  const opening = section(storyText,config.openingHeading);
  if(catalog.story.length!==content.STORY_STEPS.length)throw new Error('Refresh catalog: main-story definition count changed');
  for(const [index,step] of catalog.story.entries())for(const key of ['title','chapter','target','event','condition']) {
    if((step[key]??null)!==(content.STORY_STEPS[index][key]??null))throw new Error(`Refresh catalog: story step ${index+1} ${key} differs from live source`);
  }
  const allMilestones=createMilestones({catalog,progression,gifts});
  const milestones=allMilestones.filter(step=>step.chapter===config.chapterIndex);
  if(milestones.length!==9)throw new Error('Expected nine first-chapter milestones');

  const assets = [];
  for(const selected of config.assets) {
    const record = {id:selected.id,kind:selected.kind,role:selected.role,status:'Current implementation',name:selected.id,
      values:{},sourcePaths:[],iconCandidates:[],modelCandidates:selected.modelCandidates ?? [],evidence:[]};
    if(selected.kind === 'item') {
      const item = catalog.items[selected.id];
      if(!item) throw new Error(`Unknown selected item ${selected.id}`);
      const crop = catalog.crops[selected.id], fish = catalog.fish[selected.id];
      const recipe = catalog.recipes.find(entry => entry.result === selected.id && entry.station === 'shop') ?? catalog.recipes.find(entry => entry.result === selected.id);
      record.name=item.name; record.icon=item.icon; record.description=item.desc;
      record.values = {item:clean(item),...(crop?{crop:clean(crop),growSeconds:crop.duration/1000,unlockLevel:crop.level}:{}),
        ...(fish?{fish:clean(fish)}:{}),...(recipe?{recipe:clean(recipe)}:{}),
        ...(item.slot?{gearLevel:gates.gearLevel(selected.id)}:{})};
      record.sourcePaths=['src/content.ts','src/item-icons.ts'];
      if(item.slot) record.sourcePaths.push('src/level-gates.ts');
      record.evidence=[ref('src/content.ts',`ITEMS.${selected.id}${crop?` / CROPS.${selected.id}`:''}${fish?` / FISH.${selected.id}`:''}`),ref('src/item-icons.ts','iconPath')];
      const icon = icons.iconPath(selected.id);
      if(icon) record.iconCandidates.push(`public/assets/icons/${icon}`);
      if(crop) record.modelCandidates=['public/assets/models/crops.glb'];
      else if(fish) record.modelCandidates=['public/assets/models/fish.glb'];
      else if(item.slot === 'weapon') record.modelCandidates=['public/assets/models/gear-weapons.glb'];
      else if(['hat','outfit','boots'].includes(item.slot)) record.modelCandidates=['public/assets/models/gear-wear.glb'];
    } else if(selected.kind === 'station') {
      const activity = selected.activityId ? house.ACTIVITIES.find(entry => entry.id === selected.activityId) : null;
      if(selected.activityId && !activity) throw new Error(`Unknown station activity ${selected.activityId}`);
      record.name=activity?.name ?? (selected.id==='garden-bed'?'Garden bed':'Cabin hatch');
      record.icon=activity?.icon ?? (selected.id==='garden-bed'?'🌱':'⚓');
      record.values=activity ? {activity:clean(activity)} : selected.id==='garden-bed'
        ? {startingBeds:model.STARTING_PLOTS ?? content.STARTING_PLOTS,maxBeds:model.MAX_PLOTS,maximumUpgradeLevel:model.BED_MAX_LEVEL,
          firstUpgradeEnergy:model.BED_UPGRADE_BASE,growthMultiplierPerLevel:2}
        : {purpose:'Enter or leave the cabin',kind:'home'};
      if(selected.id==='wishing-cabinet') record.values.wishes=clean(content.UPGRADES);
      if(selected.id==='storage-chest') record.values.note='Normal capacity and item-preservation exceptions are separate; see SYSTEMS-HOME.md.';
      record.sourcePaths=activity?['src/house-activities.ts','src/house-ui.ts']:['src/assets.ts',selected.id==='garden-bed'?'src/model.ts':'src/boat-deck.ts'];
      record.evidence=activity?[ref('src/house-activities.ts',`ACTIVITIES ${selected.activityId}`)]:[ref(record.sourcePaths.at(-1),selected.id==='garden-bed'?'bedUpgradeCost / upgradeBed':'hatch interaction')];
      record.visualNote='Render the current selected model or cabin node; no old outdoor service preview substitutes for this station.';
    } else if(selected.kind === 'character') {
      const friend=friendState.FRIENDS[selected.id];
      record.name=friend.name; record.icon='🍳'; record.description='Current first-harvest helper and the proposed chapter-one speaker.';
      record.values={role:friend.role,tint:friend.tint,hair:friend.hair,welcomeEnergy:friends.WELCOME_ENERGY,
        defaultWelcome:'First successful hand harvest when pending',defaultHome:true,
        legacyCage:clean(friendState.CAGES[selected.id]),legacyNote:'Normally already owned after first harvest; no second mandatory rescue.'};
      record.sourcePaths=['src/friends-state.ts','src/friends.ts','src/friend-view.ts','src/main.ts'];
      record.evidence=[ref('src/friends.ts','firstHarvestGift / welcomeStart'),ref('src/friends-state.ts','FRIENDS.pepper')];
      record.visualNote='Use the actual friend builder to retain Pepper tint, hair, work hat and growth scale; a generic hero model is only the source kit.';
    } else if(selected.kind === 'creature') {
      const enemy=enemies.ENEMY_TYPES[selected.id];
      record.name=enemy.name;record.icon='🍄';record.values={ordinary:clean(enemy),tutorial:clean(first.CRITTER),tutorialCount:first.CRITTERS,
        tutorialLimits:'Only the first kill step of a fresh solo save at home outdoors; online uses its own encounter path.'};
      record.sourcePaths=['src/enemy-types.ts','src/first-run.ts'];record.evidence=[ref('src/enemy-types.ts','ENEMY_TYPES.mushroom'),ref('src/first-run.ts','CRITTER / tendCritters')];
    }
    record.iconCandidates=[...new Set([...record.iconCandidates,...(selected.iconCandidates ?? [])])];
    record.visuals={icons:await Promise.all(record.iconCandidates.map(async candidate => ({path:candidate,exists:await exists(candidate)}))),
      models:await Promise.all(record.modelCandidates.map(async candidate => ({path:candidate,exists:await exists(candidate)})))};
    assets.push(record);
  }

  const currentChapter={id:'chapter-1',index:config.chapterIndex,title:config.title,titleStatus:'Proposed chapter name',
    status:'Current rules',milestones,
    openingFacts:{startingLevel:catalog.defaults.level,startingHealth:catalog.defaults.hp,startingEnergy:catalog.defaults.energy,
      startingBeds:catalog.defaults.plots.length,difficulty:catalog.defaults.settings.difficulty,
      tutorialPlants:first.TUTORIAL_PLANTS,tutorialGrowSeconds:first.TUTORIAL_GROW_MS/1000,
      tutorialLimits:'First eligible level-one plantings while story step one is active; older saves can differ.',welcomeEnergy:friends.WELCOME_ENERGY,
      welcomeTrigger:'First successful hand harvest while pending, separate from the three-harvest goal',keepsBagByDefault:model.keepsBag(catalog.defaults)},
    rules:[{title:'Complete then claim',text:'A matching event fills the active goal; Collect advances to the next one.'},
      {title:'Earlier actions and ownership',text:'Most action goals do not backfill; ordinary gear ownership can satisfy buy or craft goals, and level/equipment conditions read the live save.'},
      {title:'The cabin route',text:'Exchange sells; Magic Mirror buys; the Wishing cabinet spends energy on permanent stats. The crafting bench is a separate service.'},
      {title:'Current and proposed',text:'The Homeward Book scenes are a proposal. The current nine goals remain the source-grounded baseline.'}],
    evidence:[ref('src/first-run.ts','tutorialGrow / calmHud / oneGoal'),ref('src/friends.ts','firstHarvestGift'),ref('src/progression.ts','claimProgress'),ref('src/model.ts','newGame / keepsBag')]};

  const proposedChapter={id:'proposal-chapter-1',title:config.title,workTitle:'The Homeward Book',status:'Proposal not implemented',
    source:'docs/game-review/STORY.md',
    premise:premise.markdown.split(/\n\s*\n/).slice(0,3),
    paragraphs:chapter.markdown.split(/\n\s*\n/),
    sections:[{id:'premise',title:'The Homeward Book',paragraphs:premise.markdown.split(/\n\s*\n/).slice(0,3),sourceHeading:premise.heading,sourceLine:premise.line},
      {id:'chapter-one',title:config.title,paragraphs:chapter.markdown.split(/\n\s*\n/),sourceHeading:chapter.heading,sourceLine:chapter.line}],
    openingBeats:table(opening.markdown).map(row => ({id:slug(row.Beat),title:row.Beat,
      moment:row['Proposed moment'],action:row['Player action and consequence'],boundary:row['Existing support / change required'],status:'Proposal not implemented'})),
    evidence:[ref('docs/game-review/STORY.md',config.storyHeading),ref('docs/game-review/STORY.md',config.openingHeading)]};

  const chapters=createChapters({config,storyText,allMilestones,currentChapter,proposedChapter});
  const selectedAssetIds=new Set(assets.map(asset=>asset.id));
  for(const chapter of chapters)for(const id of [...chapter.assetIds,chapter.coverAssetId])if(!selectedAssetIds.has(id))throw new Error(`Chapter asset does not resolve: ${chapter.id}/${id}`);
  const worlds=Object.entries(catalog.planets).map(([id,world])=>({id,name:world.name,level:world.level,description:world.description,icon:world.icon}));
  if(worlds.length!==9)throw new Error('Expected the nine existing worlds');
  const diagrams = makeDiagrams({milestones,assets,content,catalog,model,config});
  const sourceFiles=['src/content.ts','src/model.ts','src/progression.ts','src/story-gifts.ts','src/first-run.ts','src/friends.ts','src/friends-state.ts','src/house-activities.ts','src/enemy-types.ts','src/level-gates.ts','src/item-icons.ts'];
  return clean({meta:{schemaVersion:1,title:'Cute Game Boat designer book',scope:config.scope,
    baselineCommit:catalog.commit,generatedAt:new Date().toISOString(),sourceFiles:await Promise.all(sourceFiles.map(fileInfo)),
    catalogHash:createHash('sha256').update(catalogText).digest('hex'),storyHash:createHash('sha256').update(storyText).digest('hex'),
    limits:['Read-only data extraction; no gameplay or saves changed.','Source values are not a natural playthrough or measured pacing.','The narrative is extracted from the existing proposal, not implemented content.']},
    currentChapter,proposedChapter,chapters,worlds,totalMilestones:allMilestones.length,assets,diagrams,
    editorial:{config:'book-config.json',notes:config.editorialNotes,
      extraction:'Milestones and item values from catalog-snapshot.json; rewards and constants from exported source rules; proposal paragraphs and opening table from STORY.md; selection and captions from book-config.json.'}});
}

function makeDiagrams({milestones,assets,content,catalog,model,config}) {
  const byId=new Map(assets.map(asset => [asset.id,asset]));
  const milestoneGraph={id:'milestones',title:'The first nine goals',meaning:config.diagramNotes.milestones,status:'Current rules',
    nodes:milestones.map(step => ({id:step.id,label:`${step.step}. ${step.title}`,kind:'goal',icon:step.icon,step:step.step})),
    edges:milestones.slice(0,-1).map((step,index) => ({from:step.id,to:milestones[index+1].id,label:'Complete and collect',kind:'sequence'})),
    limits:['Story order, not a global unlock tree. Other home actions can remain available.']};
  const selectedCrops=assets.filter(asset => asset.values.crop && ['carrot','radish','pumpkin','mint','bean'].includes(asset.id));
  const levels=[...new Set(selectedCrops.map(asset => asset.values.crop.level))].sort((a,b)=>a-b);
  const cropGraph={id:'crop-unlocks',title:'Crop choices through level five',meaning:config.diagramNotes['crop-unlocks'],status:'Current rules',
    nodes:[...levels.map(level => ({id:`level-${level}`,label:`Level ${level}`,kind:'level'})),...selectedCrops.map(asset => ({id:asset.id,label:asset.name,kind:'crop',assetId:asset.id,detail:`${asset.values.growSeconds}s base · ${asset.values.crop.xp} XP`}))],
    edges:selectedCrops.map(asset => ({from:`level-${asset.values.crop.level}`,to:asset.id,label:'Can plant',kind:'unlock'})),
    limits:['Base times are for an unupgraded bed. Eligible tutorial plantings have a separate 20-second override.','Selected chapter examples only; this graph is not the entire crop catalog.']};
  const recipe=catalog.recipes.find(entry => entry.result==='armor_leather' && entry.station==='shop');
  const recipeGraph={id:'material-recipe',title:'A material recipe at the Magic Mirror',meaning:config.diagramNotes['material-recipe'],status:'Current rules',
    nodes:[{id:'leather-input',label:`Leather ×${recipe.materials.leather}`,kind:'material',assetId:'leather'},
      {id:'energy-input',label:`${recipe.energy} energy`,kind:'currency'},
      {id:'mirror-recipe',label:'Magic Mirror purchase',kind:'transaction',assetId:'magic-mirror'},
      {id:'leather-output',label:byId.get('armor_leather').name,kind:'equipment',assetId:'armor_leather'}],
    edges:[{from:'leather-input',to:'mirror-recipe',label:'Consumed',kind:'ingredient'},{from:'energy-input',to:'mirror-recipe',label:'Spent',kind:'cost'},{from:'mirror-recipe',to:'leather-output',label:'One outfit',kind:'result'}],
    recipe:clean(recipe),limits:['Optional recipe example, not required to finish chapter one.','This is station=shop in the catalog. Workbench crafting is a separate branch.']};
  const wishGraph={id:'stat-wishes',title:'Four permanent wishes',meaning:config.diagramNotes['stat-wishes'],status:'Current rules',
    nodes:[{id:'cabinet',label:'Wishing cabinet',kind:'station',assetId:'wishing-cabinet'},...Object.entries(content.UPGRADES).map(([id,wish]) => ({id:`wish-${id}`,label:wish.name,kind:'upgrade',detail:`${wish.base} energy at rank 0 · +${id==='crit'?`${wish.step*100}%`:wish.step}`,values:clean(wish)}))],
    edges:Object.keys(content.UPGRADES).map(id => ({from:'cabinet',to:`wish-${id}`,label:'Choose and spend energy',kind:'upgrade'})),
    formula:'Cost at rank r = ceil(base × 1.38^r)',limits:['The critical chance wish has a 28-rank cap.','Choosing any one eligible wish records the step-six upgrade event; there is no prescribed stat.','Not weapon forging, gear bench levels or garden-bed levels.']};
  const bedGraph={id:'bed-growth',title:'A garden bed can grow with you',meaning:'A separate optional upgrade system, not the permanent-stat objective.',status:'Current rules',
    nodes:[{id:'bed-0',label:'Bed level 0',kind:'bed',assetId:'garden-bed',detail:'Base crop duration'},...Array.from({length:model.BED_MAX_LEVEL},(_,index) => ({id:`bed-${index+1}`,label:`Bed level ${index+1}`,kind:'bed',assetId:'garden-bed',detail:`${2**(index+1)}× growth speed`}))],
    edges:Array.from({length:model.BED_MAX_LEVEL},(_,index) => ({from:`bed-${index}`,to:`bed-${index+1}`,label:`${Math.round(model.BED_UPGRADE_BASE*2**index)} energy on Easy`,kind:'upgrade'})),
    limits:['Normal and Hard multiply these prices by 1.5.','A growing crop keeps its completion fraction when the bed is upgraded.','Optional development; chapter one does not require upgrading a bed.']};
  return [milestoneGraph,cropGraph,recipeGraph,wishGraph,bedGraph];
}
