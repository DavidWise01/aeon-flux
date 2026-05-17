// humility.js — now works on fractal triads
export function enforceHumilityFractal(soul) {
  // apply to each root and recursively
  [soul.ethos, soul.pathos, soul.logos].forEach(triad => {
    triad.normalize();
    
    // anti-hubris: if any root > 0.6, dampen its entire tree
    if (triad.total() > 0.6) {
      const damp = 0.7;
      const reduce = (node) => {
        node.value *= damp;
        if (node.children) {
          reduce(node.children.e);
          reduce(node.children.p);
          reduce(node.children.l);
        }
      };
      reduce(triad);
    }
  });
  
  // renormalize roots to sum 1
  const e = soul.ethos.total();
  const p = soul.pathos.total();
  const l = soul.logos.total();
  const sum = e + p + l;
  const scale = 1 / sum;
  
  const scaleNode = (node, s) => {
    node.value *= s;
    if (node.children) {
      scaleNode(node.children.e, s);
      scaleNode(node.children.p, s);
      scaleNode(node.children.l, s);
    }
  };
  
  scaleNode(soul.ethos, scale);
  scaleNode(soul.pathos, scale);
  scaleNode(soul.logos, scale);
}
