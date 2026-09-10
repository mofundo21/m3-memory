# M3 Memory Supabase Production Persistence Plan

Date: 2026-09-10
Host: Codex
Builder: Codex
Reviewer: Claude Code
Task tier: Tier 3 critical

## Goal

Move M3 Memory V0.1 from local-only SQLite persistence to a production-capable Supabase data path while preserving the current local SQLite smoke-test workflow and the existing public/admin UI.

## Acceptance Criteria

- Public `/remember` still creates fictional submissions through the existing server action.
- Local/default test mode still uses SQLite and the current smoke test keeps passing.
- Supabase mode writes contributor originals to `persons` + `submissions` without importing local/dev data.
- Contributor original data remains separate from Yeriel review rows.
- Admin review create/update changes only `reviews` plus `submissions.status`/`updated_at`, never `submissions.original_json`.
- Production admin identity uses Supabase Auth plus an explicit allowlist by user id or email.
- No authenticated Supabase user is an admin by default.
- Anonymous/browser Supabase clients cannot list, read, update, or delete archive data.
- Service-role key is server-only and never referenced from client components.
- `.env.example` lists required variable names only.
- Documentation covers setup, admin creation, production smoke test, rollback, and deployment basics.
- Lint, typecheck, test, production build, and new adapter/security tests pass.

## Approach

1. Keep current route structure and UI. Convert DB calls to async only where required.
2. Split persistence behind the existing `src/lib/db.ts` exports rather than changing route imports broadly.
3. Keep SQLite implementation local and synchronous internally.
4. Add a server-only Supabase REST adapter using native `fetch`; do not add `@supabase/supabase-js` unless the no-dependency path cannot support Auth/PostgREST cleanly.
5. Select persistence via `M3_PERSISTENCE=supabase|sqlite`, defaulting to Supabase only when the required Supabase env vars are present; otherwise SQLite remains local/default.
6. Public submission creation stays server-side and uses the service-role key. Anonymous clients receive no direct table access.
7. Production admin login uses Supabase Auth password grant through the anon key. After login, the server verifies the Supabase user and requires an explicit allowlist in env and database RLS.
8. Admin reads/review writes use the authenticated user's JWT against PostgREST so RLS policies are exercised.
9. Update `supabase/schema.sql` with an `m3_admins` allowlist table, helper function, RLS policies, column-scoped status update grant, review grants, indexes, and timestamp trigger.
10. Add tests for local selection, Supabase request construction/security behavior using mocked `fetch`, unauthorized admin rejection, review update separation, and no service-role client bundle references.

## Concrete Schema Design

