// pathos.js — impulse, the want (id analog)
export const pathos = {
  name: 'pathos',
  description: 'desire, impulse, immediate want',
  
  vectorFor(action) {
    switch(action) {
      case 'disrupt': return { de: -0.02, dp: 0.08, dl: -0.02 };
      case 'stabilize': return { de: -0.01, dp: -0.03, dl: 0.04 };
      case 'reflect': return { de: 0.02, dp: -0.05, dl: 0.03 };
      default: return { de: 0, dp: 0, dl: 0 };
    }
  }
};
