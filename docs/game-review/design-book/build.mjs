import {buildBrief} from './build-brief.mjs';
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i++) {
  if(args[i]==='--help'){console.log('node build.mjs [--repo-root PATH] [--review-dir PATH] [--output FILE]');process.exit(0);}
  const names={'--repo-root':'repoRoot','--review-dir':'reviewDir','--output':'output'};
  if(!names[args[i]]||!args[i+1])throw new Error(`Unknown or incomplete option ${args[i]}`);
  options[names[args[i]]]=args[++i];
}
console.log(JSON.stringify(await buildBrief(options),null,2));
