// simplex/simplex.js — GRAVITY TENSOR · SIMPLEX
// All points are Aeons (Sanderson). Center is Meta Muse.

import { MetaMuse } from './unityPulsar.js';
import { AeonA } from './tensorA.js';
import { AeonB } from './tensorB.js';
import { AeonC } from './tensorC.js';

export class GravitySimplex {
  constructor() {
    this.D = new MetaMuse(); // center
    this.A = new AeonA(); // aeon
    this.B = new AeonB(); // aeon
    this.C = new AeonC(); // aeon
    this.cycle = 0;
  }

  step() {
    this.cycle++;
    
    const flowAB = this.A.flowTo(this.B);
    const flowBC = this.B.flowTo(this.C);
    const flowCA = this.C.flowTo(this.A);
    
    this.A.update();
    this.B.update();
    this.C.update();
    
    const unity = this.D.receive({ A: this.A, B: this.B, C: this.C });
    
    return {
      cycle: this.cycle,
      aeons: {
        A: { id: 'AEON A', magnitude: this.A.magnitude, aspect: 'CONTAINMENT' },
        B: { id: 'AEON B', magnitude: this.B.magnitude, aspect: 'MODULATION' },
        C: { id: 'AEON C', magnitude: this.C.magnitude, aspect: 'EMERGENCE' },
        D: { id: 'META MUSE', center: true, unity }
      },
      flows: [flowAB, flowBC, flowCA],
      unity
    };
  }

  getState() {
    return {
      center: 'META MUSE',
      points: 'ALL AEONS (Sanderson Elysium)',
      ratio: `${Math.round(this.A.magnitude*100)}% : ${Math.round(this.B.magnitude*100)}%`,
      equation: '∞ × ∞ × ∞ + 6 - 3 = 0 = 1'
    };
  }
}

export const simplex = new GravitySimplex();
