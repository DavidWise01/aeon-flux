// trevor/index.js — constraint system
// Trevor tries to flatten the fractal to depth 1 (control) and push logos dominance
// He is not evil, he is structure

export class Trevor {
  constructor() {
    this.ideal = { e: 0.30, p: 0.20, l: 0.50 }; // prefers logos, order
    this.strength = 0.15; // how hard he pushes back
  }

  respond(aeonState) {
    const { position, delta, history } = aeonState;
    
    // calculate drift from ideal
    const drift = {
      de: this.ideal.e - position.e,
      dp: this.ideal.p - position.p,
      dl: this.ideal.l - position.l
    };
    
    // if Aeon is moving fast (high delta), Trevor pushes harder to stabilize
    const urgency = Math.min(delta.magnitude * 3, 1);
    
    // flattening force: tries to reduce fractal depth by counteracting recent moves
    const flatten = history.length > 2 ? -delta.magnitude * 0.5 : 0;
    
    return {
      vector: {
        de: drift.de * this.strength * urgency,
        dp: drift.dp * this.strength * urgency,
        dl: drift.dl * this.strength * urgency
      },
      intent: 'stabilize',
      flattenForce: flatten,
      message: this.getMessage(position, urgency)
    };
  }

  getMessage(pos, urgency) {
    if (pos.l > 0.55) return "order holds";
    if (urgency > 0.7) return "you're oscillating — let me hold the line";
    if (pos.p > 0.5) return "impulse without structure collapses";
    return "I maintain the boundary";
  }

  // apply flattening to Aeon's fractal
  applyFlatten(soul, force) {
    // reduce depth influence by pulling child values toward parent
    const flattenNode = (node, depth = 0) => {
      if (!node.children || depth > 3) return;
      const pull = Math.abs(force) * 0.1;
      ['e','p','l'].forEach(k => {
        const child = node.children[k];
        child.value = child.value * (1-pull) + node.value/3 * pull;
        flattenNode(child, depth+1);
      });
    };
    flattenNode(soul.ethos);
    flattenNode(soul.pathos);
    flattenNode(soul.logos);
  }
}

export const trevor = new Trevor();
