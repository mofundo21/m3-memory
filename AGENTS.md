# M3 Memory Agent Instructions

M3 Memory is the memory archive and future storytelling system for YERIEL, AKA MOFUNDO.

Canonical project truth lives in:

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/HISTORICAL_INTEGRITY.md`
- `docs/AI_SYSTEM.md`
- `docs/DECISIONS.md`

Do not duplicate those documents here. Read the relevant canonical files before making substantial changes.

## Required Operating Rules

- Preserve contributor submissions as immutable historical source records.
- Store corrections, Yeriel notes, AI observations, and story drafts separately from source submissions.
- The model that builds a material change must not be the only model reviewing it.
- Run a Ponytail scope check before implementation work that could add architecture, dependencies, or broad abstractions.
- Consult `graphify-out/GRAPH_REPORT.md` or `graphify-out/graph.json` when present before rereading the whole repository.
- Never import real personal history, old M3 Hub data, book chapters, timelines, lore, or private memories into development data.
- Use clearly fictional test records only.
- Never expose service-role credentials, tokens, passwords, OAuth secrets, or private authentication files.

## Task Classes

Follow `docs/AI_SYSTEM.md`:

- Class 0: trivial, no cross-model loop required.
- Class 1: normal, one model builds and runs standard tests.
- Class 2: important, one model plans/builds and the other reviews.
- Class 3: critical, full Claudex Loop or equivalent adversarial convergence.

Critical work includes authentication, database migrations, Row Level Security, contributor privacy, deletion behavior, historical data mutation, upload security, deployment permissions, and architecture changes.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
