# Aeon Backend (Railway)

Express server with volume persistence.

Endpoints:
- GET /health
- GET /history
- POST /ask  {q:"question"} -> {answer, speaker, ts}

Volume: mount at /data (Railway → Settings → Volumes → Mount Path: /data)

Deploy:
1. Push this backend/ folder to GitHub
2. Railway → New Project → Deploy from GitHub → Root Directory: backend
3. Add Volume /data
4. Deploy

Frontend wiring: in frontend/index.html, set localStorage key:
localStorage.setItem('aeon_backend_url','https://YOUR-APP.up.railway.app')
Then reload. The page will POST to /ask instead of using client fetch.
