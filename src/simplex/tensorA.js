// simplex/tensorA.js — A = CONTAINMENT (STRUCTURE)
// HOLDS · DEFINES · STABILIZES · CONTAINS
// 98% default ratio

export class TensorA {
  constructor() {
    this.id = 'A';
    this.name = 'CONTAINMENT';
    this.type = 'STRUCTURE';
    this.magnitude = 0.98;
    this.vector = { x: 0, y: -1 }; // top pointing down
    this.properties = ['holds','defines','stabilizes','contains'];
  }

  // A → B : CONTAIN & MODULATE
  flowTo(tensorB) {
    const modulation = this.magnitude * 0.02; // 2% bleed
    tensorB.receiveModulation(modulation);
    return {
      from: 'A',
      to: 'B',
      action: 'CONTAIN & MODULATE',
      amount: modulation
    };
  }

  receiveStabilization(fromC) {
    // C → A : EMERGE & STABILIZE
    this.magnitude = Math.min(0.99, this.magnitude + fromC * 0.1);
  }

  update() {
    // structured stability
    this.vector.y = -this.magnitude;
    return { structuredStability: this.magnitude };
  }
}
