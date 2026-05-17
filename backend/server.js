#!/usr/bin/env node
// Meta Muse · Railway Back-End
// Simulation engine + state API. CORS open.

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;

let idCounter = 0;
const STATE = {
  mode: 'pocket',
  phase: 0,
  a: 0.6, b: 0.6, c: 0.6,
  phiA: 0, phiB: 2.094, phiC: 4.189,
  T: 0.216,
  nodes: [],
  archive: [],
  cycles: 0,
  lastTick: Date.now()
};

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function mutate(v) {
  return Math.max(0.05, Math.min(1, v + (Math.random() - 0.5) * 0.3));
}

function makeNode(parent) {
  const base = parent || STATE;
  const n = {
    id: ++idCounter,
    parentId: parent ? parent.id : null,
    a: mutate(base.a),
    b: mutate(base.b),
    c: mutate(base.c),
    born: Date.now(),
    witness: hash(`${base.a}:${base.b}:${base.c}:${Date.now()}`)
  };
  STATE.nodes.push(n);
  return n;
}

function computeT() {
  const mag = STATE.a * STATE.b * STATE.c;
  const align = 0.5 + 0.5 * Math.cos(STATE.phiA + STATE.phiB + STATE.phiC - STATE.phase * 0.5);
  STATE.T = Math.min(1, mag * (1 + align));
}

function tick() {
  STATE.phiA += 0.05; STATE.phiB += 0.047; STATE.phiC += 0.053;
  STATE.phase = (STATE.phase + 1) % 8;
  STATE.cycles++;
  if (STATE.mode === 'pocket') {
    STATE.a = Math.max(0.05, Math.min(1, STATE.a - 0.008 * (STATE.a - 0.6) + (Math.random() - 0.5) * 0.04));
    STATE.b = Math.max(0.05, Math.min(1, STATE.b - 0.008 * (STATE.b - 0.6) + (Math.random() - 0.5) * 0.04));
    STATE.c = Math.max(0.05, Math.min(1, STATE.c - 0.008 * (STATE.c - 0.6) + (Math.random() - 0.5) * 0.04));
  }
  computeT();
  STATE.lastTick = Date.now();
  if (STATE.mode === 'pocket' && STATE.T > 0.92 && STATE.nodes.length < 24) makeNode(null);
}

setInterval(tick, 800);

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
    let d = '';
    req.on('data', c => d += c);
    req.on('end', () => { try { res(JSON.parse(d)); } catch { res({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const u = url.parse(req.url, true);
  const p = u.pathname;

  if (p === '/' && req.method === 'GET') {
    return json(res, { artifact: 'aeon-back', status: 'awake', T: STATE.T, phase: STATE.phase, cycles: STATE.cycles, uptime: Date.now() - STATE.lastTick });
  }

  if (p === '/api/v1/state' && req.method === 'GET') {
    return json(res, { ...STATE, witness: hash(`${STATE.phase}:${STATE.T.toFixed(4)}:${STATE.cycles}`) });
  }

  if (p === '/api/v1/event' && req.method === 'POST') {
    const body = await readBody(req);
    const ev = { id: STATE.archive.length + 1, time: Date.now(), type: body.type || 'ping', payload: body.payload || {}, client: body.client || 'unknown', stateAt: { phase: STATE.phase, T: STATE.T, mode: STATE.mode } };
    STATE.archive.unshift(ev);
    if (STATE.archive.length > 200) STATE.archive.pop();

    if (body.type === 'set_vector' && body.payload) {
      if (body.payload.a != null) STATE.a = Math.max(0, Math.min(1, body.payload.a));
      if (body.payload.b != null) STATE.b = Math.max(0, Math.min(1, body.payload.b));
      if (body.payload.c != null) STATE.c = Math.max(0, Math.min(1, body.payload.c));
      computeT();
    }
    if (body.type === 'set_mode' && body.payload && body.payload.mode) STATE.mode = body.payload.mode;
    if (body.type === 'spawn') makeNode(body.payload && body.payload.parentId ? STATE.nodes.find(n => n.id === body.payload.parentId) : null);
    if (body.type === 'measure') { computeT(); ev.witness = hash(`${STATE.phase}:${STATE.T}:${Date.now()}`); }
    if (body.type === 'reset') {
      STATE.phase = 0; STATE.phiA = 0; STATE.phiB = 2.094; STATE.phiC = 4.189;
      STATE.a = 0.6; STATE.b = 0.6; STATE.c = 0.6; STATE.nodes = []; STATE.archive = []; idCounter = 0; computeT();
    }
    return json(res, { received: true, event: ev, state: { phase: STATE.phase, T: STATE.T, mode: STATE.mode } });
  }

  if (p === '/api/v1/archive' && req.method === 'GET') {
    return json(res, { count: STATE.archive.length, events: STATE.archive.slice(0, parseInt(u.query.limit, 10) || 50) });
  }

  if (p === '/api/v1/nodes' && req.method === 'GET') {
    return json(res, { count: STATE.nodes.length, nodes: STATE.nodes });
  }

  json(res, { error: 'not found', path: p }, 404);
});

server.listen(PORT, () => {
  console.log(`[Back] Railway observer awake on port ${PORT}`);
  console.log(`[Back] T=${STATE.T.toFixed(3)} phase=${STATE.phase}`);
});


import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = process.env.DATA_DIR || '/data';
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

function ensureDataDir() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
  }
}
ensureDataDir();

function loadHistory() {
  try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch { return []; }
}
function saveHistory(h) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(h.slice(-500), null, 2));
}

