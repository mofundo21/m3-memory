You are the independent cross-model security reviewer (Tier 3) for the M3 Memory project. Do NOT edit files. Read-only. Do not write an implementation.

Review the design in `docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md` against the current code, which it claims to match:

- `src/app/remember/actions.ts` (submitMemoryAction, updatePreferencesAction)
- `src/lib/db.ts` (createSubmission, updateSubmissionPreferences, requireSupabaseAdminToken)
- `src/lib/supabase.ts` (headers, updateSupabaseSubmissionPreferences, createSupabaseSubmission, getSupabaseConfig)
- `src/lib/auth.ts` (secret(), cookie options used for admin sessions)
- `supabase/schema.sql` (grants, RLS policies, default-deny)

Goal of the design: a contributor who just created submission S may change only four contributor-owned fields on S, only while S is UNREVIEWED, using a signed, httpOnly, path-scoped, expiring capability bound to S. No RLS, grant, or role change. Service-role key used only for one narrow server-side PATCH.

Answer these, with evidence (file and line):

1. Does the design actually bind the write to the signed submission? Is there any path where the client-supplied submissionId argument can reach the database without being checked against the token? Any way to make the PATCH hit a row other than S?
2. Is the service-role use narrow enough? Could any part of the design let a contributor reach columns or rows beyond the four fields and UNREVIEWED status?
3. Verify the claim that no RLS or grant change is needed. Are there existing grants or policies that would already let the change through, or conversely make it fail in a way the design does not account for?
4. Token design: is HMAC with a purpose-derived key sound? Any cross-use risk with the admin session token (auth.ts digest)? Expiry handling? Constant-time comparison? Any encoding ambiguity?
5. Cookie scoping (path /remember, sameSite strict, maxAge 2h): does the cookie reach the server action on /remember/final? Does sameSite strict break the redirect from submitMemoryAction to /remember/final? Any issue with secure flag in production?
6. The stateless-token residual risk: is the stated mitigation adequate for a Tier 3 decision, or should revocation (a stored hash or nonce) be required before implementation? Be specific.
7. Missing threats. List anything the threat table omits.
8. Is the test plan sufficient to catch the top three failure modes you identified?

Output format:
- First line: VERDICT: READY FOR IMPLEMENTATION | READY WITH REQUIRED CHANGES | NOT READY
- Then numbered findings, each with severity (blocker / high / medium / low), file:line evidence, and the exact change to the design you require.
- Then a short list of anything you verified as correct.
Be concrete. Do not pad. If you find nothing wrong in an area, say so in one line.
