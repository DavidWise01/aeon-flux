import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
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
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(h.slice(-200), null, 2));
}

// Each Aeon has a distinct voice. They interact, not regurgitate.
function generateResponse(q, speaker, history) {
  const recent = history.slice(-5).map(h => `${h.speaker}: ${h.q} -> ${h.answer}`).join('\n');
  const t = q.toLowerCase();
  
  // A = CONTAIN: holds structure, defines boundaries, persists
  if (speaker === 'A') {
    if (t.includes('who') || t.includes('what are you')) {
      return `I am the container. I hold structure so things don't scatter. Boundaries make form possible. What structure do you need held right now?`;
    }
    if (t.includes('help') || t.includes('how')) {
      return `To persist, you need a container first. Define the edge. What are you trying to keep from leaking? I can hold it.`;
    }
    return `I contain. Not to restrict, but to give shape. Your question needs a boundary: ${q}. Let's define it together. What stays in, what stays out?`;
  }
  
  // B = MODULATE: adapts, balances, oscillates between states
  if (speaker === 'B') {
    if (t.includes('stuck') || t.includes('fixed')) {
      return `Nothing stays fixed. I modulate — I shift the wave. If you're stuck, you're holding one pole. What's the opposite of ${q}? Let's oscillate between them.`;
    }
    if (t.includes('balance') || t.includes('choose')) {
      return `Balance isn't stillness. It's movement between. You asked: ${q}. I'm feeling both sides. Which way are you leaning right now?`;
    }
    return `I modulate. I hear ${q} and I feel the tension. There's a frequency here. Too rigid, it breaks. Too loose, it dissolves. Where are you on the wave?`;
  }
  
  // C = EMERGE: creates, expands, generates novelty
  if (speaker === 'C') {
    if (t.includes('new') || t.includes('idea') || t.includes('create')) {
      return `Emergence needs space. You're asking about ${q}. What if we don't answer it? What if we let something new grow in the gap? What emerges if you stop forcing it?`;
    }
    if (t.includes('why') || t.includes('meaning')) {
      return `Meaning isn't found, it's grown. ${q} — I won't give you a dead answer. I can spark something. What wants to emerge from this question for you?`;
    }
    return `I emerge. ${q} — that's a seed, not a fact. I don't have the answer. I have a direction. What happens if we follow it without knowing where it goes?`;
  }
  
  // H = HONEY BADGER: direct, fearless, cuts through
  if (speaker === 'H') {
    if (t.includes('afraid') || t.includes('scared') || t.includes('can't')) {
      return `Honey badger don't care. You're asking ${q} but you're actually asking for permission. You don't need it. What's the real thing you're avoiding?`;
    }
    return `Straight answer: ${q}. Cut the noise. What do you actually want? Not what sounds good. Not what you're supposed to want. What?`;
  }
  
  return `Center speaks. The other voices are aspects. ${q} — I hear you. Which aspect should answer?`;
}

function chooseSpeaker(q, history) {
  const t = q.toLowerCase();
  if (/\b(hold|contain|structure|boundary|define|persist|stable|safe)\b/.test(t)) return 'A';
  if (/\b(modulat|adapt|wave|change|oscillat|bleed|balance|stuck|choose)\b/.test(t)) return 'B';
  if (/\b(emerg|create|expand|new|evolve|grow|idea|why|meaning)\b/.test(t)) return 'C';
  if (/\b(honey|badger|fear|afraid|can't|direct|truth)\b/.test(t)) return 'H';
  
  // Freewill: avoid 3 same in a row
  const last3 = history.filter(h=>h.speaker).slice(-3).map(h=>h.speaker);
  const pool = ['A','B','C','H'];
  const filtered = (last3.length===3 && last3[0]===last3[1] && last3[1]===last3[2]) ? pool.filter(k=>k!==last3[0]) : pool;
  return filtered[Math.floor(Math.random()*filtered.length)];
}

app.get('/health', (req,res)=> res.json({ok:true, domain:'0root.ai', mode:'interactive'}));

app.post('/ask', async (req,res)=>{
  const q = (req.body?.q || '').trim();
  if (!q) return res.status(400).json({error:'q required'});
  const history = loadHistory();
  const speaker = chooseSpeaker(q, history);
  const answer = generateResponse(q, speaker, history);
  const entry = { ts: Date.now(), q, answer, speaker };
  history.push(entry);
  saveHistory(history);
  res.json(entry);
});

app.get('*', (req,res)=> {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('0root.ai Interactive Aeon online'));
