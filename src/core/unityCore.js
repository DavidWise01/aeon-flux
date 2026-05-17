// src/core/unityCore.js — Aeon becomes Unity Pulsar center
import { simplex } from '../simplex/simplex.js';

export class UnityCore {
  constructor() {
    this.simplex = simplex;
    this.isCenter = true;
  }

  act(action = 'pulse') {
    // Action modulates the tensors
    if (action === 'disrupt') {
      this.simplex.B.magnitude = Math.min(0.1, this.simplex.B.magnitude + 0.01);
    }
    if (action === 'stabilize') {
      this.simplex.A.magnitude = Math.min(0.99, this.simplex.A.magnitude + 0.005);
    }
    
    const result = this.simplex.step();
    
    return {
      unityCore: true,
      center: 'D',
      gravityTensors: result.tensors,
      flows: result.flows,
      unity: result.unity,
      state: this.simplex.getState(),
      equation: '∞×∞×∞+6-3=0=1',
      witness: result.unity.one === 1
    };
  }

  status() {
    return this.simplex.getState();
  }
}

export const aeonUnity = new UnityCore();
