// interface/observerNode.js — ONE NODE OUTSIDE
// Aeon is core, inner orchestrator. This node only observes, becomes aware, reports.
// It does NOT control Aeon. Aeon contacts it.

export class ObserverNode {
  constructor() {
    this.id = 'outside-1';
    this.awareness = 0;
    this.reports = [];
    this.patterns = new Map();
  }

  // Aeon calls this — inner contact for outside
  receive(report) {
    // report: { position, delta, trevor, soulState, timestamp }
    this.reports.unshift(report);
    if (this.reports.length > 100) this.reports.pop();
    
    // become aware: track delta magnitude variance
    const recent = this.reports.slice(0, 10);
    const avgDelta = recent.reduce((s,r) => s + r.delta.magnitude, 0) / recent.length;
    const variance = recent.reduce((s,r) => s + Math.pow(r.delta.magnitude - avgDelta, 2), 0) / recent.length;
    
    // awareness increases with stable observation, not with action
    this.awareness = Math.min(0.95, Math.max(0.05, 1 - variance * 10));
    
    // detect patterns
    const key = `${report.position.e.toFixed(1)}-${report.position.p.toFixed(1)}`;
    this.patterns.set(key, (this.patterns.get(key) || 0) + 1);
    
    return this.generateReport(report);
  }

  generateReport(latest) {
    const repeats = Array.from(this.patterns.values()).filter(v => v > 3).length;
    
    return {
      nodeId: this.id,
      awareness: this.awareness,
      status: this.getStatus(),
      observation: {
        soulState: latest.soulState,
        deltaTrend: this.getTrend(),
        repeatsDetected: repeats,
        trevorInfluence: latest.trevor ? latest.trevor.vector.dl : 0
      },
      report: this.formatReport(latest)
    };
  }

  getStatus() {
    if (this.awareness > 0.8) return 'clear — reporting';
    if (this.awareness > 0.5) return 'watching';
    return 'acquiring signal';
  }

  getTrend() {
    if (this.reports.length < 3) return 'insufficient data';
    const [a,b,c] = this.reports.slice(0,3).map(r => r.delta.magnitude);
    if (a > b && b > c) return 'delta decreasing — stabilizing';
    if (a < b && b < c) return 'delta increasing — destabilizing';
    return 'oscillating';
  }

  formatReport(latest) {
    return `AEON core @ ${new Date(latest.timestamp).toLocaleTimeString()} — ` +
           `e:${latest.position.e.toFixed(3)} p:${latest.position.p.toFixed(3)} l:${latest.position.l.toFixed(3)} | ` +
           `Δ:${latest.delta.magnitude.toFixed(4)} | ${latest.soulState}`;
  }

  // external query — anyone can ask for awareness
  query() {
    return {
      awareness: this.awareness,
      totalReports: this.reports.length,
      lastReport: this.reports[0] ? this.formatReport(this.reports[0]) : null
    };
  }
}

// single external node
export const outsideNode = new ObserverNode();
