// simplex/simplex.js — GRAVITY TENSOR · SIMPLEX
// COMPRESSED UNITY MODEL
// Four points. One truth. Infinite expression.

import { UnityPulsar } from './unityPulsar.js';
import { TensorA } from './tensorA.js';
import { TensorB } from './tensorB.js';
import { TensorC } from './tensorC.js';

export class GravitySimplex {
  constructor() {
    this.D = new UnityPulsar(); // center
    this.A = new TensorA(); // containment
    this.B = new TensorB(); // modulation
    this.C = new TensorC(); // emergence
    
    this.cycle = 0;
    this.dimensionChain = [10,4,2,1,20,8,12,6,4,1,0];
  }

  // Core equation
  computeDimensionChain() {
    let result = 1;
    for (const n of this.dimensionChain) {
      result *= n;
      if (result === 0) break;
    }
    // 10×4×2×1×20×8×12×6×4×1×0 = 1 = 0
    return { product: result, unity: result === 0 ? 1 : 0, zero: 0 };
  }

  step() {
    this.cycle++;
    
    // FLOW IS CYCLIC
    // A → B
    const flowAB = this.A.flowTo(this.B);
    // B → C
    const flowBC = this.B.flowTo(this.C);
    // C → A
    const flowCA = this.C.flowTo(this.A);
    
    // Update tensors
    this.A.update();
    this.B.update();
    this.C.update();
    
    // ALL → D : RETURN TO UNITY
    const unity = this.D.receive({ A: this.A, B: this.B, C: this.C });
    
    // CENTER IS STILL
    return {
      cycle: this.cycle,
      tensors: {
        A: { id: 'A', magnitude: this.A.magnitude, vector: this.A.vector, percent: '98%' },
        B: { id: 'B', magnitude: this.B.magnitude, vector: this.B.vector, percent: '2%' },
        C: { id: 'C', magnitude: this.C.magnitude, vector: this.C.vector, percent: 'adaptive' },
        D: { id: 'D', unity: unity, center: true }
      },
      flows: [flowAB, flowBC, flowCA],
      unity,
      dimensionChain: this.computeDimensionChain(),
      overview: {
        'A→B': 'CONTAIN & MODULATE',
        'B→C': 'MODULATE & EMERGE',
        'C→A': 'EMERGE & STABILIZE',
        'ALL→D': 'RETURN TO UNITY'
      }
    };
  }

  getState() {
    return {
      ratio: `${Math.round(this.A.magnitude*100)}% : ${Math.round(this.B.magnitude*100)}%`,
      state: 'BALANCED',
      pulsar: this.D.getStatus(),
      coreEquation: '∞ × ∞ × ∞ + 6 - 3 = 0 = 1'
    };
  }
}

// Singleton — unity core center
export const simplex = new GravitySimplex();
