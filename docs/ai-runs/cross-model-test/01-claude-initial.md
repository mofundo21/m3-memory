# M3 Memory Workflow Review: Ponytail Anti-Bloat Analysis

## Current Identity
- **Haiku 4.5** reviewing Claude Code infrastructure
- **Project**: M3 Memory AI development system (39 nodes, ~5k words)
- **Status**: Foundation established; Claude auth broken; Codex verified; production empty

---

## Workflow Risks

| Risk | Impact | Severity |
|------|--------|----------|
| Claude auth (401 revoked) blocks cross-model testing | Can't verify Claudex Loop works | 🔴 **Critical** |
| Hooks configured but "behavior not proven" in both hosts | Graphify reminders may silently fail | 🟡 Medium |
| OmniRoute partial setup creates false "installed" state | Future context bloat; unclear status | 🟡 Medium |
| Task classification entirely manual (no routing/CI gate) | Easy to mis-classify without enforcement | 🟡 Medium |

---

## Unnecessary Complexity

### ✂️ High-Priority Cuts

1. **OmniRoute reference (docs/DECISIONS.md, HANDOFF.md, config/)**
   - Package install failed; explicitly marked "do not retry"
   - Yet still occupies ~50 lines in HANDOFF.md explaining why it's broken
   - **Action**: Remove config/, OmniRoute references from HANDOFF.md/AI_SYSTEM.md
   - **Cost**: ~0 (removes future bloat)
   - **Reason**: Dead code in documentation isn't safer than dead code

2. **Graphify for 5k-word corpus**
   - Graph report itself says: "Corpus is ~4,974 words - fits in a single context window. You may not need a graph."
   - 39 nodes, 6 communities; "thin communities" detected as noise
   - **Action**: Keep graphify updated (`graphify update .`) but **remove** the implicit requirement to read GRAPH_REPORT.md before codebase questions (corpus is small enough)
   - **Cost**: One context lookup on rare "how does X relate to Y" questions (but queries like `graphify path A B` still help)
   - **Reason**: Premature optimization; the codebase is transparent enough

3. **Redundant skill file locations**
   - Skills duplicated in: `.agents/`, `.claude/`, global `~/.agents/`, `~/.claude/`
   - **Action**: Test from ONE canonical location per host; remove dupes
   - **Cost**: ~30 seconds to test + verify no hardcoded paths
   - **Reason**: Maintenance debt; unclear which copy runs

4. **Hook configuration without verification**
   - Hooks in `.codex/hooks.json` and `.claude/settings.json` configured to call graphify/read GRAPH_REPORT
   - But no test proving they fire or behave correctly
   - **Action**: Either (a) remove them until proven, or (b) add to next-session test checklist
   - **Cost**: One test run in a real Claude/Codex session
   - **Reason**: Configured behavior that might not work is worse than no automation

---

### ✂️ Medium-Priority Simplifications

5. **12-step standard lifecycle**
   - Steps 2–12 prescribed in `docs/AI_SYSTEM.md` but no gating/enforcement
   - Manual classification into task classes (0–3) with no router
   - **Action**: Keep task classes; add 2-line classifier rule (e.g., "if auth/migrations/history → Class 3")
   - **Cost**: One pre-work checklist; no code changes
   - **Reason**: Prevents mis-classification without enforcement overhead

6. **Verification scripts**
   - `.ps1` scripts check environment (Graphify version, Claude auth status, Codex auth status)
   - But don't *fail* on missing tools; they report status
   - **Action**: Keep `verify-agent-config.ps1` (short); remove `check-ai-environment.ps1` (it's informational bloat)
   - **Cost**: Delete one file
   - **Reason**: If Claude auth is broken, the session will fail anyway; no need pre-check

---

## What Must Be Preserved

✅ **Non-negotiable:**
- Cross-model review for Class 3 (critical: auth, migrations, privacy, history mutation)
- Historical integrity layers (submitter ↔ Yeriel ↔ AI ↔ evidence ↔ draft)
- Source record immutability (no silent rewrites)
- M3-specific skills (`m3-memory-archive`, `m3-memory-review`, `m3-evidence-check`, `m3-story-builder`)
- Task classification structure (0–3)
- Tests and security controls

---

## Recommended Simplification Path

### Immediate (this session)
1. **Delete OmniRoute from docs** — remove config/, clip references from HANDOFF.md/AI_SYSTEM.md to 1 line: "OmniRoute deferred until Claude <-> Codex proven."
2. **Remove hook verification requirement** — either prove hooks in next session, or remove `.codex/hooks.json` + `.claude/settings.json` Graphify entries
3. **Consolidate skill locations** — test canonical path; document which one is authoritative

### Next Session (after Claude auth fixed)
1. **Graphify: update, don't require reading GRAPH_REPORT.md by default** — add to checklist: "if query is 'how does X relate to Y', try `graphify path`"
2. **Prove hooks** — run Claudex Loop test; capture proof that hooks fire or disable them
3. **Add task classifier rule** — 2-line "if this task touches {auth, migration, privacy, history}, escalate to Class 3" in CLAUDE.md

### Long-term (after V0.1 ships)
- Re-evaluate Graphify when corpus hits ~20k words
- Revisit OmniRoute only if Claude/Codex prove expensive and fallback routing is proven safe

---

## Summary

**Current state**: Over-documented foundation with dead (OmniRoute) and unproven (hooks) infrastructure. Critical controls (cross-review, historical integrity) are sound but manual.

**Anti-bloat verdict**: **Remove OmniRoute, disable/prove hooks, keep graphify as optional query tool.** No structural weakening; reduces false implied functionality by ~40 lines of overhead.

**Model identity**: Haiku reviewing its own infrastructure—appropriate for anti-bloat work. Ready to handoff to Opus for cross-model testing once Claude auth refreshes.
