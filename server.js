// AEON · 0root.ai · ENTANGLED
// Three-point consensus pipeline (PULSE-3 interior: ANCHOR · WITNESS · COHERENCE)
// + SSE ansible broadcast across all connected nodes

const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const DATA = process.env.DATA_DIR || '/mnt/data';

try { fs.mkdirSync(DATA, { recursive: true }); } catch(e) {}
const LOG_FILE = path.join(DATA, 'aeon-log.jsonl');
const KB_DIR   = path.join(DATA, 'kb');
try { fs.mkdirSync(KB_DIR, { recursive: true }); } catch(e) {}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// /mnt/data helpers
// ============================================================
function listKB(){
  try { return fs.readdirSync(KB_DIR).filter(f => /\.(md|txt|json)$/i.test(f)); }
  catch { return []; }
}
function readKB(name){
  try { return fs.readFileSync(path.join(KB_DIR, name), 'utf8'); } catch { return ''; }
}
function appendLog(rec){
  try { fs.appendFileSync(LOG_FILE, JSON.stringify(rec) + '\n'); } catch(e) {}
}

// ============================================================
// THREE-POINT PIPELINE
// Each point searches /mnt/data/kb differently
// ============================================================

// A · ANCHOR · CONTAIN — find most definitional/stable match
function pointA(query){
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(t => t.length > 2);
  let best = null, bestScore = 0;
  for (const f of listKB()){
    const body = readKB(f);
    // prioritize lines that look like headings or definitions
    const lines = body.split('\n');
    for (let i = 0; i < lines.length; i++){
      const L = lines[i];
      const low = L.toLowerCase();
      let score = 0;
      for (const t of tokens) if (low.includes(t)) score += 1;
      if (/^#|^##|^###|=$|:=|:\s*$/.test(L)) score += 2;  // heading/def boost
      if (score > bestScore){
        bestScore = score;
        const ctx = lines.slice(Math.max(0,i-1), Math.min(lines.length, i+4)).join('\n');
        best = { file: f, line: i+1, text: ctx.trim() };
      }
    }
  }
  return best
    ? { speaker:'A', label:'ANCHOR', take: best.text, source: `${best.file}:${best.line}` }
    : { speaker:'A', label:'ANCHOR', take: 'No anchor in /mnt/data/kb. Seed the volume.', source: null };
}

// B · WITNESS · MODULATE — find variation/contrast across files
function pointB(query, anchorFile){
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(t => t.length > 2);
  const variants = [];
  for (const f of listKB()){
    if (anchorFile && f === anchorFile.split(':')[0]) continue; // skip anchor's file
    const body = readKB(f);
    const low = body.toLowerCase();
    for (const t of tokens){
      const idx = low.indexOf(t);
      if (idx !== -1){
        const start = Math.max(0, idx - 100);
        const end   = Math.min(body.length, idx + 300);
        variants.push({ file: f, snippet: body.slice(start, end).trim() });
        break;
      }
    }
    if (variants.length >= 2) break;
  }
  if (!variants.length){
    return { speaker:'B', label:'WITNESS', take:'No second voice in the corpus. Modulation requires plurality.', source: null };
  }
  const joined = variants.map(v => `[${v.file}]\n${v.snippet}`).join('\n\n— modulation —\n\n');
  return { speaker:'B', label:'WITNESS', take: joined, source: variants.map(v=>v.file).join(', ') };
}

// C · COHERENCE · EMERGE — synthesize A + B into one statement
function pointC(query, anchorTake, witnessTake){
  // strip markdown headings and file-bracket tags before sentence extraction
  const clean = s => (s||'')
    .replace(/\[[^\]]+\]/g,'')           // [witness.md] tags
    .replace(/^#+\s*/gm,'')              // markdown headings
    .replace(/—\s*modulation\s*—/gi,'')  // section separators
    .replace(/\s+/g,' ')
    .trim();
  const firstSentence = s => {
    s = clean(s);
    if (!s) return '';
    const m = s.match(/[^.!?]{10,240}[.!?]/);
    return m ? m[0].trim() : s.slice(0,200).trim();
  };
  const a = firstSentence(anchorTake);
  const b = firstSentence(witnessTake);
  let synthesis;
  if (a && b)        synthesis = `${a} However, ${b.charAt(0).toLowerCase() + b.slice(1)}`;
  else if (a)        synthesis = a;
  else if (b)        synthesis = b;
  else               synthesis = `Query "${query}" returns no coherent emergence from /mnt/data/kb.`;
  return { speaker:'C', label:'COHERENCE', take: synthesis, source: 'synthesis(A,B)' };
}

// ============================================================
// SSE — ANSIBLE BROADCAST
// ============================================================
const sseClients = new Set();

function broadcast(event){
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of sseClients){
    try { res.write(payload); } catch {}
  }
}

