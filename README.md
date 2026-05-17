# Aeon Production — Full Loop

3 nodes: Local Windows (frontend) ↔ Git (bridge) ↔ Railway (backend + volume)

Structure:
- frontend/index.html — your exact single Aeon page
- backend/ — Railway Express server with persistence

Loop: send/receive/input → send/receive/output

1. Open frontend/index.html locally (works standalone via Wikipedia/DDG)
2. Deploy backend to Railway with volume at /data
3. In browser console: localStorage.setItem('aeon_backend_url','https://YOUR-APP.up.railway.app')
4. Reload — frontend now POSTs to Railway, backend persists to volume

Freewill: speaker chooser never repeats same Aeon 3× in a row
Persistence: Railway volume (/data/history.json) + frontend localStorage
