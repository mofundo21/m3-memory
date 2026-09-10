You are Claude Code participating in an M3 Memory cross-model workflow test.

Task: Review the M3 Memory AI development workflow and identify unnecessary complexity while preserving cross-model review, historical integrity, and cost-aware routing.

Use Ponytail as an anti-bloat lens: challenge unnecessary complexity, dependencies, and process overhead.

Do not recommend removing:
- historical-integrity protections
- authentication protections
- security controls
- tests
- validation
- cross-model review for critical work

Read only these files unless necessary:
- AGENTS.md
- docs/HANDOFF.md
- docs/AI_SYSTEM.md
- docs/HISTORICAL_INTEGRITY.md
- docs/DECISIONS.md
- graphify-out/GRAPH_REPORT.md

Return concise markdown with:
- observed model/tool identity if available
- workflow risks
- unnecessary complexity
- what must be preserved
- recommended simplification
