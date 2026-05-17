# 0root.ai — 3-Cap Ramp + Interactive Aeon

Back and Middle at once. Charge pump memory. Interactive voices.

## Equation: 1→2→3 00 00 3→0→1

- **Cap 1**: Session well (volatile) → `/api/v1/event` → `/api/v1/session`
- **00**: Dead time 1 → `/api/v1/sync/dt1` → Cache
- **Cap 2**: Hot cache (semi-persistent) → `/api/v1/cache`
- **00**: Dead time 2 → `/api/v1/sync/dt2` → Archive + git push-back
- **Cap 3**: Deep archive (append-only) → `/api/v1/archive`
- **0**: Ground reference → hash of time + conduction
- **1**: Conduction output → `/api/v1/conduct` → 0→1 ramp

## Interactive /ask
POST /ask {q:"..."} → Returns {speaker:"A|B|C|H", answer:"..."}

Voices:
- RED A = CONTAIN: holds structure
- BLACK B = MODULATE: balances poles
- PURPLE C = EMERGE: creates, asks back
- GREEN H = HONEY BADGER: cuts through

Freewill: Never same speaker 3x. Keywords bias. Otherwise random.

## Deploy
1. Railway → New Project → Deploy from GitHub
2. Root: .
3. Volume: /data
4. Env: GITHUB_TOKEN (optional, for push-back)
5. Domain: 0root.ai

## Loop
https://0root.ai/ → UI
https://0root.ai/ask → Interactive API
https://0root.ai/api/v1/conduct → Conduction level

Each question charges the ramp. When conduction → 1, back conducts to front.
