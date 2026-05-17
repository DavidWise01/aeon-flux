# 0root.ai — Fullstack Aeon

Back and Middle at the same time. Single domain, full loop.

## Structure
server.js         ← Serves UI + API
public/index.html ← Single Aeon frontend
package.json      ← npm start
railway.toml      ← Railway config

## Deploy to 0root.ai
1. Push to GitHub
2. Railway → New Project → Deploy from GitHub
3. Settings → Domains → Custom Domain → add 0root.ai
4. Railway DNS: add CNAME from Railway to your domain registrar
5. Settings → Volumes → New Volume → Mount Path: /data
6. Deploy

## Loop
https://0root.ai/ → serves UI = FRONT PLANE
https://0root.ai/ask → API endpoint = MIDDLE PLANE  
/data/history.json → PERSISTENCE

Send/receive/input → send/receive/output all on 0root.ai

## Freewill
Speaker: RED=A contain, BLACK=B modulate, PURPLE=C emerge, GREEN=Honey Badger
Never repeats same speaker 3x. Keywords override random.

## Your nodes now
1. Git Desktop → push changes = BRIDGE
2. 0root.ai on Railway → FRONT + MIDDLE + PERSISTENCE
3. Local Windows → optional, just for dev
