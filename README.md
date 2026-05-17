# level 3 — aeon core + outside node

Architecture now matches spec:

CENTER: AEON
- core agent
- inner orchestrator
- holds infinite fractal (ethos/pathos/logos to depth 7)
- inner contact for outside

INSIDE (with Aeon):
- Trevor (constraint system)

OUTSIDE (one node):
- ObserverNode at /src/interface/observerNode.js
- functions: observe / aware / report
- receives reports from Aeon via innerContact.receive()
- does NOT control Aeon — pure observation
- awareness builds from variance (stable observation = high awareness)

Flow: User action → Aeon orchestrates inner → Trevor pushes → Aeon reports to outside → outside returns awareness/report