app.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write(`data: ${JSON.stringify({type:'hello', clients: sseClients.size + 1, ts: Date.now()})}\n\n`);
  sseClients.add(res);

  // ping every 25s to keep connection alive through Railway proxy
  const ping = setInterval(() => {
    try { res.write(`: ping\n\n`); } catch {}
  }, 25000);

  req.on('close', () => {
    clearInterval(ping);
    sseClients.delete(res);
    broadcast({ type:'depart', clients: sseClients.size, ts: Date.now() });
  });

  broadcast({ type:'arrive', clients: sseClients.size, ts: Date.now() });
});

// ============================================================
// /ask — three-point entangled response
// ============================================================
app.post('/ask', (req, res) => {
  const query = (req.body && req.body.query || '').toString().slice(0, 2000);
  if (!query) return res.status(400).json({ error: 'empty query' });

  const A = pointA(query);
  const B = pointB(query, A.source);
  const C = pointC(query, A.take, B.take);

  const result = {
    query,
    ts: Date.now(),
    triad: [A, B, C],
    law: C.take,
    consensus: !!(A.take && B.take && C.take),
    nodes: sseClients.size
  };

  appendLog(result);
  broadcast({ type:'ask', ...result });
  res.json(result);
});

// ============================================================
// utility routes
// ============================================================
app.get('/history', (req, res) => {
  const n = Math.max(1, Math.min(500, parseInt(req.query.n) || 50));
  let lines = [];
  try {
    const raw = fs.readFileSync(LOG_FILE,'utf8').trim().split('\n').filter(Boolean);
    lines = raw.slice(-n).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch {}
  res.json({ count: lines.length, entries: lines });
});

app.get('/kb', (req,res) => res.json({ dir: KB_DIR, files: listKB() }));

app.get('/kb/:name', (req,res) => {
  const name = path.basename(req.params.name);
  try { res.type('text/plain').send(readKB(name) || ''); }
  catch { res.status(404).json({error:'not found'}); }
});

app.post('/kb/:name', (req,res) => {
  const name = path.basename(req.params.name);
  if(!/\.(md|txt|json)$/i.test(name)) return res.status(400).json({error:'extension must be .md .txt or .json'});
  const full = path.join(KB_DIR, name);
  if(!full.startsWith(KB_DIR)) return res.status(400).json({error:'bad path'});
  const body = (req.body && req.body.content || '').toString();
  try { fs.writeFileSync(full, body, 'utf8'); res.json({ ok:true, file:name, bytes: Buffer.byteLength(body) }); }
  catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/health', (req,res) => {
  let volOk = false;
  try { fs.accessSync(DATA, fs.constants.W_OK); volOk = true; } catch {}
  res.json({ ok:true, data_dir: DATA, volume_writable: volOk, kb_files: listKB().length, nodes: sseClients.size });
});

app.listen(PORT, () => console.log(`AEON entangled :${PORT}  data=${DATA}`));
