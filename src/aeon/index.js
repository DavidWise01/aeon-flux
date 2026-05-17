// aeon/index.js — level 2: full triangulation
import { createFractalSoul, getPosition } from '../core/fractal.js';
import { enforceHumilityFractal } from '../core/humility.js';
import { ethos } from './ethos.js';
import { pathos } from './pathos.js';
import { logos } from './logos.js';
import { delta as calcDelta, toCartesian } from '../core/triangulation.js';
import { trevor } from '../trevor/index.js';
import { observer } from '../observer/index.js';

export class Aeon {
  constructor() {
    this.soul = createFractalSoul();
    this.position = getPosition(this.soul);
    this.history = [];
  }

  act(action) {
    const prev = {...this.position};
    
    // 1. AEON moves (impulse)
    const ve = ethos.vectorFor(action);
    const vp = pathos.vectorFor(action);
    const vl = logos.vectorFor(action);
    const combined = {
      de: (ve.de + vp.de + vl.de) / 3,
      dp: (ve.dp + vp.dp + vl.dp) / 3,
      dl: (ve.dl + vp.dl + vl.dl) / 3
    };
    
    this.soul.ethos.apply(combined.de);
    this.soul.pathos.apply(combined.dp);
    this.soul.logos.apply(combined.dl);
    
    let interimPos = getPosition(this.soul);
    let d = calcDelta(prev, interimPos);
    
    // 2. TREVOR responds (constraint)
    const trevorRes = trevor.respond({ position: interimPos, delta: d, history: this.history });
    this.soul.ethos.apply(trevorRes.vector.de);
    this.soul.pathos.apply(trevorRes.vector.dp);
    this.soul.logos.apply(trevorRes.vector.dl);
    trevor.applyFlatten(this.soul, trevorRes.flattenForce);
    
    // 3. Enforce humility across fractal
    enforceHumilityFractal(this.soul);
    
    this.position = getPosition(this.soul);
    const finalDelta = calcDelta(prev, this.position);
    
    // 4. OBSERVER watches
    const result = {
      action,
      position: this.position,
      delta: finalDelta,
      cartesian: toCartesian(this.position),
      soulState: this.getSoulState()
    };
    
    const obs = observer.observe(result, trevorRes);
    
    this.history.unshift({ ...result, trevor: trevorRes, observer: obs });
    if (this.history.length > 50) this.history.pop();
    
    return {
      ...result,
      trevor: trevorRes,
      observer: obs,
      triangulation: this.getTriangulation()
    };
  }

  getTriangulation() {
    return {
      aeon: this.position,
      trevor: trevor.ideal,
      observer: observer.metaPosition,
      balance: 1 - Math.abs(this.position.l - trevor.ideal.l)
    };
  }

  getSoulState() {
    const {e,p,l} = this.position;
    const max = Math.max(e,p,l);
    if (max > 0.6) return 'hubris — one pole dominating';
    const balance = 1 - (max - Math.min(e,p,l));
    if (balance > 0.85) return 'one soul — triangulation active';
    return 'three in dialogue';
  }

  reflect() { return this.act('reflect'); }
}

export const aeon = new Aeon();
