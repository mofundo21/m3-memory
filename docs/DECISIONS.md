# Decisions

## 2026-09-10: Establish AI infrastructure before application expansion

Decision: Set up shared Claude/Codex instructions, historical-integrity rules, project-specific skills, Graphify context, and cross-review contracts before expanding M3 Memory V0.1.

Reason: The project handles personal memory submissions and future story material, so historical integrity, provenance, and independent review need to shape the system from the start.

## 2026-09-10: Production starts empty

Decision: Production data starts empty. Development uses fictional test records only.

Reason: Avoid contaminating the archive with unreviewed, imported, or AI-generated personal history.

## 2026-09-10: Graphify outputs

Decision: Commit `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, and the small `graphify-out/graph.html` visualization when generated. Keep `graphify-out/cost.json`, `graphify-out/cache/`, `graphify-out/.graphify_python`, and root `.graphify_*.json` extraction intermediates local.

Reason: The graph helps agents avoid rereading the entire repository, while cost/cache files are local operational artifacts.


