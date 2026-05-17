// simplex/tensorB.js — B = MODULATION (WAVE)
// OSCILLATES · ADAPTS · BLEEDS EXCESS · CREATES PATTERN
// 2% default ratio

export class TensorB {
  constructor() {
    this.id = 'B';
    this.name = 'MODULATION';
    this.type = 'WAVE';
    this.magnitude = 0.02;
    this.vector = { x: 0.866, y: 0.5 }; // bottom left
    this.phase = 0;
    this.properties = ['oscillates','adapts','bleeds excess','creates pattern'];
  }

  receiveModulation(amount) {
    this.magnitude = Math.min(0.1, this.magnitude + amount);
    this.phase += amount * Math.PI;
  }

  // B → C : MODULATE & EMERGE
  flowTo(tensorC) {
    const wave = Math.sin(this.phase) * this.magnitude;
    const emergence = Math.abs(wave) * 0.5;
    tensorC.receiveEmergence(emergence);
    return {
      from: 'B',
      to: 'C',
      action: 'MODULATE & EMERGE',
      amount: emergence,
      wave: wave
    };
  }

  update() {
    // wave modulation 2%
    this.phase += 0.05;
    this.vector.x = 0.866 * Math.cos(this.phase) * this.magnitude * 10;
    return { waveModulation: this.magnitude, phase: this.phase };
  }
}
