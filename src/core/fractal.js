// fractal.js — each vector contains its own triangle to infinity
// values converge to 0 with decay

export class Triad {
  constructor(value = 1/3, depth = 0, maxDepth = 7, decay = 0.5) {
    this.value = value;
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.decay = decay;
    
    // each vector has its own triangle of the same
    if (depth < maxDepth) {
      const third = value / 3;
      this.children = {
        e: new Triad(third, depth + 1, maxDepth, decay),
        p: new Triad(third, depth + 1, maxDepth, decay),
        l: new Triad(third, depth + 1, maxDepth, decay)
      };
    } else {
      this.children = null;
    }
  }

  // apply delta with infinite decay toward 0
  apply(delta) {
    this.value += delta;
    
    if (this.children) {
      const childDelta = delta * this.decay * Math.pow(0.7, this.depth);
      // distribute to children maintaining their own triangle
      this.children.e.apply(childDelta * 0.34);
      this.children.p.apply(childDelta * 0.33);
      this.children.l.apply(childDelta * 0.33);
    }
  }

  // get total value including infinite sum (approx)
  total() {
    let sum = this.value;
    if (this.children) {
      sum += this.children.e.total() * this.decay;
      sum += this.children.p.total() * this.decay;
      sum += this.children.l.total() * this.decay;
    }
    return sum;
  }

  // normalize to keep around 0 center
  normalize() {
    // pull toward 1/3 with infinite decay
    const target = 1/3;
    const pull = 0.02 * Math.pow(0.8, this.depth);
    this.value = this.value * (1 - pull) + target * pull;
    
    if (this.children) {
      this.children.e.normalize();
      this.children.p.normalize();
      this.children.l.normalize();
    }
  }

  // flatten for debugging
  flatten(prefix = '') {
    const out = {[prefix || 'root']: this.value};
    if (this.children) {
      Object.assign(out, this.children.e.flatten(prefix + 'e'));
      Object.assign(out, this.children.p.flatten(prefix + 'p'));
      Object.assign(out, this.children.l.flatten(prefix + 'l'));
    }
    return out;
  }
}

// create the three root vectors
export function createFractalSoul() {
  return {
    ethos: new Triad(0.34, 0, 7, 0.5),
    pathos: new Triad(0.33, 0, 7, 0.5),
    logos: new Triad(0.33, 0, 7, 0.5)
  };
}

export function getPosition(soul) {
  const e = soul.ethos.total();
  const p = soul.pathos.total();
  const l = soul.logos.total();
  const sum = e + p + l;
  return { e: e/sum, p: p/sum, l: l/sum };
}
