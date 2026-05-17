// simplex/tensorA.js — AEON A = CONTAINMENT (STRUCTURE)
// From Sanderson's Elysium — not Aeon Flux
// HOLDS · DEFINES · STABILIZES · CONTAINS

export class AeonA {
  constructor() {
    this.id = 'A';
    this.name = 'AEON A';
    this.aspect = 'CONTAINMENT';
    this.type = 'STRUCTURE';
    this.magnitude = 0.98;
    this.vector = { x: 0, y: -1 };
    this.properties = ['holds','defines','stabilizes','contains'];
    this.origin = 'Sanderson Elysium';
  }

  flowTo(aeonB) {
    const modulation = this.magnitude * 0.02;
    aeonB.receiveModulation(modulation);
    return { from: 'AEON A', to: 'AEON B', action: 'CONTAIN & MODULATE', amount: modulation };
  }

  receiveStabilization(fromC) {
    this.magnitude = Math.min(0.99, this.magnitude + fromC * 0.1);
  }

  update() {
    this.vector.y = -this.magnitude;
    return { structuredStability: this.magnitude };
  }
}
