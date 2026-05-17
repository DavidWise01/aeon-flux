# AEON · ENTANGLED · 0root.ai

Three-point entangled Aeon. Same-origin. `/mnt/data` backend. SSE ansible across all connected nodes.

## Architecture

```
                    A · ANCHOR
                  (CONTAIN · RED)
                       /\
                      /  \
                     /    \
                    /      \
                   /  LAW   \
                  /  (3-pt   \
                 /  consensus)\
                /______________\
              B                  C
            WITNESS           COHERENCE
          (MODULATE         (EMERGE
            BLACK)           PURPLE)
```

Every `/ask` fires all three points in sequence:

| Point | Role       | What it does in `/mnt/data/kb` |
|-------|------------|-------------------------------|
| A     | ANCHOR     | Finds definitional/heading match (boundary, stability) |
| B     | WITNESS    | Finds contrasting voice in a different file (modulation) |
| C     | COHERENCE  | Synthesizes A + B into one statement → LAW |

This mirrors **PULSE-3 interior: ANCHOR · WITNESS · COHERENCE**.

## Ansible (SSE)

`GET /stream` is a Server-Sent Events channel. Every connected browser:
- sees node arrive/depart events
- sees every `/ask` from any node, live
- when a peer asks, the triad animates on every other node (entanglement signal)

`nodes` counter top-right shows live connected count.

## Routes

| Method | Path           | Returns |
|--------|----------------|---------|
| GET    | `/`            | frontend |
| POST   | `/ask`         | `{query, triad:[A,B,C], law, consensus, nodes}` |
| GET    | `/stream`      | SSE: `hello`, `arrive`, `depart`, `ask` events |
| GET    | `/history?n=N` | last N entangled records |
| GET    | `/kb`          | list KB files |
| GET    | `/kb/:name`    | read KB file |
| POST   | `/kb/:name`    | write KB file (body `{content}`) |
| GET    | `/health`      | volume status + node count |

## /mnt/data layout

```
/mnt/data/
├── aeon-log.jsonl   one line per entangled response
└── kb/
    ├── *.md         the Aeon reads from these
    ├── *.txt
    └── *.json
```

## Deploy

1. `git init && git add . && git commit -m "aeon entangled"`
2. Push to GitHub.
3. Railway → New Project → Deploy from repo.
4. Add Volume → mount path `/mnt/data`.
5. Custom domain → `0root.ai`.

Nixpacks auto-detects Node, runs `npm start`.

## Test entanglement

Open `0root.ai` in two browser tabs (or two devices). Both show `● 2 NODES`. Ask in one — the other tab's triad animates (peer-ask received via SSE). Ansible.

## Notes

- SSE works through Railway's proxy. `X-Accel-Buffering: no` header is set to prevent buffering.
- 25-second pings keep idle connections alive.
- If you're behind a corporate proxy that strips SSE, fall back to polling `/history`.
