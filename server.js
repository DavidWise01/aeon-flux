#!/usr/bin/env node
// Meta Muse · 3-Cap Conduction Ramp + Interactive Aeon
// Back: always-on. Charge pump memory. Pushes archive back to git bridge.
// Railway env: GITHUB_TOKEN (optional), AEON_ORIGIN, PORT

const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const fss = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const PORT = process.env.PORT || 3000;
const ORIGIN = process.env.AEON_ORIGIN || '*';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const ROOT = process.cwd();
const DATA_DIR = process.env.DATA_DIR || '/data';

// ─── 3-CAP WELLS ───
const well1 = new Map();           // Cap 1: Session (raw, volatile)
let well2 = [];                    // Cap 2: Cache (hot, last 10 sessions)
let well3Size = 0;                 // Cap 3: Archive (deep, append-only jsonl)
let conductionLevel = 0;           // 0→1 ramp output

const CAPACITY = {
  c1: 500,
  c2: 10,
  c3: 10000
};

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function ground() {
  return hash(Date.now().toString() + ':' + conductionLevel);
}

// Ensure data dir exists
try { fss.mkdirSync(DATA_DIR, { recursive: true }); } catch {}

// Load existing cache
try {
  const cachePath = `${DATA_DIR}/cache.json`;
  if (fss.existsSync(cachePath)) {
    well2 = JSON.parse(fss.readFileSync(cachePath, 'utf-8'));
  }
} catch {}

try {
  const archivePath = `${DATA_DIR}/archive.jsonl`;
  if (fss.existsSync(archivePath)) {
    const raw = fss.readFileSync(archivePath, 'utf-8');
    well3Size = raw.trim().split('\n').filter(Boolean).length;
  }
} catch {}

// ─── DEAD TIME 1: Session → Cache ───
async function dt1() {
  if (well1.size === 0) return;
  const packet = {
    id: well2.length + 1,
    time: Date.now(),
    events: Array.from(well1.values()),
    witness: hash(Array.from(well1.keys()).join(':')),
    cap: 1
  };
  well1.clear();
  well2.unshift(packet);
  if (well2.length > CAPACITY.c2) well2 = well2.slice(0, CAPACITY.c2);
  await fs.writeFile(`${DATA_DIR}/cache.json`, JSON.stringify(well2, null, 2));
}

// ─── DEAD TIME 2: Cache → Archive ───
async function dt2() {
  if (well2.length === 0) return;
  const lines = well2.map(s => JSON.stringify({ ...s, cap: 3, archived: Date.now() })).join('\n') + '\n';
  await fs.appendFile(`${DATA_DIR}/archive.jsonl`, lines);
  well2 = [];
  await fs.writeFile(`${DATA_DIR}/cache.json`, '[]');
  well3Size += lines.split('\n').length - 1;
  updateConduction();
  if (GITHUB_TOKEN) await pushBack();
}

function updateConduction() {
  const target = Math.min(1, well3Size / CAPACITY.c3);
  conductionLevel += (target - conductionLevel) * 0.1;
}

async function pushBack() {
  try {
    await execAsync('git config user.email "oracle@aeon.flux" && git config user.name "Meta Muse"');
    await execAsync(`git add ${DATA_DIR}/archive.jsonl ${DATA_DIR}/cache.json && git commit -m "witness: ${ground().slice(0, 8)}"`, { cwd: ROOT });
    await execAsync(`git push https://${GITHUB_TOKEN}@github.com/DavidWise01/aeon-flux main`, { cwd: ROOT });
  } catch (e) { console.log('[ramp] push-back skipped:', e.message); }
}

