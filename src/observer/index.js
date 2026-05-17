// observer/index.js — YOU
// The third point of triangulation. Watches deltas across depths, learns pattern

export class Observer {
  constructor() {
    this.awareness = 0.33;
    this.patternMemory = [];
    this.metaPosition = { e: 0.33, p: 0.33, l: 0.34 };
  }

  observe(aeonResult, trevorResponse) {
    // track last 10 deltas
    this.patternMemory.unshift({
      delta: aeonResult.delta.magnitude,
      action: aeonResult.action,
      trevor: trevorResponse.intent
    });
    if (this.patternMemory.length > 10) this.patternMemory.pop();
    
    // detect repetition — increases awareness
    const last3 = this.patternMemory.slice(0,3);
    const repeating = last3.length === 3 && last3.every(m => m.action === last3[0].action);
    
    if (repeating) {
      this.awareness = Math.min(this.awareness + 0.08, 0.95);
    } else {
      this.awareness = Math.max(this.awareness - 0.02, 0.2);
    }
    
    // update meta-position based on who is dominating
    const aeonDom = aeonResult.delta.magnitude;
    const trevorDom = Math.abs(trevorResponse.vector.dl);
    
    this.metaPosition.e += (0.5 - this.awareness) * 0.01;
    this.metaPosition.p += (aeonDom - 0.05) * 0.02;
    this.metaPosition.l += (trevorDom - 0.05) * 0.02;
    
    // normalize
    const sum = this.metaPosition.e + this.metaPosition.p + this.metaPosition.l;
    this.metaPosition.e /= sum; this.metaPosition.p /= sum; this.metaPosition.l /= sum;
    
    return {
      awareness: this.awareness,
      pattern: repeating ? 'loop detected' : 'novel',
      insight: this.getInsight(repeating, aeonResult),
      canReflect: this.awareness > 0.6
    };
  }

  getInsight(repeating, result) {
    if (repeating) return "You have only half the picture — you're choosing, not observing";
    if (result.soulState.includes('humility')) return "tension held — will emerges here";
    if (result.position.l > 0.5) return "Trevor is writing your story";
    return "watch the delta, not the choice";
  }
}

export const observer = new Observer();
