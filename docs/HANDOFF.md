# M3 Memory Handoff

Date: 2026-09-10
Owner: YERIEL AKA MOFUNDO
Repository: `C:\Users\yerie\m3-memory`

## Current Project State

M3 Memory has a dedicated `m3-memory` Git repository separate from old M3 Hub work. The repository contains the AI development foundation, canonical project documentation, project-specific skills, local agent instructions, reproducibility scripts, and a small Next.js scaffold that existed before this checkpoint work. This session did not begin new application implementation after the user's stop instruction; work was limited to finishing Graphify verification/completion and checkpointing.

Fresh sessions should start by reading:

- `AGENTS.md`
- `docs/HANDOFF.md`
- `docs/AI_SYSTEM.md`
- `docs/PRODUCT.md`
- `docs/HISTORICAL_INTEGRITY.md`

## Tools Successfully Installed Or Present

- Codex CLI: `codex-cli 0.152.1`; `codex login status` previously reported logged in using ChatGPT.
- Claude Code CLI: `2.1.157 (Claude Code)` is installed, but usable prompt auth is blocked; see Claude Code Status.
- Graphify: Python package `graphifyy 0.6.0` installed; `graphify` executable present. The CLI does not support `graphify --version`, so version was read from Python package metadata.
- Claudex Loop skills: installed/copied into global and project skill directories.
- Ponytail skills: installed/copied into global and project skill directories. Maintained source package version verified from cloned source as `@dietrichgebert/ponytail 4.9.0`.
- Next.js project dependencies are present in `package.json` / `package-lock.json`; current package set observed earlier included Next `16.3.4`, React `19.2.8`, and TypeScript `5.9.3`.

## Tools Configured But Not Yet Proven

- Claudex Loop is installed as skill files and was discoverable by Codex in a harmless skill-discovery run, but full Claude <-> Codex workflow is not proven because Claude prompt auth failed.
- Ponytail is installed as skill files and documented for scope/anti-bloat review, but no full pre-implementation enforcement workflow has been run on a real feature yet.
- Graphify hooks were created in `.codex/hooks.json` and `.claude/settings.json`. They remind agents to read `graphify-out/GRAPH_REPORT.md` before broad repository searches. The hooks are configuration files; behavior inside each host should be treated as configured but not fully proven.

## Failed Installations

- OmniRoute was investigated from `https://github.com/ourines/omniroute`. Local cloned source showed package version `3.8.35`, current npm install attempted `omniroute@3.8.50`, and docs require Node engine compatible with the installed Node 24 line. The global npm install hung, was interrupted, and the broken global npm entry was removed with `npm uninstall -g omniroute`. `omniroute` is not on PATH.
- GitHub CLI `gh` is missing.
- `pnpm` is missing.
- `pipx` is missing.

## Graphify Status

Graphify completed successfully for the current repository state.

Generated outputs:

- `graphify-out/graph.json`
- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/graph.html`

Observed graph metrics:

- 39 nodes
- 37 edges
- 6 reported communities in the generated report
- Report warns the corpus is small enough to fit in a single context window, so Graphify is useful but not yet essential.

Graphify-specific error fixed:

- The initial completion script called `suggest_questions` with the wrong signature. The graph was completed from existing local Graphify AST/detection intermediates using the correct signature: `suggest_questions(G, communities, community_labels)`.

Graphify commit policy:

- Commit `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, and `graphify-out/graph.html`.
- Do not commit `graphify-out/cache/`, `graphify-out/cost.json`, `graphify-out/.graphify_python`, or root `.graphify_*.json` intermediates.

## Claudex Loop Status

Verified skill files exist:

- `.agents/skills/claudex-loop/SKILL.md`
- `.agents/skills/codex-review/SKILL.md`
- `C:\Users\yerie\.agents\skills\claudex-loop\SKILL.md`
- `C:\Users\yerie\.claude\skills\claudex-loop\SKILL.md`

Codex skill discovery previously found the Claudex Loop skill family. Full cross-model operation remains blocked by Claude prompt authentication.

## Ponytail Status

Verified skill files exist:

- `.agents/skills/ponytail/SKILL.md`
- `.agents/skills/ponytail-review/SKILL.md`
- `C:\Users\yerie\.agents\skills\ponytail\SKILL.md`
- `C:\Users\yerie\.claude\skills\ponytail\SKILL.md`

Ponytail purpose in this project: anti-bloat, scope challenge, and unnecessary-complexity review before implementation. It must not remove security, accessibility, validation, historical integrity, backups, tests, or error handling.

## OmniRoute Status

OmniRoute is not installed and must not be retried automatically in this checkpoint session. Treat subscription-authenticated Claude/Codex and API-billed providers as separate until OmniRoute docs prove otherwise. Do not route critical M3 work through OmniRoute until direct Claude <-> Codex cross-review is proven first.

## Claude Code Status

