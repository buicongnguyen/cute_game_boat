/** Shared home-pond outline for water, fishing and movement. Other lakes stay round. */
export const HOME_POND = { x: -7.5, z: 11.2, rx: 3.3, rz: 2.4, rectangular: true } as const;
export interface WaterShape { x: number; z: number; r: number; rz?: number; rectangular?: boolean }
const clamp = (v:number, r:number) => Math.max(-r,Math.min(r,v));
/** Signed distance from water (negative inside). */
export function waterEdge(p:WaterShape,x:number,z:number) {
 if(!p.rectangular)return Math.hypot(x-p.x,z-p.z)-p.r;
 const dx=Math.abs(x-p.x)-p.r,dz=Math.abs(z-p.z)-(p.rz??p.r);
 return Math.hypot(Math.max(0,dx),Math.max(0,dz))+Math.min(0,Math.max(dx,dz));
}
export function clampWater(p:WaterShape,x:number,z:number,gap=0) {
 const rx=Math.max(.1,p.r-gap),rz=Math.max(.1,(p.rz??p.r)-gap);
 if(p.rectangular)return {x:p.x+clamp(x-p.x,rx),z:p.z+clamp(z-p.z,rz)};
 const d=Math.hypot(x-p.x,z-p.z),k=d>rx?rx/d:1;return {x:p.x+(x-p.x)*k,z:p.z+(z-p.z)*k};
}
export function waterShore(p:WaterShape,x:number,z:number,gap:number) {
 if(!p.rectangular){const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz)||1;return{x:p.x+(dx||(!dz?1:0))/d*(p.r+gap),z:p.z+dz/d*(p.r+gap)};}
 const rx=p.r+gap,rz=(p.rz??p.r)+gap,dx=x-p.x,dz=z-p.z;let px=clamp(dx,rx),pz=clamp(dz,rz);
 if(Math.abs(dx)<rx&&Math.abs(dz)<rz){if(rx-Math.abs(dx)<rz-Math.abs(dz))px=dx<0?-rx:rx;else pz=dz<0?-rz:rz;}
 return{x:p.x+px,z:p.z+pz};
}
