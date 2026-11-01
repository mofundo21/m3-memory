You are the independent cross-model security code reviewer (Tier 3) for the M3 Memory project. Read-only. Do NOT edit files.

Review the IMPLEMENTATION of the contributor write capability against the design in docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md (v3, final review PASS WITH REQUIRED CHANGES, changes applied).

Files to review (use git diff and read the untracked files):
- src/lib/contributorCapability.ts (new, server-only)
- src/lib/db.ts (store functions at the end, sqlite table, createSubmission return shape)
- src/lib/supabase.ts (appended: insertSupabaseCapability, consumeSupabaseCapability, saveSupabaseContributorPreferences, deleteSupabaseSubmissionRecords)
- src/app/remember/actions.ts (submitMemoryAction issuance, updatePreferencesAction redeem)
- supabase/schema.sql (appended table, RLS, revokes, contributor_purge_expired function)
- scripts/contributor-capability-tests.mjs, scripts/contributor-capability-supabase-tests.mjs, scripts/v01-smoke-test.mjs (capability assertions)

Check with file:line evidence:
1. Submission binding: can a cookie for submission A be used to change B? Is the client argument ever used in a database predicate?
2. Replay: consume-first; can two concurrent requests both save?
3. Status gate and whether a reviewed submission can still be changed.
4. Allowed fields: exactly four; no path to status, review, original_json.
5. Token: generation, hashing, raw token never logged, stored, or returned after issuance.
6. Cookie: name derived safely, attributes (HttpOnly, SameSite=Strict, path, secure in production), deletion uses the same attributes.
7. Error handling: one public message; no internal detail leaks through thrown errors in actions.ts (check every redirect and throw path).
8. Compensation on issuance failure: does it delete what it should, and can it delete something it should not (for example another submission's person row)?
9. Service-role use: confirm only the four new Supabase functions and existing unrelated uses; confirm server-only import.
10. Schema: RLS on, no policy, no grant; the cleanup function's SQL logic (does it delete a person still referenced? is the 2-hour guard correct?).
11. Any SQL injection or filter injection in PostgREST URLs (encodeURIComponent use).
12. Any legitimate blocker.

Output:
- First line: VERDICT: APPROVE | APPROVE WITH CHANGES | REQUEST CHANGES | BLOCKED
- Numbered findings: severity (blocker/high/medium/low), file:line, failure scenario, minimal fix.
- Short list of verified-correct items.
No padding.
