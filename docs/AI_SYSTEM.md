# AI Development System

M3 Memory uses coordinated AI-assisted development across Claude Code and OpenAI Codex.

Primary invariant: whoever builds should not be the only reviewer.

If Codex builds, Claude reviews. If Claude builds, Codex reviews.

## Standard Lifecycle

For substantial work:

1. Request
2. Classify task
3. Ponytail / scope check
4. Graphify repository context
5. Primary model plan
6. Second model adversarial review
7. Plan revision
8. Build
9. Second model cross-inspection
10. Test
11. Fix if required
12. Final report

Not every tiny task needs the full expensive loop.

## Task Classes

### Class 0: Trivial

No cross-model loop necessary. Examples: typo fixes, tiny formatting edits, simple command output.

### Class 1: Normal

One model builds and runs standard tests. Examples: routine UI edits, small copy updates, straightforward bug fixes.

### Class 2: Important

One model plans/builds and the other reviews. Examples: submission data model changes, admin workflow changes, non-trivial form behavior, file handling changes.

### Class 3: Critical

Full Claudex Loop / adversarial convergence. Examples:

- authentication
- database migrations
- Row Level Security
- contributor privacy
- deletion behavior
- historical data mutation
- file upload security
- deployment permissions
- architecture changes

## Tool Roles

- Claudex Loop: bounded cross-provider plan review, build, inspection, and preserved logs.
- Ponytail: anti-bloat and anti-overengineering scope gate.
- Graphify: repository knowledge graph for efficient agent context.
- OmniRoute: future model routing and fallback layer, separate from the direct Claude/Codex loop until proven safe.

## Logs

Preserve plans and reviews under `docs/ai-runs/`.

Use identifiable model roles:

- `claude-planner`
- `claude-builder`
- `claude-reviewer`
- `codex-planner`
- `codex-builder`
- `codex-reviewer`

Do not mark a cross-model workflow successful unless both models actually ran and their outputs were captured.

## OmniRoute Policy

Subscription-authenticated services and API-billed services are distinct unless official tool documentation proves otherwise.

Never automatically downgrade security-, data-integrity-, privacy-, or architecture-sensitive tasks to a weaker model simply because it is cheaper.

OmniRoute may be tested independently after direct Claude/Codex operation works. It must not be inserted into the main orchestration path until routing, fallback, failure behavior, and logs are verified.

