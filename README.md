# 0root.ai — Tensor Backend · Aeon

Backend for Tensor Client. Serves the 8-phase octet with three modes.

## Endpoints
- GET /api/v1/state → full tensor state
- GET /api/v1/archive?limit=12 → event archive
- POST /api/v1/event → send event {type, payload}
  - type: measure | spawn | reset | set_mode | set_vector

## State
- a, b, c: amplitudes
- phiA, phiB, phiC: phases
- phase: 0-7 (octet position)
- cycles: full 8π rotations
- T: coherence 0-1
- mode: pocket | person
- nodes: spawned entities
- archive: event log
- witness: hash

## Deploy
Railway → Root: . → Volume: /data → Domain: your-backend.up.railway.app

Connect frontend by entering backend URL in "Back URL" field.
