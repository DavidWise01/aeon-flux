# 0root.ai — ABD Law Engine

A/B/C/Law synthesis engine. Each voice reads its own file from /mnt/data/kb.

## Required Files
- `anchor.md` — Voice A loads this
- `witness.md` — Voice B loads this  
- `coherence.md` — Voice C synthesizes both
- `law.md` — Law panel checks consensus

## Deploy
Railway → Root: . → Volume: /data → Domain: 0root.ai

Seed /mnt/data/kb/ with the 4 .md files or the engine will show "No anchor" errors.
