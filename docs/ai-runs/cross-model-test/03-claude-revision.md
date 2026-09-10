I don't have write permission yet, but here's the revised workflow recommendation as concise markdown:

---

## **Revised Workflow: Claude Code Revision of Haiku + Codex Analysis**

**Date**: 2026-09-10  
**Observed Models**: Haiku 4.5 (initial), Codex (adversarial review), Claude Code (revision)

### **Accepted Codex Findings** ✅

1. **OmniRoute is operational guardrail, not dead code** — failed install + prohibition is negative knowledge; mark deferred, don't delete.
2. **GRAPH_REPORT.md reading is mandated by AGENTS.md** — cannot remove without violating project rules; corpus is small (4,974 words = 30-sec read).
3. **Skill location duplication may be cross-host** — Haiku's bloat diagnosis premature; cannot delete without host-by-host test.
4. **Hooks need "untrusted" mark, not removal** — mark advisory/untested; do not rely for policy enforcement.
5. **check-ai-environment.ps1 has value** — auth state and tooling status are operationally relevant.

### **Rejected Haiku Findings** ❌

**"2-line classifier rule" is underbaked** — AI_SYSTEM.md already defines Class 3 categories. Actual gap: no *pre-work declaration* (task class + risk areas + required reviewer) enforced before substantial work begins.

### **Revised Cost-Aware Actions**

| Action | Cost | Notes |
|--------|------|-------|
| Consolidate OmniRoute in AI_SYSTEM.md | ~30 lines | Keep deferred-status guardrail; cut redundant policy |
| Mark hooks as advisory in CLAUDE.md | ~2 lines | Add comment; test next session or disable |
| Add pre-work task declaration checklist | ~8 lines | Enforce: task class (0–3) + risk areas + reviewer |
| Clarify Graphify scope (optional) | ~2 lines | Small corpus = quick read; graph queries for cross-module |
| **No deletions** | — | Keep skill duplication + check-ai-environment.ps1 + GRAPH_REPORT.md rule |

### **What Remains Inviolate**

✅ Historical integrity (source immutability, layer separation)  
✅ Cross-model review for Class 3 (auth, migration, privacy, history)  
✅ Task classification (0–3 with pre-work declaration)  
✅ Tests and security controls  
✅ M3-specific skills

### **Summary**

Haiku's anti-bloat pass was useful but overreached—deletions would lose guardrails and violate AGENTS.md. Codex correctly identified that real bloat is unproven automation (hooks) + missing pre-work discipline, not documentation of failed infrastructure.

**Revised approach**: Keep guardrails, mark hooks advisory, add pre-work checklist, consolidate OmniRoute as "deferred pending proof."

**Cost**: ~60 lines doc changes, ~3 sessions (auth fix + hook test + skill verification), zero structural weakening.

---

Would you like me to apply these changes to the documents, or save this revision to the file?
