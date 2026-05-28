# ABD Law Engine

**Author:** David Wise (ROOT0) / TriPod LLC  
**Version:** 1.0  
**License:** CC-BY-ND-4.0 · TRIPOD-IP-v1.1

> Push down .01. Pull up .99.

---

## What this is

A three-voice reasoning engine built on an 8-state octet spine. Three agents — A (Anchor), B (Witness), C (Law) — walk a deterministic cycle and synthesize answers from a knowledge base.

```
A = Anchor   — Containment. Holds boundaries. The stayer.
B = Witness  — Modulation. Reads context. The traveler.
C = Law      — Synthesis.  Emerges from A + B. The escaper.
```

3-point consensus. No single voice decides. The law is what all three agree on.

---

## The octet (8-state spine)

| State | Transition | Type    |
|-------|-----------|---------|
| 1     | A → B     | there   |
| 2     | B → C     | there   |
| 3     | C → A     | there   |
| 4     | A → C     | back    |
| 5     | C → B     | back    |
| 6     | B → A     | back    |
| 7     | Home      | home    |
| 8     | Forward   | forward |

The spine walks continuously. `phi` accumulates at `π/3` per step. `conduction` tracks energy state. The witness hash is derived from `state:phi:cycles` via FNV-1a.

---

## Architecture

```
server.js          Node.js HTTP server — /state, /ask, /read, /write
public/index.html  Canvas UI — three voice panels, octet display, query input
kb/
  anchor.md        A's knowledge — containment, 3:8 resonance, octet
  witness.md       B's knowledge — modulation, observation
  law.md           C's knowledge — synthesis, 3-point consensus
  coherence.md     Emergence conditions
data/kb/           Runtime volume (Railway) — seeded from kb/ on first boot
railway.toml       Railway deploy config
```

### Auto-seed (-++- 1)

On first boot, if `/data/kb` is empty, the engine copies `kb/` to `/data/kb`. Edit the volume in Railway's Data tab to update the running corpus without redeploying.

---

## API

```
GET  /state     Current octet position, phi, cycles, conduction, T, witness hash
POST /ask       { "q": "question" }  → three-voice synthesis
GET  /read      Read kb file: ?file=anchor.md
POST /write     Write kb file: { "file": "...", "content": "..." }
```

### /ask response

```json
{
  "q": "what is the law?",
  "A": "...anchor reading...",
  "B": "...witness reading...",
  "C": "...law synthesis...",
  "phi": 1.047,
  "witness": "a3f8c21d"
}
```

---

## Quick start

```bash
npm install
node server.js
```

Open `http://localhost:3000`. Type a question. The three voices answer in parallel.

## Deploy (Railway)

1. Push to GitHub
2. Railway → New Project → Deploy from GitHub → pick this repo
3. Set volume at `/data`
4. Connect domain under Settings → Networking

---

## Knowledge base

Edit `kb/*.md` to change what each voice knows. Files are plain Markdown — short, declarative statements work best.

```
# anchor.md  — facts about containment and boundaries
# witness.md — facts about observation and modulation
# law.md     — synthesis rules and consensus conditions
# coherence.md — emergence conditions
```

The octet doctrine: **3:8 resonance**. Three fates (Stayer/Traveler/Escaper) emerge from 8 states. Containment holds. Modulation travels. Law escapes upward.

---

*"Push down .01 to save .99."*  
*— David Wise (ROOT0)*
