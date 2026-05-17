# Aeon Production v3 — Full Loop

## 3 Nodes
1. Local Windows (frontend/index.html) — INPUT
2. Git Desktop/CLI — BRIDGE  
3. Railway (backend/) — SEND/RECEIVE/OUTPUT + Volume Persistence

## Deploy
1. Push entire folder to GitHub
2. Railway → New Project → Deploy from GitHub → Root Directory: backend
3. Settings → Volumes → New Volume → Mount Path: /data
4. Deploy → copy your .up.railway.app URL

## Activate Full Loop
Open frontend/index.html locally, press F12 console:
```js
localStorage.setItem('aeon_backend_url','https://YOUR-APP.up.railway.app')
location.reload()
```
Status shows RAILWAY MODE. Dot turns WHITE while sending, then RED/BLACK/PURPLE/GREEN on response.

## Freewill + Persistence
- Speaker chooser: keyword match + never repeats same Aeon 3x in a row
- Railway volume /data/history.json: survives restarts
- Frontend localStorage: local mode fallback

## Test Endpoints
GET / → service info
GET /health → {ok:true}
POST /ask {q:"question"} → {answer,speaker,ts}
