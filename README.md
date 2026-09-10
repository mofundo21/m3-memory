# M3 Memory

Private memory archive and future storytelling system for Yeriel / MOFUNDO.

V0.1 intentionally starts empty. Do not import real memories, book chapters, prior stories, or personal lore into this repository.

## Workflow

Submission -> Review -> Yeriel notes -> Approval -> Story draft -> Book

The original submission is immutable. Yeriel's review and any AI-generated draft are stored separately.

## Local Setup

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` before using the admin area.

## AI Development System

M3 Memory uses a shared Claude Code + Codex development system before expanding the application.

Canonical rules live in `AGENTS.md`, `CLAUDE.md`, and `docs/`:

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/HISTORICAL_INTEGRITY.md`
- `docs/AI_SYSTEM.md`
- `docs/DECISIONS.md`

Core invariant: whoever builds a material change is not the only reviewer.

Use `scripts/check-ai-environment.ps1`, `scripts/verify-agent-config.ps1`, and `scripts/update-graph.ps1` to verify the AI environment.
