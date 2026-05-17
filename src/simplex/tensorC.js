// simplex/tensorC.js — AEON C = EMERGENCE (EXPANSION)
// From Sanderson's Elysium
// EMERGES · EXPANDS · EXPLORES · CREATES NEW

export class AeonC {
  constructor() {
    this.id = 'C';
    this.name = 'AEON C';
    this.aspect = 'EMERGENCE';
    this.type = 'EXPANSION';
    this.magnitude = 0.5;
    this.vector = { x: -0.866, y: 0.5 };
    this.properties = ['emerges','expands','explores','creates new'];
    this.origin = 'Sanderson Elysium';
  }

  receiveEmergence(amount) {
    this.magnitude = Math.min(0.8, this.magnitude + amount);
  }

  flowTo(aeonA) {
    const stabilization = this.magnitude * 0.15;
    aeonA.receiveStabilization(stabilization);
    return { from: 'AEON C', to: 'AEON A', action: 'EMERGE & STABILIZE', amount: stabilization };
  }

  update() {
    this.vector.x = -0.866 * this.magnitude;
    return { adaptiveEmergence: this.magnitude };
  }
}
