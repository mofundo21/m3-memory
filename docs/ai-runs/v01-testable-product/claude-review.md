## Code Review: M3 Memory V0.1 Tier 3 Security & Architecture

**Scope:** Uncommitted changes across Supabase schema candidate, database layer, authentication, admin workflow, and smoke test coverage.

**Focus Areas:** Contributor original immutability, RLS posture, public access boundaries, review separation, and repeatable test coverage.

---

### Summary

No blocking findings. All Tier 3 critical invariants are properly implemented and tested. The uncommitted changes establish correct security foundations for V0.1 and properly document deferred production concerns.

---

### Verified Invariants

#### ✓ **Contributor Original Immutability**
- `createSubmission()` stores the full SubmissionInput as immutable JSON in `original_json` (db.ts:178)
- `upsertReview()` never touches `original_json`—only updates the separate `reviews` table (db.ts:237-301)
- Admin UI displays original in read-only `OriginalField` components, not editable fields (submissions/[id]/page.tsx:34-87)
- Smoke test validates immutability through both review create and update cycles (v01-smoke-test.mjs:155, 182)
- **Status:** PASS

#### ✓ **Public Cannot List/Read Submissions**
- Both `/admin/submissions` and `/admin/submissions/[id]` guard with `isAdminAuthenticated()` redirect to `/admin/login` (submissions/page.tsx:13; submissions/[id]/page.tsx:44)
- Smoke test confirms unauthenticated requests return 307 redirect (v01-smoke-test.mjs:107-113)
- `/thanks` page intentionally does not display submission ID or contributor name (smoke test confirms: v01-smoke-test.mjs:189-190)
- **Status:** PASS

#### ✓ **Admin Review Writes Separate from Source Submissions**
- `reviews` table has `submission_id` unique constraint (schema.sql:32)—one review per submission
- `upsertReview()` creates or updates only the `reviews` row; never modifies `submissions` (db.ts:237-301)
- UI clearly separates "Contributor Original" (left panel, read-only) from "Yeriel Review" (right panel, form) (submissions/[id]/page.tsx:62-118)
- Smoke test verifies single review row persists after create and update (v01-smoke-test.mjs:181: `review_count = 1`)
- **Status:** PASS

#### ✓ **Repeatable Smoke Test Coverage**
- `v01-smoke-test.mjs` is comprehensive, no external dependencies, uses `node:sqlite` and `node:child_process`
- Starts isolated dev server on ephemeral port, creates per-run SQLite database, cleans up after
- Tests:
  - Submission form rendering and field validation (required name/memory, optional fields)
  - Field length capping (memoryText capped at 12000 bytes; preview at 220 bytes) (v01-smoke-test.mjs:104)
  - Access control (public cannot list or read detail without auth)
  - Admin login workflow with password comparison and session cookie
  - Review create/update with data persisted to separate table
  - Original immutability through both workflows
  - Thanks page doesn't leak submission ID or names
- Integrated into `package.json` as `npm test` (runs build + smoke)
- **Status:** PASS

---

### Supabase Candidate Schema Assessment

#### ✓ **RLS Posture is Correct (Intentionally Deferred)**
- RLS enabled on all tables (schema.sql:77-82)
- All default grants revoked from `anon` and `authenticated` (schema.sql:88-93)
- **NO explicit policies defined**—this is intentional per schema comment (line 86): "Add explicit authenticated admin policies only after the admin identity model is chosen"
- Default-deny posture is correct: unauthorized clients cannot access any table
- **Action Required Before Production:** Add explicit RLS policies for the chosen admin identity model (e.g., if using Supabase Auth, policies for authenticated role; if staying password-based, still no policies needed since server-side)
- **Status:** DEFER-NOT-BLOCK — Properly documented in ARCHITECTURE.md line 62 and setup/SUPABASE.md lines 25-29

#### ✓ **Table Structure Enforces Separation**
- `submissions.original_json` is immutable source (written only at submission time)
- `reviews` is separate layer with unique constraint on `submission_id` (one review per submission)
- Media, artifacts, story_drafts reserved for future work
- **Status:** PASS

---

### Admin Authentication & Session Management

#### ⚠️ **Session Timeout is Long (12 hours)** — MEDIUM Severity, Not Blocking
- Session cookie `maxAge: 60 * 60 * 12` (auth.ts:50)
- Acceptable for local MVP, but production should reduce to 1–2 hours
- Timing-safe password comparison using `timingSafeEqual` is correct (auth.ts:40)
- Session secret and admin password both require explicit env vars in production (auth.ts:8–9, 18–19)
- **Recommendation:** Add to production checklist—reduce session timeout and evaluate Supabase Auth as password successor

#### ⚠️ **No Logout UI** — MEDIUM Severity, Not Blocking (UX Issue, Not Security)
- `logout()` function exists but is not called anywhere in the UI
- Admin must wait for 12-hour session timeout to fully sign out
- Re-entering admin area requires re-entering password, so **re-authentication is not weakened**, only forced-idle-until-timeout
- **Recommendation:** Add "Sign out" button to admin inbox header before production

---

### CSRF & Input Validation

#### ✓ **Server Actions Provide Automatic CSRF Protection**
- Forms use Next.js server action bindings (`action={submitMemory}`, `action={saveReview.bind(null, id)}`)
- Next.js automatically validates CSRF tokens for server actions (built-in since 13.0+)
- No visible token parameter needed
- **Status:** PASS

#### ✓ **Input Validation at Submission Boundary**
- Required fields validated before insert: `submitterName` and `memoryText` (page.tsx:37–39)
- All text fields capped at defined max lengths (db.ts:104–105 `text()` function; field-level maxLength attributes)
- Status validation via `requireStatus()` checks against allowed list (db.ts:117–121)
- Ratings validated to 1–5 range (db.ts:112–115)
- **Status:** PASS

---

### Documentation Accuracy

- **ARCHITECTURE.md:** Updated to reflect actual V0.1 state (local SQLite + Supabase candidate) ✓
- **DECISIONS.md:** Added rationale for local-only V0.1 and smoke test requirement ✓
- **docs/setup/SUPABASE.md:** Clear prerequisites and integration path documented ✓
- **.env.example:** Adds Supabase credential placeholders with explanation ✓

---

### No Issues Found In

- XSS prevention (JSX escaping is correct; OriginalField uses safe String conversion)
- SQL injection (all queries use parameterized statements; status enum validated)
- Database-level foreign keys and cascade delete configured correctly (schema.sql:32, media:52, artifacts:62, story_drafts:70)
- Form field validation and sanitization

---

## Recommendation

**Approve all uncommitted changes.** No architectural or security blockers exist. The V0.1 foundation correctly implements the Tier 3 requirements (historical immutability, access boundaries, admin separation, repeatable test coverage).

**Before Supabase integration:**
1. Provide fresh empty Supabase project credentials
2. Run Tier 3 review on RLS policy implementation (admin identity model dependent)
3. Document admin identity choice (keep password gate or adopt Supabase Auth allowlist)
4. Reduce session timeout to 1–2 hours and add logout UI
