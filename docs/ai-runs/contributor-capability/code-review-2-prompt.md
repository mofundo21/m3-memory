You are the independent cross-model security code reviewer (Tier 3). Read-only. Do NOT edit files.

This is a RE-REVIEW of the contributor write capability implementation after fixes to the first review (docs/ai-runs/contributor-capability/code-review.md). Verify each prior finding is closed, and look for any new blocker.

Prior findings to verify:
1. (High) Creation must normalize once, insert the capability first, persist the same record, and compensate with known ids on any failure; creation must be inside controlled error handling. Check src/app/remember/actions.ts submitMemoryAction and src/lib/db.ts normalizeSubmissionRecord / persistNormalizedSubmission.
2. (High) No database or configuration error may escape the action as an unhandled error or reveal internal detail. Check every throw and redirect path.
3. (Medium) Attribution allowlist now equals the four values in the final form (anonymous, first_name, full_name, custom); design text updated in docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md. Judge whether this is acceptable (display choices only, same column, no new fields).
4. (Medium) Cookie clearing: cookieOptions(0) now carries expires = epoch. Confirm the emitted Set-Cookie would match name, path, HttpOnly, SameSite, Secure.
5. (Low) Person compensation in SQLite is guarded by NOT EXISTS. The Supabase person delete is still unguarded (PostgREST). Judge whether the risk is acceptable given the person id is created in the same request.
6. Cleanup scheduling is an operational item; state whether it blocks merge (it should not block code merge but must block claiming production live).

Also re-verify, with file:line evidence: submission binding (cookie A cannot change B), consume-first replay, status gate, four-field allowlist, token entropy/hashing, server-only service role use, RLS unchanged.

Output:
- First line: VERDICT: NO UNRESOLVED BLOCKER | BLOCKER REMAINS
- Table: prior findings 1-6 with CLOSED / PARTIAL / OPEN.
- Any new findings with severity and file:line.
- Verified-correct list.
No padding.