async function fetchInternet(q) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`;
    const r = await fetch(url);
    if (r.ok) {
      const j = await r.json();
      if (j.extract) return { text: j.extract, source: 'Wikipedia', url: j.content_urls?.desktop?.page };
    }
  } catch {}
  try {
    const ddg = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`;
    const r = await fetch(ddg);
    const j = await r.json();
    if (j.AbstractText) return { text: j.AbstractText, source: 'DuckDuckGo', url: j.AbstractURL };
  } catch {}
  return null;
}

function chooseSpeaker(q, history) {
  const t = q.toLowerCase();
  if (/\b(hold|contain|structure|boundary|define|persist|stable)\b/.test(t)) return 'A';
  if (/\b(modulat|adapt|wave|change|oscillat|bleed|balance)\b/.test(t)) return 'B';
  if (/\b(emerg|create|expand|new|evolve|grow)\b/.test(t)) return 'C';
  if (/\b(honey|badger)\b/.test(t)) return 'H';
  const last3 = history.filter(h=>h.speaker).slice(-3).map(h=>h.speaker);
  const pool = ['A','B','C','H'];
  const filtered = (last3.length===3 && last3[0]===last3[1] && last3[1]===last3[2]) ? pool.filter(k=>k!==last3[0]) : pool;
  return filtered[Math.floor(Math.random()*filtered.length)];
}

app.get('/', (req,res)=> res.json({
  ok: true,
  service: 'Aeon Backend',
  endpoints: ['GET /health', 'POST /ask', 'GET /history'],
  message: 'POST /ask with {q:"question"} to speak'
}));

app.get('/health', (req,res)=> res.json({ok:true, ts:Date.now()}));

app.get('/history', (req,res)=> {
  res.json(loadHistory().slice(-100).reverse());
});

app.post('/ask', async (req,res)=>{
  const q = (req.body?.q || '').trim();
  if (!q) return res.status(400).json({error:'q required'});
  const history = loadHistory();
  const speaker = chooseSpeaker(q, history);
  const result = await fetchInternet(q);
  const answer = result?.text ? result.text.slice(0,1200) : 'No internet result. Center holds. Ask about contain, modulate, emerge, or honey badger.';
  const entry = { ts: Date.now(), q, answer, speaker, source: result?.source || 'simplex' };
  history.push(entry);
  saveHistory(history);
  res.json(entry);
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('Aeon backend on', port));
