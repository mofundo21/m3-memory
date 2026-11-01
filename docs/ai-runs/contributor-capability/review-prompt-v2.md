You are the independent cross-model security reviewer (Tier 3) for the M3 Memory project. Do NOT edit files. Read-only. Do not write an implementation.

This is the SECOND review. The v1 design was reviewed and returned READY WITH REQUIRED CHANGES (findings in docs/ai-runs/contributor-capability/codex-review.md, findings 1-8). The design was revised to v2 in docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md.

Step 1: read docs/ai-runs/contributor-capability/codex-review.md (v1 findings).
Step 2: read docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md (v2).
Step 3: check the current code the design relies on: src/app/remember/actions.ts, src/lib/db.ts, src/lib/supabase.ts, src/lib/auth.ts, supabase/schema.sql.

For each v1 finding (1-8), state CLOSED, PARTIALLY CLOSED, or OPEN with evidence from the v2 text.

Then answer:
A. Is the single guarded UPDATE (design §3.2 step 4) the only database write this path performs? Can the RETURNING/representation check be fooled (for example by an UPDATE that matches a different row or by partial success)?
B. Does consumption (clearing the hash in the same statement) plus expiry close the replay window fully? Any remaining replay path, including a concurrent double submit?
C. Race analysis: admin review (status change) vs contributor save. Any interleaving that lets a save land on a reviewed row?
D. The schema addition (two nullable columns, no grants, no policies): is it acceptable under Tier 3, and does any existing select (`select=*` or SELECT *) expose the hash column to anon or authenticated? Check the existing queries and the admin paths.
E. The cookie: is storing a raw 256-bit random token in an httpOnly cookie with only its SHA-256 on the server adequate? Any weakness in hashing without a key for a high-entropy token?
F. Is there any remaining way for the submissionId argument to influence the write? Any way the server action can be invoked with a cookie from one submission and an argument for another?
G. Any new threat the v2 design introduces that the threat table omits?

Output format:
- First line: VERDICT: READY FOR IMPLEMENTATION | READY WITH REQUIRED CHANGES | NOT READY
- Then a table of v1 findings 1-8: CLOSED / PARTIALLY CLOSED / OPEN, with one line of evidence each.
- Then numbered findings for A-G, each with severity (blocker/high/medium/low), file:line evidence, and the exact required change.
- Then a short list of what you verified as correct.
Be concrete. No padding.
