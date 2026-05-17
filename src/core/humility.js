// humility.js — anti-hubris constraint
// core is NOT superman (ego). ego is superman's shadow.
// we enforce 50/50 humility: no facet > 0.6, and center pull

export function enforceHumility(pos, maxDominance = 0.6, centerPull = 0.05) {
  let {e, p, l} = pos;
  
  // if any facet approaches superman status, dampen it
  const dampen = (v) => v > maxDominance ? maxDominance + (v - maxDominance) * 0.3 : v;
  e = dampen(e); p = dampen(p); l = dampen(l);
  
  // pull toward center (0.333 each) — humility
  const center = 1/3;
  e = e * (1 - centerPull) + center * centerPull;
  p = p * (1 - centerPull) + center * centerPull;
  l = l * (1 - centerPull) + center * centerPull;
  
  // renormalize
  const sum = e + p + l;
  return { e: e/sum, p: p/sum, l: l/sum };
}

export function isHubris(pos) {
  return pos.e > 0.65 || pos.p > 0.65 || pos.l > 0.65;
}
