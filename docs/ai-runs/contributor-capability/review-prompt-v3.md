You are the independent cross-model security reviewer (Tier 3) for the M3 Memory project. Do NOT edit files. Read-only. Do not write an implementation.

This is the THIRD review. v1 (docs/ai-runs/contributor-capability/codex-review.md) returned READY WITH REQUIRED CHANGES. v2 (docs/ai-runs/contributor-capability/codex-review-v2.md) returned NOT READY. The design is now v3 in docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md.

Step 1: read both earlier review files (v1 findings 1-8, v2 findings A-G).
Step 2: read docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md (v3) in full.
Step 3: check the current code and schema: src/app/remember/actions.ts, src/app/remember/final/content.tsx, src/lib/db.ts, src/lib/supabase.ts, src/lib/auth.ts, supabase/schema.sql.

Output:
- First line: VERDICT: READY FOR IMPLEMENTATION | READY WITH REQUIRED CHANGES | NOT READY
- A table of v1 findings 1-8 and v2 findings A-G, each marked CLOSED / PARTIALLY CLOSED / OPEN with one line of v3 evidence.
- Numbered new findings with severity (blocker/high/medium/low), file:line evidence, and the exact required change.
- Specifically assess: (a) whether the two-statement DELETE-then-PATCH is sound as fail-closed, including what happens if the PATCH fails after the DELETE; (b) whether SID binding is complete (cookie name, cookie value SID, argument, and every DB predicate); (c) whether a table with RLS enabled, no policies and revoked grants fully closes the exposure in v2 finding D, including the existing select=* queries and any PostgREST or RPC path that could bypass grants; (d) whether the cookie-after-createSubmission ordering is correct in the current create flow (check the media-upload branch); (e) any remaining threat the table omits.
- Then a short list of what you verified as correct.
Be concrete. No padding.
