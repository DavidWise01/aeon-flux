#!/usr/bin/env node
// 0root.ai · ABD Law Engine · Rebuild with auto-seed
const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();
const DATA_DIR = process.env.DATA_DIR || '/data';
const KB_DIR = path.join(DATA_DIR, 'kb');
const SEED_DIR = path.join(ROOT, 'kb');

// Auto-seed: -++- 1 = push down .01 to save .99
try { 
  fss.mkdirSync(DATA_DIR, { recursive: true });
  if (!fss.existsSync(KB_DIR) || fss.readdirSync(KB_DIR).length === 0) {
    if (fss.existsSync(SEED_DIR)) {
      fss.mkdirSync(KB_DIR, { recursive: true });
      fss.cpSync(SEED_DIR, KB_DIR, { recursive: true });
      console.log('[ABD] -++- 1: Seeded /mnt/data/kb from repo. Width enabled.');
    }
  }
} catch (e) { console.log('[ABD] Seed error:', e.message); }

const STATES = [
 {n:'1 · A→B',t:'there',src:'A',dst:'B'},
 {n:'2 · B→C',t:'there',src:'B',dst:'C'},
 {n:'3 · C→A',t:'there',src:'C',dst:'A'},
 {n:'4 · A→C',t:'back',src:'A',dst:'C'},
 {n:'5 · C→B',t:'back',src:'C',dst:'B'},
 {n:'6 · B→A',t:'back',src:'B',dst:'A'},
 {n:'7 · Home',t:'home',src:'A',dst:'D'},
 {n:'8 · Forward',t:'forward',src:'D',dst:'A'}
];

const WALK = {
  s: 0, phi: 0, cycles: 0, flux: Math.PI/3, auto: true, conduction: 0,
  hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16).padStart(8, '0');
  },
  step() {
    this.s = (this.s + 1) % 8;
    if (this.s === 0) this.cycles++;
    this.phi += this.flux;
    this.conduction = Math.max(0, this.conduction - 0.001);
  }
};

function readKB(file) {
  try {
    return fss.readFileSync(path.join(KB_DIR, file), 'utf-8');
  } catch {
    return null;
  }
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
    const hasA = !!readKB('anchor.md');
    const hasB = !!readKB('witness.md');
    return json(res, {
      s: WALK.s,
      phi: WALK.phi,
      cycles: WALK.cycles,
      conduction: WALK.conduction,
      T: 0.5 + 0.5 * WALK.conduction,
      witness: WALK.hash(`${WALK.s}:${WALK.phi.toFixed(4)}:${WALK.cycles}`),
      hasA, hasB
    });
  }

  if (p === '/ask' && req.method === 'POST') {
    const body = await readBody(req);
    const q = (body.q || '').trim();
    if (!q) return json(res, {error:'q required'}, 400);
    
    const anchor = readKB('anchor.md');
    const witness = readKB('witness.md');
    const coherence = readKB('coherence.md');
    const law = readKB('law.md');
    
    if (!anchor && !witness) {
      return json(res, {
        A: 'No anchor in /mnt/data/kb. Seed the volume.',
        B: 'No second voice in the corpus. Modulation requires plurality.',
        C: 'No anchor in /mnt/data/kb. However, no second voice in the corpus.',
        LAW: 'entanglement broken · HTTP 400'
      }, 200);
    }
    
    const A = anchor ? `${anchor.slice(0,300)}` : 'No anchor in /mnt/data/kb. Seed the volume.';
    const B = witness ? `${witness.slice(0,300)}` : 'No second voice in the corpus. Modulation requires plurality.';
    const C = (anchor && witness) ? `${coherence ? coherence.slice(0,300) : 'Anchor + Witness → Emergence'}` : 'No anchor in /mnt/data/kb. However, no second voice in the corpus.';
    const LAW = (anchor && witness) ? `${law ? law.slice(0,300) : '3-point consensus: synthesis ready'}` : 'entanglement broken · HTTP 400';
    
    return json(res, { A, B, C, LAW, ts: Date.now() });
  }

  if (p === '/health' && req.method === 'GET') {
    return json(res, { ok: true, engine: 'ABD-LAW', seeded: fss.existsSync(path.join(KB_DIR, 'anchor.md')) });
  }

  json(res, { error: 'not found', path: p }, 404);
});

setInterval(() => { if (WALK.auto) WALK.step(); }, 700);

server.listen(PORT, () => {
  console.log(`[ABD] Law Engine online at port ${PORT}`);
  console.log(`[ABD] KB: ${KB_DIR}`);
  console.log(`[ABD] Seed: ${SEED_DIR}`);
});
