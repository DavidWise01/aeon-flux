import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/health', (req,res)=> res.json({ok:true, ts:Date.now(), domain:'0root.ai'}));

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

app.get('*', (req,res)=> {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('0root.ai Aeon online on port', port));
