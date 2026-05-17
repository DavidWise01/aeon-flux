#!/usr/bin/env node
// 0root.ai · ABD Law Engine
const express = require('express');
const multer  = require('multer');
const fs      = require('fs');
const fsp     = require('fs').promises;
const path    = require('path');

const PORT    = process.env.PORT || 3000;
const ROOT    = process.cwd();
const KB_DIR  = process.env.KB_DIR || '/mnt/data/kb';

// Ensure the KB directory exists on startup
try { fs.mkdirSync(KB_DIR, { recursive: true }); } catch {}

// ── Multer: store uploads directly in KB_DIR with original filename ──────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, KB_DIR),
  filename:    (_req, file,  cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// ── ABD walk state ────────────────────────────────────────────────────────────
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
  try { return fs.readFileSync(path.join(KB_DIR, file), 'utf-8'); } catch { return null; }
}

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.options('*', (_req, res) => res.sendStatus(204));

app.use(express.json());
app.use(express.static(path.join(ROOT, 'public')));

// ── GET /state ────────────────────────────────────────────────────────────────
app.get('/state', (_req, res) => {
  res.json({
    s:          WALK.s,
    phi:        WALK.phi,
    cycles:     WALK.cycles,
    conduction: WALK.conduction,
    T:          0.5 + 0.5 * WALK.conduction,
    witness:    WALK.hash(`${WALK.s}:${WALK.phi.toFixed(4)}:${WALK.cycles}`)
  });
});

// ── POST /ask ─────────────────────────────────────────────────────────────────
app.post('/ask', (req, res) => {
  const q = (req.body.q || '').trim();
  if (!q) return res.status(400).json({ error: 'q required' });

  const anchor    = readKB('anchor.md');
  const witness   = readKB('witness.md');
  const coherence = readKB('coherence.md');
  const law       = readKB('law.md');

  const A   = anchor  ? `ANCHOR loaded:\n${anchor.slice(0,200)}`   : 'No anchor in /mnt/data/kb. Seed the volume.';
  const B   = witness ? `WITNESS loaded:\n${witness.slice(0,200)}` : 'No second voice in the corpus. Modulation requires plurality.';
  const C   = (anchor && witness) ? `COHERENCE synthesis:\n${coherence ? coherence.slice(0,200) : 'Anchor + Witness → Emergence'}` : 'No anchor in /mnt/data/kb. However, no second voice in the corpus.';
  const LAW = (anchor && witness) ? `LAW consensus:\n${law ? law.slice(0,200) : '3-point synthesis ready'}` : 'No anchor in /mnt/data/kb. However, no second voice in the corpus.';

  res.json({ A, B, C, LAW, ts: Date.now() });
});

// ── POST /upload ──────────────────────────────────────────────────────────────
app.post('/upload', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files received' });
  }
  const saved = req.files.map(f => ({ name: f.originalname, size: f.size, path: f.path }));
  res.json({ ok: true, saved });
});

// ── GET /files ────────────────────────────────────────────────────────────────
app.get('/files', async (_req, res) => {
  try {
    const entries = await fsp.readdir(KB_DIR, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter(e => e.isFile())
        .map(async e => {
          const stat = await fsp.stat(path.join(KB_DIR, e.name));
          return { name: e.name, size: stat.size, modified: stat.mtime };
        })
    );
    res.json({ kb_dir: KB_DIR, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /health ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, engine: 'ABD-LAW' }));

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'not found', path: req.path }));

// ── Walk ticker ───────────────────────────────────────────────────────────────
setInterval(() => { if (WALK.auto) WALK.step(); }, 700);

app.listen(PORT, () => {
  console.log(`[ABD] Law Engine online at port ${PORT}`);
  console.log(`[ABD] KB directory: ${KB_DIR}`);
});
