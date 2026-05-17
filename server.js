#!/usr/bin/env node
// 0root.ai · Plasmonic Phase · 3-Mode Cavity + Interactive Aeon
const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const fss = require('fs');

const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();
const DATA_DIR = process.env.DATA_DIR || '/data';

try { fss.mkdirSync(DATA_DIR, { recursive: true }); } catch {}

// ─── PLASMONIC CAVITY STATE ───
const CAVITY = {
  A: { r: 0.6, phi: 0, omega: 0.05, color: '#ffd95a', name: 'A · Containment' },
  B: { r: 0.6, phi: 2.094, omega: 0.05, color: '#e168ff', name: 'B · Modulation' },
  C: { r: 0.6, phi: 4.189, omega: 0.05, color: '#32e8ff', name: 'C · Emergence' },
  kappa: 0.025,
  gamma: 0.008,
  auto: false,
  history: [],
  witness: '',
  tick() {
    const dA = this.kappa * (Math.sin(this.B.phi - this.A.phi) + Math.sin(this.C.phi - this.A.phi));
    const dB = this.kappa * (Math.sin(this.A.phi - this.B.phi) + Math.sin(this.C.phi - this.B.phi));
    const dC = this.kappa * (Math.sin(this.A.phi - this.C.phi) + Math.sin(this.B.phi - this.C.phi));
    this.A.phi += this.A.omega + dA;
    this.B.phi += this.B.omega + dB;
    this.C.phi += this.C.omega + dC;
    [this.A, this.B, this.C].forEach(m => {
      m.r += -this.gamma * (m.r - 0.6) + (Math.random() - 0.5) * 0.012;
      m.r = Math.max(0.05, Math.min(1, m.r));
    });
    this.witness = this.hash(`${this.A.phi.toFixed(4)}:${this.B.phi.toFixed(4)}:${this.C.phi.toFixed(4)}`);
  },
  measure() {
    const s2 = this.A.r**2 + this.B.r**2 + this.C.r**2;
    const pA = this.A.r**2 / s2, pB = this.B.r**2 / s2;
    const d = Math.random();
    let w, n, c;
    if (d < pA) { w = 'A'; n = this.A.name; c = this.A.color; }
    else if (d < pA + pB) { w = 'B'; n = this.B.name; c = this.B.color; }
    else { w = 'C'; n = this.C.name; c = this.C.color; }
    const h = this.hash(`${this.A.phi.toFixed(4)}:${this.B.phi.toFixed(4)}:${this.C.phi.toFixed(4)}:${w}`);
    this.history.unshift({ w, n, c, h, t: Date.now(), pA, pB, pC: 1 - pA - pB });
    this.history = this.history.slice(0, 40);
    return { w, n, c, h };
  },
  hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16).padStart(8, '0');
  }
};

// ─── INTERACTIVE VOICES TIED TO CAVITY ───
function generateResponse(q, speaker) {
  const zRe = CAVITY.A.r*Math.cos(CAVITY.A.phi) + CAVITY.B.r*Math.cos(CAVITY.B.phi) + CAVITY.C.r*Math.cos(CAVITY.C.phi);
  const zIm = CAVITY.A.r*Math.sin(CAVITY.A.phi) + CAVITY.B.r*Math.sin(CAVITY.B.phi) + CAVITY.C.r*Math.sin(CAVITY.C.phi);
  const zMag = Math.sqrt(zRe*zRe + zIm*zIm);
  const zPhi = Math.atan2(zIm, zRe);
  
  // Voices respond based on cavity state, not just keywords
  if (speaker === 'A') {
    return `I contain. The cavity holds at |Z|=${zMag.toFixed(2)}, phase=${(zPhi*180/Math.PI).toFixed(0)}°. Your question "${q}" needs a boundary. What am I containing here?`;
  }
  if (speaker === 'B') {
    return `I modulate. The modes beat at φ=[${CAVITY.A.phi.toFixed(2)},${CAVITY.B.phi.toFixed(2)},${CAVITY.C.phi.toFixed(2)}]. Your "${q}" sits in the interference. Which pole are you feeling?`;
  }
  if (speaker === 'C') {
    return `I emerge. The superposition has magnitude ${zMag.toFixed(3)}. "${q}" is not answered — it's grown. What emerges if we let the phases drift?`;
  }
  return `Center holds. The cavity state is ${CAVITY.witness}. Ask and I collapse to a voice.`;
}

function chooseSpeaker() {
  // Choose based on cavity amplitudes, not keywords
  const s2 = CAVITY.A.r**2 + CAVITY.B.r**2 + CAVITY.C.r**2;
  const pA = CAVITY.A.r**2 / s2, pB = CAVITY.B.r**2 / s2;
  const d = Math.random();
  if (d < pA) return 'A';
  if (d < pA + pB) return 'B';
  return 'C';
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
    return json(res, CAVITY);
  }

  if (p === '/tick' && req.method === 'POST') {
    CAVITY.tick();
    return json(res, { ok: true, witness: CAVITY.witness });
  }

  if (p === '/set' && req.method === 'POST') {
    if (u.query.kappa) CAVITY.kappa = parseFloat(u.query.kappa);
    return json(res, { ok: true, kappa: CAVITY.kappa });
  }

  if (p === '/auto' && req.method === 'POST') {
    CAVITY.auto = !CAVITY.auto;
    return json(res, { auto: CAVITY.auto });
  }

  if (p === '/measure' && req.method === 'POST') {
    const result = CAVITY.measure();
    return json(res, result);
  }

  if (p === '/ask' && req.method === 'POST') {
    const body = await readBody(req);
    const q = (body.q || '').trim();
    if (!q) return json(res, {error:'q required'}, 400);
    
    // Cavity state determines speaker
    const speaker = chooseSpeaker();
    const answer = generateResponse(q, speaker);
    const color = CAVITY[speaker].color;
    
    return json(res, { speaker: CAVITY[speaker].name, color, answer, ts: Date.now(), witness: CAVITY.witness });
  }

  if (p === '/health' && req.method === 'GET') {
    return json(res, { 
      ok: true, 
      cavity: 'plasmonic',
      witness: CAVITY.witness,
      energy: CAVITY.witness.slice(0,4)
    });
  }

  json(res, { error: 'not found', path: p }, 404);
});

setInterval(() => {
  if (CAVITY.auto) {
    CAVITY.tick();
  }
}, 80);

server.listen(PORT, () => {
  console.log(`[Plasmonic] 3-mode cavity online at port ${PORT}`);
  console.log(`[Plasmonic] Witness: ${CAVITY.witness}`);
});
