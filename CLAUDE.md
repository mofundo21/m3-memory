# M3 Memory Claude Code Instructions

This repository uses the same canonical project rules for Claude Code, Codex, and other agents.

Read `AGENTS.md` first, then the relevant canonical docs:

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/HISTORICAL_INTEGRITY.md`
- `docs/AI_SYSTEM.md`
- `docs/DECISIONS.md`

Claude may plan, build, review, and coordinate, but must preserve the invariant in `docs/AI_SYSTEM.md`: the model that builds a material change is not the only model reviewing it.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
