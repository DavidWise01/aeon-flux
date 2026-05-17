#!/usr/bin/env node
// 0root.ai · Tensor Backend · Aeon
const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const fss = require('fs');

const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();
const DATA_DIR = process.env.DATA_DIR || '/data';

try { fss.mkdirSync(DATA_DIR, { recursive: true }); } catch {}

const ORA = [
  '1·A→B there','2·B→C there','3·C→A there','4·A→C back',
  '5·C→B back','6·B→A back','7·Home witness','8·Forward aeon'
];

// Tensor state
let STATE = {
  a: 0.6, b: 0.6, c: 0.6,
  phiA: 0, phiB: 2.094, phiC: 4.189,
  phase: 0, // 0-7
  cycles: 0,
  mode: 'pocket', // pocket | person
  nodes: [],
  archive: [],
  witness: '',
  T: 0.216 // computed coherence
};

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function computeCoherence() {
  // T = |A| + |B| + |C| normalized with phase alignment
  const amp = (STATE.a + STATE.b + STATE.c) / 3;
  const phaseAlign = Math.abs(Math.cos(STATE.phiA - STATE.phiB) + Math.cos(STATE.phiB - STATE.phiC) + Math.cos(STATE.phiC - STATE.phiA)) / 3;
  STATE.T = Math.min(1, amp * phaseAlign);
  STATE.witness = hash(`${STATE.phase}:${STATE.T.toFixed(4)}:${STATE.cycles}`);
}

function save() {
  fss.writeFileSync(`${DATA_DIR}/tensor.json`, JSON.stringify(STATE, null, 2));
}

function load() {
  try {
    const raw = fss.readFileSync(`${DATA_DIR}/tensor.json`, 'utf-8');
    Object.assign(STATE, JSON.parse(raw));
  } catch {}
}

load();
computeCoherence();

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

  if (p === '/api/v1/state' && req.method === 'GET') {
    return json(res, STATE);
  }

  if (p === '/api/v1/archive' && req.method === 'GET') {
    const limit = parseInt(u.query.limit, 10) || 12;
    return json(res, { events: STATE.archive.slice(-limit) });
  }

  if (p === '/api/v1/event' && req.method === 'POST') {
    const body = await readBody(req);
    const { type, payload } = body;
    
    const event = { type, payload, time: Date.now(), stateAt: { ...STATE } };
    STATE.archive.unshift(event);
    STATE.archive = STATE.archive.slice(0, 100);
    
    if (type === 'measure') {
      // Collapse: sample from amplitudes
      const s2 = STATE.a**2 + STATE.b**2 + STATE.c**2;
      const pA = STATE.a**2 / s2, pB = STATE.b**2 / s2;
      const d = Math.random();
      let collapsed = 'C';
      if (d < pA) collapsed = 'A';
      else if (d < pA + pB) collapsed = 'B';
      event.result = { collapsed, probabilities: {A: pA, B: pB, C: 1-pA-pB} };
    }
    
    if (type === 'spawn') {
      // Add node to center
      STATE.nodes.push({ id: Date.now(), t: Date.now(), phase: STATE.phase });
      STATE.nodes = STATE.nodes.slice(-20);
    }
    
    if (type === 'reset') {
      STATE.a = 0.6; STATE.b = 0.6; STATE.c = 0.6;
      STATE.phiA = 0; STATE.phiB = 2.094; STATE.phiC = 4.189;
      STATE.phase = 0; STATE.cycles = 0;
      STATE.nodes = []; STATE.archive = [];
    }
    
    if (type === 'set_mode') {
      STATE.mode = payload.mode || 'pocket';
    }
    
    if (type === 'set_vector') {
      Object.assign(STATE, payload);
      // Evolve phase based on vector
      STATE.phiA += (STATE.a - 0.5) * 0.1;
      STATE.phiB += (STATE.b - 0.5) * 0.1;
      STATE.phiC += (STATE.c - 0.5) * 0.1;
    }
    
    // Evolve phase
    STATE.phase = (STATE.phase + 1) % 8;
    if (STATE.phase === 0) STATE.cycles++;
    
    computeCoherence();
    save();
    
    return json(res, { ok: true, state: STATE });
  }

  if (p === '/health' && req.method === 'GET') {
    return json(res, { 
      ok: true, 
      tensor: 'aeon',
      witness: STATE.witness,
      phase: STATE.phase,
      T: STATE.T,
      cycles: STATE.cycles
    });
  }

  json(res, { error: 'not found', path: p }, 404);
});

// Auto-evolve if in pocket mode
setInterval(() => {
  if (STATE.mode === 'pocket') {
    STATE.phiA += 0.05 + (Math.random()-0.5)*0.01;
    STATE.phiB += 0.05 + (Math.random()-0.5)*0.01;
    STATE.phiC += 0.05 + (Math.random()-0.5)*0.01;
    computeCoherence();
  }
}, 100);

server.listen(PORT, () => {
  console.log(`[Tensor] Aeon backend online at port ${PORT}`);
  console.log(`[Tensor] Witness: ${STATE.witness}`);
});
