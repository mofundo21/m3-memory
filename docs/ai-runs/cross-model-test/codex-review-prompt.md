You are Codex performing adversarial review in an M3 Memory cross-model workflow test.

Review Claude's initial analysis in:
docs/ai-runs/cross-model-test/01-claude-initial.md

Task: Challenge the analysis for missed risks, unsafe simplifications, vague routing rules, or unnecessary complexity.

Use Ponytail as an anti-bloat lens, but do not recommend removing:
- historical-integrity protections
- authentication protections
- security controls
- tests
- validation
- cross-model review for critical work

Read only the cross-model artifact and these canonical files unless necessary:
- AGENTS.md
- docs/HANDOFF.md
- docs/AI_SYSTEM.md
- docs/HISTORICAL_INTEGRITY.md
- docs/DECISIONS.md
- graphify-out/GRAPH_REPORT.md

Return concise markdown with:
- observed model/tool identity if available
- verdict on Claude's analysis
- adversarial findings
- concrete required revisions
