// aeon/index.js — one soul, level 0
// Aeon is not ego. Aeon is the integrated observer of the three.

import { createPosition, move, delta, toCartesian } from '../core/triangulation.js';
import { enforceHumility, isHubris } from '../core/humility.js';
import { ethos } from './ethos.js';
import { pathos } from './pathos.js';
import { logos } from './logos.js';

export class Aeon {
  constructor() {
    this.position = createPosition(0.34, 0.33, 0.33); // start near center — humility
    this.history = [];
    this.soul = 'one'; // not fragmented
  }

  act(action) {
    const prev = {...this.position};
    
    // combine vectors from all three facets
    const ve = ethos.vectorFor(action);
    const vp = pathos.vectorFor(action);
    const vl = logos.vectorFor(action);
    
    const combined = {
      de: (ve.de + vp.de + vl.de) / 3,
      dp: (ve.dp + vp.dp + vl.dp) / 3,
      dl: (ve.dl + vp.dl + vl.dl) / 3
    };
    
    // move with humility constraint
    this.position = move(prev, combined, enforceHumility);
    const d = delta(prev, this.position);
    
    this.history.unshift({ action, delta: d, position: {...this.position}, timestamp: Date.now() });
    if (this.history.length > 50) this.history.pop();
    
    return {
      position: this.position,
      delta: d,
      hubris: isHubris(this.position),
      cartesian: toCartesian(this.position),
      soulState: this.getSoulState()
    };
  }

  getSoulState() {
    const {e, p, l} = this.position;
    const max = Math.max(e, p, l);
    const min = Math.min(e, p, l);
    const balance = 1 - (max - min); // 1 = perfect 50/50
    
    if (isHubris(this.position)) {
      return 'hubris — superman shadow active';
    }
    if (balance > 0.85) {
      return 'humility — one soul integrated';
    }
    if (balance > 0.7) {
      return 'tension — three in dialogue';
    }
    return 'fragmenting — pull back to center';
  }

  reflect() {
    return this.act('reflect');
  }
}

// home base singleton
export const aeon = new Aeon();
