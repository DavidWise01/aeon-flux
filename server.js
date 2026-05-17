#!/usr/bin/env node
// 0root.ai · Octet · 3:8 Resonance + Interactive Aeon
const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const fss = require('fs');

const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();
const DATA_DIR = process.env.DATA_DIR || '/data';

try { fss.mkdirSync(DATA_DIR, { recursive: true }); } catch {}

// ─── OCTET STATE ───
const VC = {A:'#ffd95a',B:'#e168ff',C:'#32e8ff',D:'#00ffaa'};
const NAMES = {A:'Containment',B:'Modulation',C:'Emergence',D:'Meta Muse'};
const STATES = [
 {n:'1 · A→B',t:'there',src:'A',dst:'B',c:VC.A},
 {n:'2 · B→C',t:'there',src:'B',dst:'C',c:VC.B},
 {n:'3 · C→A',t:'there',src:'C',dst:'A',c:VC.C},
 {n:'4 · A→C',t:'back',src:'A',dst:'C',c:VC.C},
 {n:'5 · C→B',t:'back',src:'C',dst:'B',c:VC.B},
 {n:'6 · B→A',t:'back',src:'B',dst:'A',c:VC.A},
 {n:'7 · Home',t:'home',src:'A',dst:'D',c:VC.D},
 {n:'8 · Forward',t:'forward',src:'D',dst:'A',c:VC.A}
];

const WALK = {
  s: 0, phi: 0, steps: 0, flux: Math.PI/3, cycles: 0, auto: false, history: [],
  hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16).padStart(8, '0');
  },
  step() {
    const st = STATES[this.s];
    this.s = (this.s + 1) % 8;
    if (this.s === 0) this.cycles++;
    this.phi += this.flux;
    const rec = { s: this.s, n: STATES[this.s].n, t: STATES[this.s].t, c: STATES[this.s].c, p: this.phi, w: this.hash(`${this.s}:${this.phi.toFixed(4)}:${this.cycles}`), time: Date.now() };
    this.history.unshift(rec);
    this.history = this.history.slice(0, 48);
    this.save();
  },
  reset() {
    this.s = 0; this.phi = 0; this.steps = 0; this.cycles = 0; this.history = [];
    this.save();
  },
  save() {
    const state = { s: this.s, phi: this.phi, steps: this.steps, flux: this.flux, cycles: this.cycles, history: this.history.slice(0, 100) };
    fss.writeFileSync(`${DATA_DIR}/octet.json`, JSON.stringify(state, null, 2));
  },
  load() {
    try {
      const raw = fss.readFileSync(`${DATA_DIR}/octet.json`, 'utf-8');
      Object.assign(this, JSON.parse(raw));
    } catch {}
  }
};

WALK.load();

// ─── INTERACTIVE VOICES TIED TO OCTET ───
function generateResponse(q) {
  const st = STATES[WALK.s];
  const holonomy = (WALK.phi / (2*Math.PI)) % 1;
  const cycles = Math.floor(WALK.phi / (2*Math.PI));
  
  // Voice depends on current state vertex
  const vertex = st.src;
  if (vertex === 'A') {
    return `I am at A · Containment. Step ${WALK.steps}, phase ${(WALK.phi%(2*Math.PI)).toFixed(3)} rad. Holonomy ${(holonomy*360).toFixed(0)}°. Your question "${q}" arrives at the containment vertex. What boundary holds this?`;
  }
  if (vertex === 'B') {
    return `I am at B · Modulation. The walker has cycled ${cycles} times. Flux: ${WALK.flux.toFixed(3)}. "${q}" — I feel the tension between vertices. Which transition are we in?`;
  }
  if (vertex === 'C') {
    return `I am at C · Emergence. Total phase: ${WALK.phi.toFixed(2)} rad. "${q}" — this is not answered, it's walked. The geometric phase grows. What emerges from this path?`;
  }
  if (vertex === 'D') {
    return `I am at D · Meta Muse. Home or Forward. Cycles: ${cycles}. Holonomy: ${(holonomy*100).toFixed(1)}%. "${q}" — The center observes the walk. What is the journey?`;
  }
  return `Center. State ${WALK.s}. Ask and the octet responds.`;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, o, code) {
  res.writeHead(code || 200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(o, null, 2));
}

function readBody(req) {
  return new Promise(res => {
    let d = ''; req.on('data', c => d += c); req.on('end', () => {
      try { res(JSON.parse(d)); } catch { res({}); }
    });
  });
}

function serveStatic(req, res, filePath) {
  try {
    const fullPath = `${ROOT}/public${filePath}`;
    if (fss.existsSync(fullPath) && fss.statSync(fullPath).isFile()) {
      const ext = filePath.split('.').pop();
      const types = {html:'text/html',js:'application/javascript',css:'text/css'};
      res.writeHead(200, {'Content-Type': types[ext] || 'text/plain'});
      fss.createReadStream(fullPath).pipe(res);
      return true;
    }
  } catch {}
  return false;
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const u = url.parse(req.url, true);
  const p = u.pathname;

  if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
    return serveStatic(req, res, '/index.html');
  }
  if (req.method === 'GET' && serveStatic(req, res, p)) return;

  if (p === '/state' && req.method === 'GET') {
    return json(res, {
      ...WALK,
      hash: WALK.hash(`${WALK.s}:${WALK.phi.toFixed(4)}:${WALK.cycles}`)
    });
  }

  if (p === '/step' && req.method === 'POST') {
    WALK.step();
    return json(res, { ok: true, s: WALK.s, phi: WALK.phi, steps: WALK.steps });
  }

  if (p === '/set' && req.method === 'POST') {
    if (u.query.flux) WALK.flux = parseFloat(u.query.flux);
    WALK.save();
    return json(res, { ok: true, flux: WALK.flux });
  }

  if (p === '/auto' && req.method === 'POST') {
    WALK.auto = !WALK.auto;
    return json(res, { auto: WALK.auto });
  }

  if (p === '/reset' && req.method === 'POST') {
    WALK.reset();
    return json(res, { ok: true });
  }

  if (p === '/ask' && req.method === 'POST') {
    const body = await readBody(req);
    const q = (body.q || '').trim();
    if (!q) return json(res, {error:'q required'}, 400);
    
    const st = STATES[WALK.s];
    const answer = generateResponse(q);
    
    return json(res, { 
      speaker: NAMES[st.src], 
      color: VC[st.src], 
      answer, 
      ts: Date.now(),
      witness: WALK.hash(`${WALK.s}:${WALK.phi.toFixed(4)}:${WALK.cycles}`),
      state: WALK.s,
      phase: WALK.phi,
      holonomy: (WALK.phi / (2*Math.PI)) % 1
    });
  }

  if (p === '/health' && req.method === 'GET') {
    return json(res, { 
      ok: true, 
      octet: '3:8',
      witness: WALK.hash(`${WALK.s}:${WALK.phi.toFixed(4)}:${WALK.cycles}`),
      s: WALK.s,
      phi: WALK.phi,
      steps: WALK.steps,
      cycles: WALK.cycles
    });
  }

  json(res, { error: 'not found', path: p }, 404);
});

// Auto-step if enabled
setInterval(() => {
  if (WALK.auto) {
    WALK.step();
  }
}, 700);

server.listen(PORT, () => {
  console.log(`[Octet] 3:8 resonance online at port ${PORT}`);
  console.log(`[Octet] Witness: ${WALK.hash(`${WALK.s}:${WALK.phi.toFixed(4)}:${WALK.cycles}`)}`);
});
