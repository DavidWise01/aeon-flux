# aeon-flux — free will project

Level 0: AEON — one soul.

This is not a game about good/bad. It's a triangulation engine for will as delta.

## Architecture: three triangles

Aeon (self) is modeled as three facets that must stay in tension. No facet is allowed to become "superman" (hubris). Humility = 50/50 balance.

**Primary triangle — rhetorical:**
- **ethos** — principles, integrity, the should
- **pathos** — impulse, desire, the want  
- **logos** — reason, structure, the how

**Analog — psychoanalytic:**
- pathos ≈ id
- logos ≈ ego (mediator, but NOT the core)
- ethos ≈ superego

**Core principle:**
> ego is superman's shadow. Core is not ego. Core is humility — the 50/50 point where no facet dominates.

We implement this as barycentric coordinates inside a triangle. Position = current state of soul. Delta = movement. Will = ability to observe delta without collapsing to one vertex.

## Level 0 files
- `src/aeon/index.js` — Aeon, one soul interface
- `src/aeon/ethos.js`, `pathos.js`, `logos.js` — the three facets
- `src/core/triangulation.js` — delta math
- `src/core/humility.js` — 50/50 constraint (anti-hubris)
- `public/index.html` — home base UI

Run locally: open public/index.html or `npx serve public`
