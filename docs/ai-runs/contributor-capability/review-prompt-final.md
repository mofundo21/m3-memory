You are the independent cross-model security reviewer (Tier 3) for the M3 Memory project. Do NOT edit files. Read-only. Do not write an implementation.

This is the FINAL pre-implementation review of the complete design v3 in docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md. Prior reviews: docs/ai-runs/contributor-capability/codex-review.md (v1), codex-review-v2.md (v2), codex-review-v3.md (v3, READY WITH REQUIRED CHANGES). The v3 required changes were written into the design text; verify that they are actually present.

Check the current code the design relies on: src/app/remember/actions.ts, src/lib/db.ts, src/lib/supabase.ts, src/lib/auth.ts, supabase/schema.sql, src/app/remember/final/content.tsx, src/app/remember/details/page.tsx.

Specifically verify, with file:line evidence:
1. Capability generation: randomness source, entropy (256 bits), token length and encoding.
2. Storage: only SHA-256 hash stored; no unsalted weakness concern for a 256-bit random token; confirm the raw token is never stored, logged, or returned after issuance.
3. Expiration: enforced server-side in the consume statement, not only by cookie maxAge.
4. Submission binding: SID comes only from the parsed cookie value; argument equality check; every DB predicate uses the parsed SID. Confirm an attacker holding a valid capability for submission A cannot consume or save submission B.
5. Allowed fields: exactly four columns; confirm no path allows status, review fields, verification or publication state, admin notes, reviewer info, archive metadata, or original_json.
6. Replay: consume-first DELETE ... RETURNING; confirm a second attempt cannot succeed, including concurrent attempts.
7. Privilege boundaries and server-only access: the new table has RLS enabled, no policies, and revoked grants. Confirm anon and authenticated cannot read it, and that existing select=* and submissions.* queries cannot reach it. Confirm the service-role key is only used in the two new helper functions.
8. RLS interaction: confirm no new policy or grant on submissions, and that the design does not weaken default-deny.
9. Revocation: state what revokes a capability (consumption, expiry, status change?) and whether a status change to reviewed leaves an unused capability live. Assess whether that is acceptable.
10. Error behavior: one generic public message for all failures; confirm no internal detail reaches the client.
11. Information leak: can the cookie's existence, or response timing or error differences, reveal whether a submission exists or its status? Assess honestly.
12. Immutable submitted-memory protection: confirm original_json and memory fields cannot change through this path.
13. Failure paths: capability inserted but submission insert fails (orphan), cookie set only after success, cleanup.

Output format:
- First line: VERDICT: PASS (no unresolved blocker) | PASS WITH REQUIRED CHANGES | NOT READY
- A table: each check item 1-13 with CLOSED / OPEN / PARTIAL and one line of evidence.
- Numbered findings with severity (blocker/high/medium/low), file:line, and the exact change required.
- A short list of what is verified correct.
Be concrete. No padding.
