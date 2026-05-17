// simplex/tensorB.js — AEON B = MODULATION (WAVE)
// From Sanderson's Elysium
// OSCILLATES · ADAPTS · BLEEDS EXCESS · CREATES PATTERN

export class AeonB {
  constructor() {
    this.id = 'B';
    this.name = 'AEON B';
    this.aspect = 'MODULATION';
    this.type = 'WAVE';
    this.magnitude = 0.02;
    this.vector = { x: 0.866, y: 0.5 };
    this.phase = 0;
    this.properties = ['oscillates','adapts','bleeds excess','creates pattern'];
    this.origin = 'Sanderson Elysium';
  }

  receiveModulation(amount) {
    this.magnitude = Math.min(0.1, this.magnitude + amount);
    this.phase += amount * Math.PI;
  }

  flowTo(aeonC) {
    const wave = Math.sin(this.phase) * this.magnitude;
    const emergence = Math.abs(wave) * 0.5;
    aeonC.receiveEmergence(emergence);
    return { from: 'AEON B', to: 'AEON C', action: 'MODULATE & EMERGE', amount: emergence, wave };
  }

  update() {
    this.phase += 0.05;
    this.vector.x = 0.866 * Math.cos(this.phase) * this.magnitude * 10;
    return { waveModulation: this.magnitude };
  }
}
