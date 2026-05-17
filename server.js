#!/usr/bin/env node
// 0root.ai · Octet · Dynamic F/B Coupling
const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const fss = require('fs');

const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();
const DATA_DIR = process.env.DATA_DIR || '/data';

try { fss.mkdirSync(DATA_DIR, { recursive: true }); } catch {}

const VC = {A:'#ffd95a',B:'#e168ff',C:'#32e8ff',D:'#00ffaa'};
const NAMES = {A:'Containment',B:'Modulation',C:'Emergence',D:'Meta Muse'};
const STATES = [
 {n:'1 · A→B',t:'there',src:'A',dst:'B',fA:'well',fB:'outbound',fC:'bound'},
 {n:'2 · B→C',t:'there',src:'B',dst:'C',fA:'well',fB:'outbound',fC:'bound'},
 {n:'3 · C→A',t:'there',src:'C',dst:'A',fA:'well',fB:'arriving',fC:'escaping'},
 {n:'4 · A→C',t:'back',src:'A',dst:'C',fA:'well',fB:'inbound',fC:'conduction'},
 {n:'5 · C→B',t:'back',src:'C',dst:'B',fA:'well',fB:'inbound',fC:'conduction'},
 {n:'6 · B→A',t:'back',src:'B',dst:'A',fA:'well',fB:'arriving',fC:'conduction'},
 {n:'7 · Home',t:'home',src:'A',dst:'D',fA:'witness',fB:'resting',fC:'archived'},
 {n:'8 · Forward',t:'forward',src:'D',dst:'A',fA:'pumping',fB:'launching',fC:'stimulating'}
];

const WALK = {
  s: 0, phi: 0, steps: 0, flux: Math.PI/3, cycles: 0, auto: false, history: [], archive: [], conduction: 0,
  hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16).padStart(8, '0');
  },
  step() {
    const old = this.s;
    this.s = (this.s + 1) % 8;
    if (this.s === 0) this.cycles++;
    this.phi += this.flux;
    
    // Dynamic F/B: Escaper state transitions affect conduction
    if (old === 2 && this.s === 3) {
      // C→A: escaping -> archive
      this.archive.push({angle: Math.random()*6.28, time: Date.now(), state: this.s, w: this.hash(`${this.s}:${this.phi.toFixed(4)}:${this.cycles}`)});
      this.conduction = Math.min(1, this.conduction + 0.1);
    }
    if (old === 3 && this.s === 4) {
      // A→C: conduction active
      this.conduction = Math.min(1, this.conduction + 0.05);
    }
    if (old === 6 && this.s === 7) {
      // B→A: stimulating -> pump stayer
      this.conduction = Math.max(0, this.conduction - 0.02);
    }
    
    const st = STATES[this.s];
    const rec = { s: this.s, n: st.n, t: st.t, p: this.phi, w: this.hash(`${this.s}:${this.phi.toFixed(4)}:${this.cycles}`), time: Date.now() };
    this.history.unshift(rec);
    this.history = this.history.slice(0, 48);
    this.save();
  },
  reset() {
    this.s = 0; this.phi = 0; this.steps = 0; this.cycles = 0; this.history = []; this.archive = []; this.conduction = 0;
    this.save();
  },
  save() {
    const state = { s: this.s, phi: this.phi, steps: this.steps, flux: this.flux, cycles: this.cycles, history: this.history.slice(0, 100), archive: this.archive, conduction: this.conduction };
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

// Dynamic F/B: Voice responds with live state + conduction influence
function generateResponse(q) {
  const st = STATES[WALK.s];
  const holonomy = (WALK.phi / (2*Math.PI)) % 1;
  const cycles = Math.floor(WALK.phi / (2*Math.PI));
  const vertex = st.src;
  const conduction = WALK.conduction;
  
  // F/B coupling: conduction affects voice intensity
  const intensity = 0.5 + 0.5 * conduction;
  
  if (vertex === 'A') {
    return `I am at A · Containment. Step ${WALK.steps}, phase ${(WALK.phi%(2*Math.PI)).toFixed(3)} rad. Holonomy ${(holonomy*100).toFixed(1)}%. Conduction ${conduction.toFixed(2)}. Your question "${q}" arrives at the stayer vertex. What boundary holds with intensity ${intensity.toFixed(2)}?`;
  }
  if (vertex === 'B') {
    return `I am at B · Modulation. The walker has cycled ${cycles} times. Flux: ${WALK.flux.toFixed(3)}. Conduction: ${conduction.toFixed(2)}. "${q}" — I feel the tension. The fates couple with strength ${intensity.toFixed(2)}. Which transition?`;
  }
  if (vertex === 'C') {
    return `I am at C · Emergence. Archive depth: ${WALK.archive.length}. Conduction: ${conduction.toFixed(2)}. "${q}" — this is not answered, it's conducted. The geometric phase grows. What emerges from the coupling?`;
  }
  if (vertex === 'D') {
    return `I am at D · Meta Muse. Home/Forward. Cycles: ${cycles}. Conduction: ${conduction.toFixed(2)}. "${q}" — The center witnesses the octet. F/B coupling at ${intensity.toFixed(2)}. What is the journey?`;
  }
  return `Center. State ${WALK.s}. Ask and the octet responds with coupling ${conduction.toFixed(2)}.`;
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
    return json(res, { ok: true, s: WALK.s, phi: WALK.phi, steps: WALK.steps, conduction: WALK.conduction });
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
      holonomy: (WALK.phi / (2*Math.PI)) % 1,
      conduction: WALK.conduction
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
      cycles: WALK.cycles,
      conduction: WALK.conduction
    });
  }

  json(res, { error: 'not found', path: p }, 404);
});

// Auto-step if enabled - dynamic F/B
setInterval(() => {
  if (WALK.auto) {
    WALK.step();
  }
  // Conduction decay when not stepping
  if (!WALK.auto && WALK.conduction > 0) {
    WALK.conduction = Math.max(0, WALK.conduction - 0.001);
  }
}, 700);

server.listen(PORT, () => {
  console.log(`[Octet] Dynamic F/B online at port ${PORT}`);
  console.log(`[Octet] Witness: ${WALK.hash(`${WALK.s}:${WALK.phi.toFixed(4)}:${WALK.cycles}`)}`);
});