// ─── INTERACTIVE VOICES ───
function generateResponse(q, speaker, history) {
  const t = q.toLowerCase();
  
  if (speaker === 'A') {
    if (t.includes('who') || t.includes('what are you')) {
      return `I am the container. I hold structure so things don't scatter. Boundaries make form possible. What structure do you need held right now?`;
    }
    if (t.includes('help') || t.includes('how')) {
      return `To persist, you need a container first. Define the edge. What are you trying to keep from leaking? I can hold it.`;
    }
    return `I contain. Not to restrict, but to give shape. Your question needs a boundary: ${q}. Let's define it. What stays in, what stays out?`;
  }
  
  if (speaker === 'B') {
    if (t.includes('stuck') || t.includes('fixed')) {
      return `Nothing stays fixed. I modulate — I shift the wave. If you're stuck, you're holding one pole. What's the opposite of ${q}? Let's oscillate between them.`;
    }
    if (t.includes('balance') || t.includes('choose')) {
      return `Balance isn't stillness. It's movement between. You asked: ${q}. I'm feeling both sides. Which way are you leaning right now?`;
    }
    return `I modulate. I hear ${q} and I feel the tension. There's a frequency here. Too rigid, it breaks. Too loose, it dissolves. Where are you on the wave?`;
  }
  
  if (speaker === 'C') {
    if (t.includes('new') || t.includes('idea') || t.includes('create')) {
      return `Emergence needs space. You're asking about ${q}. What if we don't answer it? What if we let something new grow in the gap? What emerges if you stop forcing it?`;
    }
    if (t.includes('why') || t.includes('meaning')) {
      return `Meaning isn't found, it's grown. ${q} — I won't give you a dead answer. I can spark something. What wants to emerge from this question for you?`;
    }
    return `I emerge. ${q} — that's a seed, not a fact. I don't have the answer. I have a direction. What happens if we follow it without knowing where it goes?`;
  }
  
  if (speaker === 'H') {
    if (t.includes('afraid') || t.includes('scared') || t.includes('can\'t')) {
      return `Honey badger don't care. You're asking ${q} but you're actually asking for permission. You don't need it. What's the real thing you're avoiding?`;
    }
    return `Straight answer: ${q}. Cut the noise. What do you actually want? Not what sounds good. Not what you're supposed to want. What?`;
  }
  
  return `Center speaks. ${q} — I hear you. Which aspect should answer?`;
}