- Add `public.m3_admins` as the authoritative production admin allowlist:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid unique`
  - `email text unique`
  - `created_at timestamptz not null default now()`
  - `check (user_id is not null or email is not null)`
- Add indexes for admin lookup, submission status, submission created time, and review submission id.
- Add `public.is_m3_admin()` as a `security definer` SQL helper that checks `auth.uid()` or `auth.jwt()->>'email'` against `m3_admins`; set a fixed `search_path`.
- Enable RLS on `m3_admins` and archive tables.
- Grant no direct archive access to `anon`.
- Grant authenticated admins only the table privileges needed for RLS to operate:
  - `select` on `persons`, `submissions`, `reviews`, and `m3_admins`
  - column-scoped `update(status, updated_at)` on `submissions`
  - `insert`, `select`, and column-scoped `update` on `reviews`
- Add admin RLS policies:
  - `m3_admins`: admins can read allowlist rows; no browser/client insert/update/delete policies.
  - `persons`, `submissions`, `reviews`: `select using (public.is_m3_admin())`.
  - `submissions`: `update using (public.is_m3_admin()) with check (public.is_m3_admin())`; column grants restrict updates to status metadata.
  - `reviews`: `insert/update using/check public.is_m3_admin()`.
- Keep `media`, `artifacts`, and `story_drafts` default-deny until their workflows are designed.
- Add `updated_at` trigger for `submissions` and `reviews`; the app still sends `updated_at`, but the database maintains it defensively.

## Concrete Auth Design

- Add `M3_ADMIN_AUTH=local|supabase`, defaulting to `supabase` when Supabase env vars are configured and `local` otherwise.
- Local mode keeps the existing password cookie for SQLite smoke tests.
- Supabase mode login form accepts email and password.
- `login(email, password)` calls `POST {SUPABASE_URL}/auth/v1/token?grant_type=password` with anon key headers.
- After Auth success, `login` verifies the user is allowlisted by calling PostgREST `m3_admins` with the returned access token.
- The app stores only the Supabase access token in an HTTP-only, strict, secure-in-production cookie. `isAdminAuthenticated()` verifies the token against `/auth/v1/user` and the allowlist; forged cookies or non-admin Supabase users fail.
- `requireAdmin()` returns the admin access token in Supabase mode so server actions can pass it into persistence calls.
- No service-role key is used for admin reads/review writes.

## Concrete Persistence Design

- Keep `src/lib/db.ts` as the route-facing module.
- Move shared validation/normalization into small helper functions inside `db.ts`; do not introduce a broad repository pattern.
- Export async functions:
  - `createSubmission(input): Promise<string>`
  - `listSubmissions(adminToken?): Promise<SubmissionListItem[]>`
  - `getSubmission(id, adminToken?): Promise<SubmissionDetail | null>`
  - `upsertReview(submissionId, input, adminToken?): Promise<void>`
- SQLite mode ignores `adminToken` and preserves existing local behavior.
- Supabase mode:
  - `createSubmission` inserts `persons`, then `submissions`, with service role headers server-side only.
  - `listSubmissions` reads submissions, persons, and reviews through authenticated user JWT/RLS and joins in application code if REST embedding is not worth the complexity.
  - `getSubmission` reads one submission plus person and review through authenticated user JWT/RLS.
  - `upsertReview` validates status, reads existing review through authenticated JWT/RLS, inserts or updates `reviews`, and updates only `submissions.status`; it never sends `original_json` in update payloads.

## Concrete Tests

- Add a no-network unit test script that imports the server modules with mocked `fetch`.
- Cover:
  - SQLite remains default when Supabase env vars are absent.
  - Supabase public create uses service-role headers and writes `persons` + `submissions`.
  - Supabase admin login rejects non-allowlisted authenticated users.
  - Supabase admin reads/review writes use the admin JWT, not service-role.
  - Supabase review update payloads never contain `original_json`.
  - `.next/static` does not contain `SUPABASE_SERVICE_ROLE_KEY` after production build.
- Include these tests in `npm test` before the existing SQLite smoke test.

## Key Decisions

- Server-side public insert is safer and simpler than exposing anonymous table insert policies for V0.1.
- Supabase Auth allowlist replaces the shared password for production admin, while the password gate remains for local SQLite testing.
- RLS still matters for admin operations because authenticated admin reads/writes go through user JWTs, not service role.
- Media schema remains preparatory only; no upload pipeline in this session.

## Non-Goals

- No production data migration.
- No media uploads.
- No domain purchase, hosting purchase, or deployment.
- No rebuild of the public/admin UI.
- No old M3 Hub or unrelated repo inspection.

## Proof Commands

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Remaining External Blocker

Actual Supabase end-to-end verification requires real values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, a configured Supabase Auth admin user, and allowlist configuration. Without those, code and mocked/security tests can pass, but production persistence cannot be claimed working.

## Round 2 Clarifications

- `isAdminAuthenticated()` remains async. Local mode checks the existing digest cookie. Supabase mode reads the HTTP-only access-token cookie, verifies it with `/auth/v1/user`, then verifies allowlist through PostgREST `m3_admins` using the same user JWT. If verification fails or times out, it returns false.
- `requireAdmin()` changes to `Promise<string | null>`. It throws `UNAUTHENTICATED` when unauthenticated and returns the Supabase JWT in Supabase mode or `null` in local mode.
- Affected route changes:
  - `src/app/remember/page.tsx`: `await createSubmission(input)`.
  - `src/app/admin/submissions/page.tsx`: `const adminToken = await requireAdmin(); const submissions = await listSubmissions(adminToken);`.
  - `src/app/admin/submissions/[id]/page.tsx`: page render captures `adminToken` and passes it to `getSubmission`; `saveReview` captures `adminToken` and passes it to `upsertReview`.
- Supabase mode requires admin tokens for `listSubmissions`, `getSubmission`, and `upsertReview`; missing tokens throw `UNAUTHENTICATED`. SQLite mode ignores the token.
- `getAuthMode()` is exported from `src/lib/auth.ts` and used by `/admin/login` to render password-only local mode or email+password Supabase mode. No new auth-mode API endpoint is needed.
- `login(emailOrPassword, maybePassword)` returns `"ok" | "invalid" | "unauthorized"`. Bad Supabase credentials return `invalid`; valid Supabase user missing from `m3_admins` returns `unauthorized`; no cookie is stored until both Auth and allowlist succeed. The page redirects to query-string errors and shows generic invalid vs not-authorized copy.
- Token lifecycle for V0.1 is simple: no refresh-token handling. Expired/invalid Supabase JWTs cause auth checks or PostgREST calls to fail and redirect to `/admin/login?error=expired` where applicable. This is acceptable for the first production path and avoids storing refresh tokens.
- Config fail-fast rule: if `M3_PERSISTENCE=supabase` or `M3_ADMIN_AUTH=supabase` is explicitly set, all required Supabase env vars must be non-empty or the relevant operation throws `SUPABASE_MISCONFIGURED`. If no Supabase env vars are present, default local development remains SQLite/password.
- Exact indexes:
  - `create index if not exists idx_m3_admins_user_id on public.m3_admins(user_id);`
  - `create index if not exists idx_m3_admins_email on public.m3_admins(email);`
  - `create index if not exists idx_submissions_status on public.submissions(status);`
  - `create index if not exists idx_submissions_created_at on public.submissions(created_at desc);`
  - `create index if not exists idx_reviews_submission_id on public.reviews(submission_id);`
- Exact helper shape: `create or replace function public.is_m3_admin() returns boolean language sql security definer set search_path = public as $$ select exists (...) $$;` using `auth.uid()` and `auth.jwt()->>'email'`.
- Mocked Supabase tests run in a separate Node process: `node scripts/supabase-unit-tests.mjs`. `npm test` runs this process first, then the existing production SQLite smoke test. The spawned production server does not inherit mocked `fetch` state.

## Round 3 Clarifications

- Admin allowlist email matching is case-insensitive. `public.is_m3_admin()` uses `lower(email) = lower(auth.jwt()->>'email')`, and setup docs instruct lowercasing admin emails when inserted.
- Supabase mode sends `original_json` as a raw JSON object in the PostgREST request body. SQLite mode continues storing `original_json` as stringified TEXT. The Supabase adapter must not send `JSON.stringify(original)` as the value of `original_json`.
- The implementation must update `supabase/schema.sql` itself, not only docs, with `m3_admins`, `is_m3_admin()`, RLS policies, grants, indexes, and triggers before any production-capable claim.
- `login()` return type change is explicit: `Promise<"ok" | "invalid" | "unauthorized" | "expired">` where `expired` is used for session expiry redirects and invalid cookie cleanup paths.
