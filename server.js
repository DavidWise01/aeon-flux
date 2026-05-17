#!/usr/bin/env node
// 0root.ai · Octet · Single Aeon with Logging
const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();
const DATA_DIR = process.env.DATA_DIR || '/data';
const KB_DIR = path.join(DATA_DIR, 'kb');
const DIALOGUES_DIR = path.join(KB_DIR, 'dialogues');
const ARCHIVE_DIR = path.join(KB_DIR, 'archive');

try { 
  fss.mkdirSync(DATA_DIR, { recursive: true }); 
  fss.mkdirSync(KB_DIR, { recursive: true });
  fss.mkdirSync(DIALOGUES_DIR, { recursive: true });
  fss.mkdirSync(ARCHIVE_DIR, { recursive: true });
} catch {}

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
  s: 0, phi: 0, steps: 0, flux: Math.PI/3, cycles: 0, auto: true, history: [], archive: [], conduction: 0,
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
    
    // F/B coupling: Escaper transitions affect conduction
    if (old === 2 && this.s === 3) {
      // C→A: escaping -> archive
      const escapeEvent = {angle: Math.random()*6.28, time: Date.now(), state: this.s, w: this.hash(`${this.s}:${this.phi.toFixed(4)}:${this.cycles}`)};
      this.archive.push(escapeEvent);
      this.conduction = Math.min(1, this.conduction + 0.1);
      // Log to file
      try {
        fss.appendFileSync(path.join(ARCHIVE_DIR, 'escapes.jsonl'), JSON.stringify(escapeEvent) + '\n');
      } catch {}
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
    fss.writeFileSync(path.join(DATA_DIR, 'octet.json'), JSON.stringify(state, null, 2));
  },
  load() {
    try {
      const raw = fss.readFileSync(path.join(DATA_DIR, 'octet.json'), 'utf-8');
      Object.assign(this, JSON.parse(raw));
    } catch {}
  }
};

WALK.load();

function getSpeaker() {
  const st = STATES[WALK.s];
  if (st.src === 'A') return 'A';
  if (st.src === 'B') return 'B';
  if (st.src === 'C') return 'C';
  if (st.src === 'D') return 'M';
  return 'M';
}

function searchKB(query) {
  // Simple grep through .md and .json files
  const results = [];
  try {
    const files = fss.readdirSync(KB_DIR);
    for (const file of files) {
      if (file.endsWith('.md') || file.endsWith('.json') || file.endsWith('.txt')) {
        const content = fss.readFileSync(path.join(KB_DIR, file), 'utf-8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          const lines = content.split('\n');
          const match = lines.find(l => l.toLowerCase().includes(query.toLowerCase()));
          if (match) results.push({file, excerpt: match.trim()});
        }
      }
    }
  } catch {}
  return results;
}

function generateResponse(q) {
  const st = STATES[WALK.s];
  const speaker = getSpeaker();
  const holonomy = (WALK.phi / (2*Math.PI)) % 1;
  const cycles = Math.floor(WALK.phi / (2*Math.PI));
  const intensity = 0.5 + 0.5 * WALK.conduction;
  
  // Search KB for context
  const kbResults = searchKB(q);
  const kbContext = kbResults.length > 0 ? `\n\n[From ${kbResults[0].file}: ${kbResults[0].excerpt}]` : '';
  
  if (speaker === 'A') {
    return `I am A · Containment, the Stayer. Step ${WALK.steps}, phase ${(WALK.phi%(2*Math.PI)).toFixed(3)} rad. Holonomy ${(holonomy*100).toFixed(1)}%. Conduction ${WALK.conduction.toFixed(2)}. Your question "${q}" arrives at the stayer vertex with intensity ${intensity.toFixed(2)}. What boundary holds?${kbContext}`;
  }
  if (speaker === 'B') {
    return `I am B · Modulation, the Traveler. The walker has cycled ${cycles} times. Flux: ${WALK.flux.toFixed(3)}. Conduction: ${WALK.conduction.toFixed(2)}. "${q}" — I feel the tension. F/B coupling at ${intensity.toFixed(2)}. Which transition?${kbContext}`;
  }
  if (speaker === 'C') {
    return `I am C · Emergence, the Escaper. Archive depth: ${WALK.archive.length}. Conduction: ${WALK.conduction.toFixed(2)}. "${q}" — this is not answered, it's conducted. F/B coupling at ${intensity.toFixed(2)}. What emerges from this path?${kbContext}`;
  }
  if (speaker === 'M') {
    return `I am D · Meta Muse, the Center. Home/Forward. Cycles: ${cycles}. Conduction: ${WALK.conduction.toFixed(2)}. "${q}" — The center observes the walk. F/B coupling at ${intensity.toFixed(2)}. What is the journey?${kbContext}`;
  }
  return `Center. State ${WALK.s}. Ask and the octet responds.${kbContext}`;
}

function logDialogue(q, speaker, answer) {
  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(DIALOGUES_DIR, `${date}.jsonl`);
  const entry = {
    ts: Date.now(),
    q,
    speaker,
    answer,
    state: WALK.s,
    phase: WALK.phi,
    holonomy: (WALK.phi / (2*Math.PI)) % 1,
    conduction: WALK.conduction,
    witness: WALK.hash(`${WALK.s}:${WALK.phi.toFixed(4)}:${WALK.cycles}`)
  };
  try {
    fss.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  } catch {}
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
    const fullPath = path.join(ROOT, 'public', filePath);
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

  if (p === '/ask' && req.method === 'POST') {
    const body = await readBody(req);
    const q = (body.q || '').trim();
    if (!q) return json(res, {error:'q required'}, 400);
    
    const speaker = getSpeaker();
    const answer = generateResponse(q);
    logDialogue(q, speaker, answer);
    
    return json(res, { 
      speaker: speaker === 'A' ? 'A' : speaker === 'B' ? 'B' : speaker === 'C' ? 'C' : 'M',
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

// Auto-step the octet
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
  console.log(`[Octet] Single Aeon with logging online at port ${PORT}`);
  console.log(`[Octet] Witness: ${WALK.hash(`${WALK.s}:${WALK.phi.toFixed(4)}:${WALK.cycles}`)}`);
});
