# AEON · 0root.ai

Same-origin Aeon frontend + `/mnt/data` Railway backend.

## Layout

```
server.js          Express server
package.json       deps (express)
public/index.html  Aeon frontend (Elantris glyphs)
```

## Backend = /mnt/data

Attach a Railway **Volume** mounted at `/mnt/data`. Server creates:

- `/mnt/data/aeon-log.jsonl`  — every Q&A appended
- `/mnt/data/kb/`             — drop `.md` / `.txt` / `.json` here; Aeon searches these to answer

## Routes

| Method | Path           | Purpose                                |
|--------|----------------|----------------------------------------|
| GET    | `/`            | serves frontend                        |
| POST   | `/ask`         | `{query}` → `{answer, speaker, source}` |
| GET    | `/history?n=50`| recent log entries                     |
| GET    | `/kb`          | list KB files                          |
| GET    | `/kb/:name`    | read one KB file                       |
| POST   | `/kb/:name`    | write KB file, body `{content}`        |
| GET    | `/health`      | `{ok, data_dir, volume_writable, kb_files}` |

## Deploy

1. `git init && git add . && git commit -m "aeon"`
2. Push to GitHub.
3. Railway → New Project → Deploy from repo.
4. Add Volume → mount path `/mnt/data`.
5. Custom domain → `0root.ai`.

Railway auto-detects Node (Nixpacks), runs `npm install`, then `npm start`.

## Env

| Var        | Default      |
|------------|--------------|
| `PORT`     | `3000` (Railway sets this) |
| `DATA_DIR` | `/mnt/data`  |

## Seed the KB

```bash
curl -X POST https://0root.ai/kb/notes.md \
  -H "Content-Type: application/json" \
  -d '{"content":"# Anchor\nT128 ROOT0 NOT-A-BIT terminus."}'
```

Or just drop files directly into the mounted volume.
