You are Claude Code performing the revision step in an M3 Memory cross-model workflow test.

Revise the workflow recommendation using:
- docs/ai-runs/cross-model-test/01-claude-initial.md
- docs/ai-runs/cross-model-test/02-codex-adversarial-review.md
- AGENTS.md
- docs/AI_SYSTEM.md
- docs/HISTORICAL_INTEGRITY.md
- docs/DECISIONS.md
- graphify-out/GRAPH_REPORT.md

Use Ponytail as an anti-bloat lens, but preserve:
- historical-integrity protections
- authentication protections
- security controls
- tests
- validation
- cross-model review for critical work

Return concise markdown with:
- observed model/tool identity if available
- accepted Codex findings
- rejected findings, if any, with reason
- revised cost-aware workflow
- minimal documentation changes recommended