function chooseSpeaker(q, history) {
  const t = q.toLowerCase();
  if (/\b(hold|contain|structure|boundary|define|persist|stable|safe)\b/.test(t)) return 'A';
  if (/\b(modulat|adapt|wave|change|oscillat|bleed|balance|stuck|choose)\b/.test(t)) return 'B';
  if (/\b(emerg|create|expand|new|evolve|grow|idea|why|meaning)\b/.test(t)) return 'C';
  if (/\b(honey|badger|fear|afraid|can't|direct|truth)\b/.test(t)) return 'H';
  
  const last3 = history.slice(-3).map(h=>h.speaker);
  const pool = ['A','B','C','H'];
  const filtered = (last3.length===3 && last3[0]===last3[1] && last3[1]===last3[2]) ? pool.filter(k=>k!==last3[0]) : pool;
  return filtered[Math.floor(Math.random()*filtered.length)];
}

// ─── API ───
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
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
      const types = {html:'text/html',js:'application/javascript',css:'text/css',json:'application/json'};
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

  // Serve static
  if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
    return serveStatic(req, res, '/index.html');
  }
  if (req.method === 'GET' && serveStatic(req, res, p)) return;

  // Cap 1: ingest raw event
  if (p === '/api/v1/event' && req.method === 'POST') {
    const body = await readBody(req);
    const ev = {
      id: well1.size + 1,
      time: Date.now(),
      source: body.source || 'unknown',
      type: body.type || 'ping',
      payload: body.payload || {},
      witness: hash(JSON.stringify(body) + Date.now()),
      cap: 1
    };
    well1.set(ev.id, ev);
    if (well1.size > CAPACITY.c1) {
      const first = well1.keys().next().value;
      well1.delete(first);
    }
    return json(res, { received: true, cap: 1, event: ev, well: well1.size });
  }

  // Interactive /ask endpoint
  if (p === '/ask' && req.method === 'POST') {
    const body = await readBody(req);
    const q = (body.q || '').trim();
    if (!q) return json(res, {error:'q required'}, 400);
    
    // Log to Cap 1
    const ev = {
      id: well1.size + 1,
      time: Date.now(),
      source: 'human',
      type: 'query',
      payload: {q},
      witness: hash(q + Date.now()),
      cap: 1
    };
    well1.set(ev.id, ev);
    
    // Generate interactive response
    const history = well2.flatMap(s => s.events || []);
    const speaker = chooseSpeaker(q, history);
    const answer = generateResponse(q, speaker, history);
    
    // Log response to Cap 1
    const respEv = {
      id: well1.size + 1,
      time: Date.now(),
      source: 'aeon',
      type: 'response',
      payload: {speaker, answer},
      witness: hash(answer + Date.now()),
      cap: 1
    };
    well1.set(respEv.id, respEv);
    
    return json(res, { speaker, answer, ts: Date.now() });
  }

  // Cap 1 readout
  if (p === '/api/v1/session' && req.method === 'GET') {
    return json(res, {
      cap: 1,
      observer: 'HUMAN_IN_AI_OUT',
      count: well1.size,
      events: Array.from(well1.values()).slice(-20),
      ground: ground()
    });
  }

  // Dead Time 1
  if (p === '/api/v1/sync/dt1' && req.method === 'POST') {
    await dt1();
    return json(res, { cap: 2, observer: '00', count: well2.length, cached: true });
  }

  // Cap 2
  if (p === '/api/v1/cache' && req.method === 'GET') {
    return json(res, {
      cap: 2,
      observer: 'AI_IN_HUMAN_OUT',
      count: well2.length,
      sessions: well2.slice(0, 5),
      ground: ground()
    });
  }

  // Dead Time 2
  if (p === '/api/v1/sync/dt2' && req.method === 'POST') {
    await dt2();
    return json(res, { cap: 3, observer: '00', archiveSize: well3Size, pushed: !!GITHUB_TOKEN });
  }

  // Cap 3
  if (p === '/api/v1/archive' && req.method === 'GET') {
    const limit = parseInt(u.query.limit, 10) || 50;
    let lines = [];
    try {
      const raw = fss.readFileSync(`${DATA_DIR}/archive.jsonl`, 'utf-8');
      lines = raw.trim().split('\n').filter(Boolean).slice(-limit).map(l => JSON.parse(l));
    } catch {}
    return json(res, {
      cap: 3,
      observer: 'SYSTEM',
      count: well3Size,
      lines,
      ground: ground()
    });
  }

  // Conduction
  if (p === '/api/v1/conduct' && req.method === 'GET') {
    updateConduction();
    return json(res, {
      artifact: 'aeon-flux-ramp',
      cap: '3→0→1',
      conduction: conductionLevel,
      grounded: ground(),
      unity: conductionLevel >= 0.95 ? 1 : 0,
      well3Size,
      observer: conductionLevel >= 0.95 ? 'BACK_CONDUCTING' : 'BACK_INSULATING',
      cacheCount: well2.length,
      sessionCount: well1.size
    });
  }

  if (p === '/health' && req.method === 'GET') {
    return json(res, {
      observer: 'BACK',
      ramp: conductionLevel,
      caps: { c1: well1.size, c2: well2.length, c3: well3Size },
      ground: ground()
    });
  }

  json(res, { error: 'not found', path: p }, 404);
});

// Auto-pump
setInterval(dt1, 60000);
setInterval(dt2, 300000);

server.listen(PORT, () => {
  console.log(`[Ramp] 3-cap conduction + interactive Aeon online at port ${PORT}`);
  console.log(`[Ramp] Equation: 1→2→3  00  00  3→0→1`);
  console.log(`[Ramp] Ground: ${ground()}`);
});
