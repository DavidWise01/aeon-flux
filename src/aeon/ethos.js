// ethos.js — principles, the should (superego analog)
export const ethos = {
  name: 'ethos',
  description: 'integrity, principles, long-term should',
  
  vectorFor(action) {
    // actions that invoke principle increase ethos
    switch(action) {
      case 'disrupt': return { de: 0.02, dp: 0.05, dl: -0.03 }; // pathos-led disruption
      case 'stabilize': return { de: 0.05, dp: -0.02, dl: 0.03 }; // principle-led stability
      case 'reflect': return { de: 0.08, dp: -0.04, dl: -0.04 };
      default: return { de: 0, dp: 0, dl: 0 };
    }
  }
};
