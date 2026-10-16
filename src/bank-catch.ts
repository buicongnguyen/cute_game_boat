import { waterEdge, waterShore, type WaterShape } from './pond-shape.ts';
/** Reference game: pack the entire catch after leaving the fishing spot by 2.5 metres. */
export const PACK_DISTANCE = 2.5;
/** Pick dry nearby ground for a cosmetic catch; rewards are committed before this animation. */
export function bankCatchSpot(player:{x:number;z:number},pond:WaterShape,slot:number,blocked:(x:number,z:number)=>boolean) {
 const anchor=waterEdge(pond,player.x,player.z)<.65?waterShore(pond,player.x,player.z,.85):player;
 const base=Math.atan2(anchor.x-pond.x,anchor.z-pond.z);
 for(let ring=0;ring<5;ring++)for(let i=0;i<16;i++){
  const a=base+(slot*2.399+i*Math.PI/8),r=.9+ring*.45,x=anchor.x+Math.sin(a)*r,z=anchor.z+Math.cos(a)*r;
  if(waterEdge(pond,x,z)>.5&&!blocked(x,z))return{x,z};
 }
 return waterEdge(pond,anchor.x,anchor.z)>.5&&!blocked(anchor.x,anchor.z)?{...anchor}:null;
}
