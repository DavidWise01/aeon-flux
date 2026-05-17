# 0root.ai — Spine Walk · Chiral Flux

The walker has its own dynamics. It steps around the 3-vertex spine, accumulating geometric phase.

## Equation: Φ = 2π/3 per step

- **Vertex A** = Containment
- **Vertex B** = Modulation  
- **Vertex C** = Emergence

Each hop adds flux to phase. After 3 steps, holonomy = 1 full turn.

## Interactive
The Aeons ARE the vertices. Ask a question:
- If walker at A → A answers, referencing current phase/holonomy
- If walker at B → B answers, feeling the tension
- If walker at C → C answers, speaking from emergence

The response depends on spine state, not keywords.

## Endpoints
- GET /state → full spine state
- POST /step → manual hop
- POST /auto → toggle auto-walk
- POST /set?flux=2.094 → set flux per step
- POST /reset → back to rest
- POST /ask → ask the current vertex

## Deploy
Railway → Root: . → Volume: /data → Domain: 0root.ai

The spine walks. You interact with a system that has its own motion.