Claude Code CLI is installed: `2.1.157 (Claude Code)`. A previous `claude auth status` style check appeared present, but actual prompt execution failed with `401 OAuth access token has been revoked`. Do not spend more context debugging this in a fresh work session unless Yeriel explicitly wants auth repair. Required user-side next step is to refresh Claude authentication from Claude Code.

## Codex Status

Codex CLI is installed: `codex-cli 0.152.1`. Authentication previously reported as present using ChatGPT. Codex was able to run a harmless skill-discovery task and write `docs/ai-runs/codex-skill-discovery.txt`.

## M3-Specific Skills Created

Canonical project skills exist in `skills/`, `.agents/skills/`, and `.claude/skills/`:

- `m3-memory-archive`
- `m3-memory-review`
- `m3-evidence-check`
- `m3-story-builder`

These enforce source-memory immutability, contributor/Yeriel/AI/evidence separation, evidence checking without fabricated resolutions, and story drafting only from reviewed material.

## Important Files Created

- `AGENTS.md`
- `CLAUDE.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/AI_SYSTEM.md`
- `docs/HISTORICAL_INTEGRITY.md`
- `docs/DECISIONS.md`
- `docs/HANDOFF.md`
- `docs/CLAUDE_CODEX_HANDOFF.md`
- `docs/EXTERNAL_TOOLS.md`
- `docs/ai-runs/.gitkeep`
- `scripts/check-ai-environment.ps1`
- `scripts/update-graph.ps1`
- `scripts/verify-agent-config.ps1`
- `scripts/bootstrap-dev-environment.ps1`
- `config/omniroute.m3-routing.example.json`
- `.graphifyignore`
- `.codex/hooks.json`
- `.claude/settings.json`

## Architectural Decisions Made

- AI development infrastructure comes before application expansion.
- Production starts empty; no old memories, lore, timelines, ChatGPT memories, personal databases, or book chapters are imported.
- Contributor submissions are immutable historical source records.
- Corrections, Yeriel review, AI observations, confirmed evidence, and narrative drafts remain separate layers.
- Substantial work follows task classification, Ponytail scope check, Graphify context, primary model plan, second-model review, build, second-model inspection, tests, and final report where appropriate.
- Whoever builds should not be the only reviewer.
- OmniRoute remains a future routing layer, not part of critical cross-review until direct Claude <-> Codex works.

## Known Errors

- Windows sandbox process spawning failed repeatedly with `SetTokenInformation(TokenDefaultDacl) failed: 1344`; scoped PowerShell commands were run with approval outside the sandbox.
- `apply_patch` failed for the same sandbox reason, so scoped PowerShell file writes were used.
- Claude prompt execution failed with `401 OAuth access token has been revoked`.
- OmniRoute global install hung and was removed; command is unavailable.
- Graphify CLI has no `--version` command.
- `.codex/hooks.json` and `.claude/settings.json` contain Graphify hook commands, but hook runtime behavior has not been proven in both hosts.

## Remaining Blockers

- Refresh Claude Code authentication before running full Claude <-> Codex cross-review.
- Decide later whether to install `gh`, `pnpm`, or `pipx`; they are not required for this checkpoint.
- Revisit OmniRoute only after direct Claude <-> Codex workflow is proven.

## Exact Next Commands Recommended

Run from `C:\Users\yerie\m3-memory`:

```powershell
Get-Content AGENTS.md
Get-Content docs\HANDOFF.md
Get-Content docs\AI_SYSTEM.md
Get-Content docs\PRODUCT.md
Get-Content docs\HISTORICAL_INTEGRITY.md
powershell -ExecutionPolicy Bypass -File scripts\verify-agent-config.ps1
powershell -ExecutionPolicy Bypass -File scripts\check-ai-environment.ps1
Get-Content graphify-out\GRAPH_REPORT.md
```

After Yeriel refreshes Claude auth:

```powershell
claude -p "Reply with: Claude Code auth works."
codex exec -s read-only "Reply with: Codex auth works."
```

Then run the harmless cross-model README workflow described in `docs/AI_SYSTEM.md` and preserve logs under `docs/ai-runs/`.

## What NOT To Redo

- Do not reinstall Claudex Loop skills unless files are missing.
- Do not reinstall Ponytail skills unless files are missing.
- Do not retry OmniRoute in the next immediate session.
- Do not debug Claude authentication unless Yeriel explicitly asks for auth repair.
- Do not import historical/personal data into production or development.
- Do not commit `node_modules/`, `.next/`, `.m3-memory/`, `tools/vendor/`, Graphify cache files, Graphify cost files, Graphify runtime marker files, or root Graphify extraction intermediates.

## Next Three Priorities

1. Confirm this checkpoint commit exists and the working tree has only expected ignored local artifacts.
2. Refresh Claude Code authentication, then run the direct Claude <-> Codex harmless cross-review test.
3. Only after cross-review works, begin M3 Memory V0.1 planning from `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, and `docs/HISTORICAL_INTEGRITY.md`.
