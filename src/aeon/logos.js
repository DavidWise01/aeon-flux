// logos.js — reason, the how (ego analog, but NOT core)
export const logos = {
  name: 'logos',
  description: 'reason, structure, mediation — NOT the core',
  
  vectorFor(action) {
    switch(action) {
      case 'disrupt': return { de: -0.03, dp: 0.02, dl: 0.05 };
      case 'stabilize': return { de: 0.01, dp: -0.04, dl: 0.07 };
      case 'reflect': return { de: -0.02, dp: 0.01, dl: 0.05 };
      default: return { de: 0, dp: 0, dl: 0 };
    }
  }
};
