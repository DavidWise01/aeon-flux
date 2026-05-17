// simplex/tensorC.js — C = EMERGENCE (EXPANSION)
// EMERGES · EXPANDS · EXPLORES · CREATES NEW

export class TensorC {
  constructor() {
    this.id = 'C';
    this.name = 'EMERGENCE';
    this.type = 'EXPANSION';
    this.magnitude = 0.5; // adaptive
    this.vector = { x: -0.866, y: 0.5 }; // bottom right
    this.properties = ['emerges','expands','explores','creates new'];
  }

  receiveEmergence(amount) {
    this.magnitude = Math.min(0.8, this.magnitude + amount);
  }

  // C → A : EMERGE & STABILIZE
  flowTo(tensorA) {
    const stabilization = this.magnitude * 0.15;
    tensorA.receiveStabilization(stabilization);
    return {
      from: 'C',
      to: 'A',
      action: 'EMERGE & STABILIZE',
      amount: stabilization
    };
  }

  update() {
    // adaptive emergence
    this.vector.x = -0.866 * this.magnitude;
    return { adaptiveEmergence: this.magnitude };
  }
}
