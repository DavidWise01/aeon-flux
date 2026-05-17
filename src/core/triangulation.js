// triangulation.js — delta math for three-point soul
// position is barycentric [ethos, pathos, logos] that sums to 1

export function createPosition(e=0.33, p=0.33, l=0.34) {
  const sum = e + p + l;
  return { e: e/sum, p: p/sum, l: l/sum };
}

export function delta(prev, next) {
  return {
    de: next.e - prev.e,
    dp: next.p - prev.p,
    dl: next.l - prev.l,
    magnitude: Math.hypot(next.e-prev.e, next.p-prev.p, next.l-prev.l)
  };
}

export function move(position, vector, humilityFn) {
  // vector: {de, dp, dl}
  const next = {
    e: position.e + (vector.de || 0),
    p: position.p + (vector.dp || 0),
    l: position.l + (vector.dl || 0)
  };
  // normalize
  const sum = next.e + next.p + next.l;
  const normalized = { e: next.e/sum, p: next.p/sum, l: next.l/sum };
  return humilityFn ? humilityFn(normalized) : normalized;
}

// convert barycentric to cartesian for UI
export function toCartesian(pos, size=200) {
  const {e, p, l} = pos;
  // triangle vertices: ethos top, pathos bottom left, logos bottom right
  const x = size * (0.5 * e + 0 * p + 1 * l);
  const y = size * (0 * e + 1 * p + 1 * l);
  // center it
  return { x: x, y: size - y * 0.866 };
}
