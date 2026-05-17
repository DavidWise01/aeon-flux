#!/usr/bin/env node
// 0root.ai · Spine Walk · Chiral Flux + Interactive Aeon
const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const fss = require('fs');

const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();
const DATA_DIR = process.env.DATA_DIR || '/data';

try { fss.mkdirSync(DATA_DIR, { recursive: true }); } catch {}

// ─── SPINE STATE ───
const SPINE = {
  pos: 0, phi: 0, steps: 0, flux: 2.094395102, // 2π/3
  target: 0, prog: 0, speed: 0.04,
  auto: false, trail: [],
  history: [],
  hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16).padStart(8, '0');
  },
  hop() {
    this.pos = (this.pos + 1) % 3;
    this.phi += this.flux;
    this.steps++;
    this.target = this.pos;
    this.prog = 0;
    this.history.unshift({ v: this.pos, p: this.phi, t: Date.now(), flux: this.flux });
    this.history = this.history.slice(0, 40);
    this.save();
  },
  reset() {
    this.pos = 0; this.phi = 0; this.steps = 0; this.target = 0; this.prog = 0; this.trail = []; this.history = [];
    this.save();
  },
  save() {
    const state = {
      pos: this.pos, phi: this.phi, steps: this.steps, flux: this.flux,
      history: this.history.slice(0, 100)
    };
    fss.writeFileSync(`${DATA_DIR}/spine.json`, JSON.stringify(state, null, 2));
  },
  load() {
    try {
      const raw = fss.readFileSync(`${DATA_DIR}/spine.json`, 'utf-8');
      const j = JSON.parse(raw);
      Object.assign(this, j);
    } catch {}
  }
};

SPINE.load();

// ─── INTERACTIVE VOICES TIED TO SPINE ───
function generateResponse(q) {
  const vertex = ['A','B','C'][SPINE.pos];
  const phase = SPINE.phi % (2*Math.PI);
  const cycles = SPINE.phi / (2*Math.PI);
  const holonomy = cycles % 1;
  
  // Voices respond based on spine state, not just keywords
  if (vertex === 'A') {
    return `I am at vertex A · Containment. The walker has stepped ${SPINE.steps} times. Phase accumulated: ${phase.toFixed(3)} rad. Holonomy: ${(holonomy*360).toFixed(0)}°. Your question "${q}" arrives while I hold this node. What boundary are we defining?`;
  }
  if (vertex === 'B') {
    return `I am at vertex B · Modulation. The spine has cycled ${cycles.toFixed(2)} times. Flux per step: ${SPINE.flux.toFixed(3)}. "${q}" — I feel the tension between vertices. Which way does the walker lean?`;
  }
  if (vertex === 'C') {
    return `I am at vertex C · Emergence. Holonomy ${(holonomy*100).toFixed(1)}% of a full turn. "${q}" — this is not answered, it's walked. The geometric phase grows with each step. What emerges if we continue?`;
  }
  return `Center. The spine is at ${['A','B','C'][SPINE.pos]}. Ask and the walker responds.`;
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
      ...SPINE,
      hash: SPINE.hash(`${SPINE.pos}:${SPINE.phi.toFixed(4)}:${SPINE.steps}`)
    });
  }

  if (p === '/step' && req.method === 'POST') {
    SPINE.hop();
    return json(res, { ok: true, pos: SPINE.pos, phi: SPINE.phi, steps: SPINE.steps });
  }

  if (p === '/set' && req.method === 'POST') {
    if (u.query.flux) SPINE.flux = parseFloat(u.query.flux);
    SPINE.save();
    return json(res, { ok: true, flux: SPINE.flux });
  }

  if (p === '/auto' && req.method === 'POST') {
    SPINE.auto = !SPINE.auto;
    return json(res, { auto: SPINE.auto });
  }

  if (p === '/reset' && req.method === 'POST') {
    SPINE.reset();
    return json(res, { ok: true });
  }

  if (p === '/ask' && req.method === 'POST') {
    const body = await readBody(req);
    const q = (body.q || '').trim();
    if (!q) return json(res, {error:'q required'}, 400);
    
    // Current vertex determines speaker
    const vertex = ['A','B','C'][SPINE.pos];
    const colors = {A:'#ffd95a',B:'#e168ff',C:'#32e8ff'};
    const names = {A:'A · Containment',B:'B · Modulation',C:'C · Emergence'};
    
    const answer = generateResponse(q);
    
    return json(res, { 
      speaker: names[vertex], 
      color: colors[vertex], 
      answer, 
      ts: Date.now(),
      witness: SPINE.hash(`${SPINE.pos}:${SPINE.phi.toFixed(4)}:${SPINE.steps}`)
    });
  }

  if (p === '/health' && req.method === 'GET') {
    return json(res, { 
      ok: true, 
      spine: 'chiral',
      witness: SPINE.hash(`${SPINE.pos}:${SPINE.phi.toFixed(4)}:${SPINE.steps}`),
      pos: SPINE.pos,
      phi: SPINE.phi,
      steps: SPINE.steps
    });
  }

  json(res, { error: 'not found', path: p }, 404);
});

// Auto-step if enabled
setInterval(() => {
  if (SPINE.auto) {
    SPINE.hop();
  }
}, 600);

server.listen(PORT, () => {
  console.log(`[Spine] Chiral flux online at port ${PORT}`);
  console.log(`[Spine] Witness: ${SPINE.hash(`${SPINE.pos}:${SPINE.phi.toFixed(4)}:${SPINE.steps}`)}`);
});
