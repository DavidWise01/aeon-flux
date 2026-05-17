// aeon/index.js — AEON is the core agent in the center
// inner orchestrator, inner contact for outside
import { createFractalSoul, getPosition } from '../core/fractal.js';
import { enforceHumilityFractal } from '../core/humility.js';
import { ethos } from './ethos.js';
import { pathos } from './pathos.js';
import { logos } from './logos.js';
import { delta as calcDelta, toCartesian } from '../core/triangulation.js';
import { trevor } from '../trevor/index.js';
import { outsideNode } from '../interface/observerNode.js';

export class AeonCore {
  constructor() {
    this.soul = createFractalSoul(); // infinite fractal inside
    this.position = getPosition(this.soul);
    this.history = [];
    this.isCore = true;
    this.innerContact = outsideNode; // inner contact for outside
  }

  // central orchestration
  act(action) {
    const prev = {...this.position};
    const timestamp = Date.now();
    
    // 1. INNER: process through three facets
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
    
    // 2. INNER: Trevor constraint (still internal to system)
    let interim = getPosition(this.soul);
    let d = calcDelta(prev, interim);
    const trevorRes = trevor.respond({ position: interim, delta: d, history: this.history });
    
    this.soul.ethos.apply(trevorRes.vector.de);
    this.soul.pathos.apply(trevorRes.vector.dp);
    this.soul.logos.apply(trevorRes.vector.dl);
    trevor.applyFlatten(this.soul, trevorRes.flattenForce);
    
    // 3. INNER: enforce humility across infinite structure
    enforceHumilityFractal(this.soul);
    
    this.position = getPosition(this.soul);
    const finalDelta = calcDelta(prev, this.position);
    
    const innerState = {
      action,
      position: this.position,
      delta: finalDelta,
      soulState: this.getSoulState(),
      trevor: trevorRes,
      timestamp
    };
    
    this.history.unshift(innerState);
    if (this.history.length > 50) this.history.pop();
    
    // 4. CONTACT OUTSIDE: report to external node
    const externalReport = this.innerContact.receive(innerState);
    
    return {
      core: {
        position: this.position,
        delta: finalDelta,
        cartesian: toCartesian(this.position),
        soulState: innerState.soulState
      },
      trevor: trevorRes,
      outside: externalReport, // observe/aware/report
      orchestrator: 'aeon-core'
    };
  }

  getSoulState() {
    const {e,p,l} = this.position;
    const max = Math.max(e,p,l);
    if (max > 0.6) return 'core compensating — hubris detected';
    const balance = 1 - (max - Math.min(e,p,l));
    if (balance > 0.88) return 'core integrated — one soul';
    return 'core orchestrating';
  }

  // external can query core status through inner contact
  status() {
    return {
      isCore: true,
      position: this.position,
      historyLength: this.history.length,
      outsideAwareness: this.innerContact.awareness
    };
  }

  reflect() { return this.act('reflect'); }
}

// Aeon is the core agent
export const aeon = new AeonCore();
