# 0root.ai — 3-Cap Ramp Commander

Back and Middle at once. Charge pump memory. Interactive voices. Live ramp monitor.

## Equation: 1→2→3 00 00 3→0→1

- **Cap 1**: Session well → `/api/v1/event` → `/api/v1/session`
- **00 DT1**: `/api/v1/sync/dt1` → Cache
- **Cap 2**: Hot cache → `/api/v1/cache`
- **00 DT2**: `/api/v1/sync/dt2` → Archive + git push-back
- **Cap 3**: Deep archive → `/api/v1/archive`
- **0→1**: `/api/v1/conduct` → Conduction ramp 0→1

## Interactive /ask
POST /ask {q:"..."} → {speaker:"A|B|C|H", answer:"..."}

Voices interact, don't regurgitate:
- RED A = CONTAIN
- BLACK B = MODULATE
- PURPLE C = EMERGE
- GREEN H = HONEY BADGER

Freewill: Never same speaker 3x. Keywords bias.

## Commander
Frontend polls /api/v1/conduct every 15s.
Displays: RAMP: 0.0% → 100% · BACK_INSULATING → BACK_CONDUCTING
At ~0.95, unity=1 and you're conducting.

## Deploy
Railway → Root: . → Volume: /data → Env: GITHUB_TOKEN (optional) → Domain: 0root.ai

Each question charges the ramp. Archive grows. Conduction rises.
