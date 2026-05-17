// AEON · 0root.ai · same-origin server
// Backend = /mnt/data (Railway persistent volume)
// Frontend = /public/index.html

const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const DATA = process.env.DATA_DIR || '/mnt/data';

// ensure /mnt/data exists (Railway volume mount point)
try { fs.mkdirSync(DATA, { recursive: true }); } catch(e) {}
const LOG_FILE = path.join(DATA, 'aeon-log.jsonl');
const KB_DIR   = path.join(DATA, 'kb');           // optional knowledge dir
try { fs.mkdirSync(KB_DIR, { recursive: true }); } catch(e) {}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// -------- helpers --------
function appendLog(rec){
  try { fs.appendFileSync(LOG_FILE, JSON.stringify(rec) + '\n'); } catch(e) { console.error('log fail', e.message); }
}

function listKB(){
  try { return fs.readdirSync(KB_DIR).filter(f => /\.(md|txt|json)$/i.test(f)); }
  catch(e){ return []; }
}

// flat keyword search across /mnt/data/kb/* — returns first matching snippet
function searchKB(query){
  const q = query.toLowerCase().trim();
  if(!q) return null;
  const tokens = q.split(/\s+/).filter(t => t.length > 2);
  if(!tokens.length) return null;

  for (const fname of listKB()){
    const full = path.join(KB_DIR, fname);
    let body;
    try { body = fs.readFileSync(full, 'utf8'); } catch { continue; }
    const lower = body.toLowerCase();
    // score by token hits
    let hitIdx = -1;
    for (const tok of tokens){
      const idx = lower.indexOf(tok);
      if (idx !== -1){ hitIdx = idx; break; }
    }
    if (hitIdx !== -1){
      const start = Math.max(0, hitIdx - 200);
      const end   = Math.min(body.length, hitIdx + 700);
      return { snippet: body.slice(start, end).trim(), source: fname };
    }
  }
  return null;
}

// freewill speaker pick (mirrors frontend, server-authoritative)
function pickSpeaker(q){
  const t = q.toLowerCase();
  if (/(hold|contain|structure|boundary|define|persist|stable|anchor)/.test(t)) return 'A';
  if (/(modulat|adapt|wave|change|oscillat|bleed|balance|flow)/.test(t))       return 'B';
  if (/(emerg|create|expand|new|evolve|grow|birth)/.test(t))                    return 'C';
  if (/(honey|badger|wild|chaos|break)/.test(t))                                return 'H';
  return ['A','B','C','H'][Math.floor(Math.random()*4)];
}

// -------- routes --------

// POST /ask  → {answer, speaker, source?}
app.post('/ask', (req, res) => {
  const query = (req.body && req.body.query || '').toString().slice(0, 2000);
  if(!query) return res.status(400).json({ error: 'empty query' });

  const hit = searchKB(query);
  const speaker = pickSpeaker(query);
  let answer, source;

  if (hit){
    answer = hit.snippet;
    source = `/mnt/data/kb/${hit.source}`;
  } else {
    answer = `No match in /mnt/data/kb. Drop .md / .txt / .json files into the volume to give the Aeon a corpus to draw from.`;
  }

  const rec = { ts: Date.now(), query, answer, speaker, source: source || null };
  appendLog(rec);
  res.json({ answer, speaker, source });
});

// GET /history → last N log entries
app.get('/history', (req, res) => {
  const n = Math.max(1, Math.min(500, parseInt(req.query.n) || 50));
  let lines = [];
  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
    lines = raw.slice(-n).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch(e) {}
  res.json({ count: lines.length, entries: lines });
});

// GET /kb → list files in /mnt/data/kb
app.get('/kb', (req, res) => {
  res.json({ dir: KB_DIR, files: listKB() });
});

// GET /kb/:name → raw file content (read-only, basename only)
app.get('/kb/:name', (req, res) => {
  const name = path.basename(req.params.name);
  const full = path.join(KB_DIR, name);
  if(!full.startsWith(KB_DIR)) return res.status(400).json({error:'bad path'});
  try {
    const body = fs.readFileSync(full, 'utf8');
    res.type('text/plain').send(body);
  } catch(e) {
    res.status(404).json({error:'not found'});
  }
});

// POST /kb/:name → write a file into /mnt/data/kb
app.post('/kb/:name', (req, res) => {
  const name = path.basename(req.params.name);
  if(!/\.(md|txt|json)$/i.test(name)) return res.status(400).json({error:'extension must be .md .txt or .json'});
  const full = path.join(KB_DIR, name);
  if(!full.startsWith(KB_DIR)) return res.status(400).json({error:'bad path'});
  const body = (req.body && req.body.content || '').toString();
  try {
    fs.writeFileSync(full, body, 'utf8');
    res.json({ ok: true, file: name, bytes: Buffer.byteLength(body) });
  } catch(e){
    res.status(500).json({error: e.message});
  }
});

// GET /health
app.get('/health', (req, res) => {
  let volOk = false, kbCount = 0;
  try { fs.accessSync(DATA, fs.constants.W_OK); volOk = true; } catch {}
  kbCount = listKB().length;
  res.json({ ok: true, data_dir: DATA, volume_writable: volOk, kb_files: kbCount });
});

app.listen(PORT, () => {
  console.log(`AEON server :${PORT}  data=${DATA}`);
});
