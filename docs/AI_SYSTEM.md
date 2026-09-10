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

## Cost-Aware Task Tiers

Start with the lowest-cost model reasonably capable of the task. Escalate when confidence is low, tests fail repeatedly, architecture is ambiguous, security or data integrity is involved, historical evidence could be altered, or the cheaper model cannot solve the problem after a reasonable attempt.

Do not burn premium reasoning on mechanical work. Do not keep retrying a cheap model indefinitely when it is clearly failing.

Before substantial work, declare:

- Task tier
- Risk areas touched
- Required reviewer
- Graphify checked
- Ponytail checked

### Tier 0: Mechanical / Cheap

Use the cheapest competent model available. Do not invoke Claude + Codex cross-review.

Examples:

- formatting
- renaming
- simple documentation cleanup
- boilerplate
- repetitive edits
- straightforward file creation
- simple test-data generation
- lint fixes where the fix is obvious

### Tier 1: Normal

Use a cost-efficient coding model. Cross-model review is optional. Escalate only when uncertainty or risk appears.

Examples:

- ordinary components
- simple UI
- routine CRUD
- straightforward tests
- README changes
- common refactors

### Tier 2: Important

Use a stronger coding/reasoning model. Builder and reviewer should be different models when practical.

Examples:

- meaningful application features
- database queries
- submission workflow
- admin workflow
- significant refactors
- media handling

### Tier 3: Critical

Use the strongest appropriate models. Never route these tasks to a weak model solely to save usage.

Examples:

- authentication
- authorization
- Row Level Security
- database schema/migrations affecting historical records
- contributor privacy
- historical-source mutation
- deletion behavior
- upload security
- secrets
- production deployment permissions
- major architectural changes

Required lifecycle:

1. Primary model
2. Second model adversarial review
3. Revision
4. Implementation
5. Other model code review
6. Test

## Tool Roles

- Claudex Loop: bounded cross-provider plan review, build, inspection, and preserved logs.
- Ponytail: anti-bloat and anti-overengineering scope gate.
- Graphify: repository knowledge graph for efficient agent context.
- OmniRoute: future model routing and fallback layer. Keep it separate from the direct Claude/Codex loop until routing, fallback, failure behavior, logs, and provider authentication are proven.

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

OmniRoute may be tested independently after direct Claude/Codex operation works. It must not be inserted into the main orchestration path until routing, fallback, failure behavior, logs, and provider authentication are verified.

OmniRoute negative findings are operational guardrails, not dead documentation. Keep a concise record of failed installs, unsafe defaults, and deferred routing rules so future sessions do not repeat them.
