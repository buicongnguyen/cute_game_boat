import { CABIN_PEN, gardenGround } from './cabin-garden.ts';
import { findRoute, clearSegment, blocked, approach, type Obstacle } from './navigation.ts';
import * as M from './model.ts';
import { HelperView } from './helper-view.ts';
import { helperOf, nextTask, stillDue, type FarmHelperTask } from './farm-helper.ts';

export const FARM_HELPER_HOME = { x: CABIN_PEN.x + 1, z: CABIN_PEN.z + 2.5 };
interface Frame {
  state: M.SaveState | null; context: unknown; act: boolean; pending: boolean; now: number;
  position(uid: number): { x: number; z: number } | undefined;
  work(task: FarmHelperTask): boolean;
  obstacles?: Obstacle[];
}

/** Same six rigid helper.glb parts as the gardener; visitors only see a harmless patrol. */
export class FarmHelperView {
  private robot = new HelperView();
  readonly group = this.robot.group;
  x = FARM_HELPER_HOME.x; z = FARM_HELPER_HOME.z; facing = 0;
  mode: 'idle' | 'walk' | 'work' = 'idle';
  task: FarmHelperTask | null = null;
  private state: M.SaveState | null = null;
  private context: unknown;
  private path: {x:number;z:number}[] = [];
  private wait = 0; private workLeft = 0; private patrol = 0;
  constructor() { this.group.name = 'animal-pen-helper'; }
  reset() { this.x = FARM_HELPER_HOME.x; this.z = FARM_HELPER_HOME.z; this.mode = 'idle'; this.task = null; this.wait = 0; this.workLeft = 0; this.path = []; }
  update(dt: number, f: Frame) {
    const s = f.state;
    if (s !== this.state || f.context !== this.context) { this.reset(); this.state = s; this.context = f.context; }
    const h = s && helperOf(s), show = !!s && M.penBuilt(s) && !!h?.owned;
    if (!show || !s || !h) { this.robot.present(dt, { visible: false, x: this.x, z: this.z, facing: this.facing, mode: 'idle' }); return; }
    if (h.paused || f.pending) { this.task = null; this.mode = 'idle'; this.workLeft = 0; }
    if (this.mode === 'work') {
      this.workLeft -= dt;
      if (this.workLeft <= 0) {
        // Look again before acting: the task was picked up to half a second before the walk and the pose.
        if (f.act && this.task && stillDue(s, this.task, f.now)) f.work(this.task);
        this.task = null; this.mode = 'idle'; this.wait = .6;
      }
    } else if ((this.wait -= dt) <= 0 && !h.paused && !f.pending) {
      this.wait = .5;
      if (f.act) this.task = nextTask(s, this, f.now);
      else if (!this.task) {
        const animals = M.farmOf(s).animals.filter(a => a.kind !== 'dog');
        const animal = animals.length ? animals[(this.patrol++) % animals.length] : undefined;
        this.task = animal ? { kind: 'collect', uid: animal.uid } : null;
      }
    }
    const target = this.task && f.position(this.task.uid);
    if (this.task && !target) { this.task = null; this.mode = 'idle'; }
    if (this.mode !== 'work') {
      const obstacles = f.obstacles ?? [];
      const options = { clearance: .3, bounds: 30, gridSize: .5, walkable: (p:{x:number;z:number}) => gardenGround(p.x,p.z,.3), maxIterations: 6000 };
      const goal = target && blocked(target, obstacles, options)
        ? approach(this, target, 0, obstacles, .65, options) ?? target : target ?? FARM_HELPER_HOME;
      let next = goal;
      if (!clearSegment(this,goal,obstacles,options)) {
        const end=this.path.at(-1); if(!end||Math.hypot(end.x-goal.x,end.z-goal.z)>1.5||this.path[0]&&!clearSegment(this,this.path[0],obstacles,options))this.path=findRoute(this,goal,obstacles,options);
        while(this.path.length&&Math.hypot(this.path[0].x-this.x,this.path[0].z-this.z)<.15)this.path.shift();
        next=this.path[0]??this;
      } else this.path=[];
      const dx = next.x - this.x, dz = next.z - this.z, distance = Math.hypot(dx, dz), stand = next===goal?(target && goal===target ? .72 : .04):.02;
      if (distance > stand + .001) {
        const step = Math.min(distance - stand, dt * 1.7); this.x += dx / distance * step; this.z += dz / distance * step; this.mode = 'walk';
        this.facing += Math.atan2(Math.sin(Math.atan2(dx, dz) - this.facing), Math.cos(Math.atan2(dx, dz) - this.facing)) * Math.min(1, dt * 10);
      } else if (this.task && next === goal && !f.pending && !h.paused) { this.mode = 'work'; this.workLeft = f.act ? .8 : 1.6; }
      else this.mode = 'idle';
    }
    this.robot.present(dt, { visible: true, x: this.x, z: this.z, facing: this.facing, mode: this.mode, work: this.task?.kind === 'feed' ? 'plant' : 'harvest' });
  }
}
