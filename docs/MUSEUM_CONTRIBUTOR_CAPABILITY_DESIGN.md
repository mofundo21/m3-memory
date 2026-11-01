# Contributor-Scoped Write Capability: Design v3 (Tier 3)

Status: **Design only. Not implemented.** Review history:
- v1: READY WITH REQUIRED CHANGES (`docs/ai-runs/contributor-capability/codex-review.md`)
- v2: NOT READY (`docs/ai-runs/contributor-capability/codex-review-v2.md`)
- v3: this document. Needs its own cross-model review before implementation.

Scope: the production blocker in `docs/MUSEUM_CHECKPOINT.md` (decision 1). In Supabase mode, `updatePreferencesAction` calls the admin-token preference path without a token, `db.ts` throws `UNAUTHENTICATED`, and contributors cannot finish the interview.
Non-goals: no change to the `submissions` table, its grants, its policies, or the `anon`/`authenticated` roles. No general UPDATE access for anonymous users. No enumeration endpoint.

> **Revision after implementation review (2026-10-31):** the four attribution values are now the ones the final form offers (previously documented as two). Creation order is capability row first, then the submission, both keyed by one server-generated SID; any failure compensates with the same ids and returns one fixed redirect. Cookie deletion carries an epoch expiry. Person compensation in SQLite is guarded by `NOT EXISTS`. The implementation review is recorded in `docs/ai-runs/contributor-capability/code-review.md`.

## 1. The problem, precisely

- The only contributor-owned preference write (`updateSupabaseSubmissionPreferences`, `src/lib/supabase.ts`) sends the **anon key plus an admin JWT**. Contributors have none, so the request is refused. The database would refuse it too: `anon` has no UPDATE grant on `submissions`, and `authenticated` has `update(status, updated_at)`, gated by `is_m3_admin()`.
- `updatePreferencesAction(submissionId, formData)` accepts `submissionId` from the client and passes it to persistence. Nothing binds it to the person who created the submission.
- The general preference PATCH checks only the HTTP status, so a filter that matches zero rows looks like success.

## 2. Security goal

A contributor who just created submission **S** can save the four contributor-owned fields on **S** once, while **S** is `UNREVIEWED` and within a two-hour window. Nobody else gains any capability.

Allowed fields (exact allowlist, built server-side):

| Column | Source |
|---|---|
| `attribution_preference` | `attributionPreference`: one of the seven choices the final form offers: `anonymous`, `first_name`, `full_name`, `nickname`, `artist_name`, `initials`, `custom` (display choices only, same column, no new fields; the server accepts exactly these, so no visitor choice is silently changed); anything else becomes `anonymous` |
| `preferred_attribution` | `preferredAttribution` (max 240 chars) |
| `book_note` | `bookNote` (max 4000 chars) |
| `final_notes` | `finalNotes` (max 4000 chars) |

Not writable: `status`, every review field, `original_json`, `memory_preview`, dates, location and media fields, `submitter_person_id`, `persons.*`, `id`, `created_at`. `updated_at` is set by the existing trigger.

## 3. Design v3

### 3.1 A separate capability table

`contributor_capabilities` holds one row per submission that has an open contributor window:

| Column | Type | Notes |
|---|---|---|
| `submission_id` | uuid, primary key | The submission's id. Deliberately **no foreign key**, so the row can be written before the submission row (§3.3). |
| `token_hash` | text, not null | SHA-256 (hex) of the random token. The token itself is never stored. |
| `expires_at` | timestamptz, not null | Now + 2 hours at issuance. |
| `created_at` | timestamptz, not null, default now() | |

Access control:
- `enable row level security`, `revoke all ... from anon, authenticated`, **no policies**. Default-deny for every role except the service role, which bypasses RLS and is used only on the server.
- Because the table is separate, **`submissions` is not touched**: no new columns, no grant changes, no policy changes, and existing `select=*` and `submissions.*` queries cannot expose anything new.
- SQLite: the same table, created in the existing schema setup.

### 3.2 Capability and cookie

- **Issue** in `submitMemoryAction`, in this order:
  1. Normalize the submission record **once** in the action (`normalizeSubmission`, which generates the SID with `randomUUID` on the server). The SID is never taken from client input. Generate a 32-byte random token, base64url, exactly 43 characters.
  2. Insert the capability row (`submission_id` = the record's SID, SHA-256(token), `expires_at`).
  3. Persist the **same record** (same SID) through a creation function that accepts an already-normalized record. Today `createSubmission(input)` normalizes internally, so it must be split into `normalizeSubmission` (called once by the action) plus `persistNormalizedSubmission(record)`. The capability and the submission therefore share the identical server-generated UUID. Test this.
  4. Only after step 3 succeeds, set the cookie, immediately, before any media work. A media failure then leaves a usable capability.
- **Creation failure (step 2 or 3 fails):** the action makes a best-effort compensating delete of the capability row and of any `persons` row just created, then returns the generic error. If compensation itself fails, the orphan is an **accepted residual risk**: it contains contributor name and contact, has no usable cookie, and expires. It is listed in §4 and must be covered by a periodic cleanup task (§3.5) before public launch.
- **Cookie**: name `m3_contrib_<sid>`, value `<sid>.<token>`. `httpOnly`, `path: "/remember"`, `sameSite: "strict"`, `secure` in production, `maxAge: 7200`. One cookie per submission, so two memories started in the same browser do not overwrite each other.
- The token is never in a URL, a query string, a log, or an error message.

### 3.3 Write path (`updatePreferencesAction`)

1. Read the cookie named `m3_contrib_<argument>`. If absent, fail generically.
2. Parse the value. It must be exactly `<uuid>.<43 base64url chars>`. Anything else fails generically.
3. **Trust only the parsed SID.** Require `parsedSid === argument`. Then use `parsedSid` for every database operation. The argument is never used in a query on its own.
4. Compute `h = SHA-256(token)`.
5. **Consume the capability atomically**, which is the single-use gate:
   `DELETE FROM contributor_capabilities WHERE submission_id = :sid AND token_hash = :h AND expires_at > :now RETURNING submission_id`.
   Only one caller can receive the deleted row. Zero rows fails generically.
6. **Save guarded by status**:
   `UPDATE submissions SET attribution_preference = :a, preferred_attribution = :p, book_note = :b, final_notes = :f WHERE id = :sid AND status = 'UNREVIEWED' RETURNING id`.
   Success requires exactly one returned row whose `id === sid`. Zero or multiple rows fails generically.
7. On success, clear the cookie and redirect to `/thanks`. On failure, clear the cookie as well, so a failed attempt cannot be retried with the same token.

**Cookie clearing:** the deletion response sets the same name (`m3_contrib_<sid>`) with `path: "/remember"`, `httpOnly`, `sameSite: "strict"`, the same `secure` setting, and an expired date plus `maxAge: 0`. A deletion with a different path does not remove the cookie and must not be used. Tests check the emitted `Set-Cookie` attributes.

**Public errors:** every failure (missing or malformed cookie, SID mismatch, expired, consumed, reviewed, misconfigured, backend failure) returns the same fixed message: "Preferences could not be saved. Please start again from the beginning." Internal exception text is never interpolated into the public message. This replaces the current `Failed to save preferences: ${error.message}` behavior. A server-side event is logged with a category only: no token, hash, body, or raw backend message. Tests assert that each case produces the same public message.

Trade-off, stated explicitly: steps 5 and 6 are two statements, not one. Consumption happens first. If step 6 fails after step 5 succeeds (for example, the submission was reviewed in between, or a network error), the contributor cannot retry with that token. This fails closed. It never allows a second save and never saves to a row the token did not match.

**Outcome ambiguity:** if the PATCH commits but its response is lost, the client shows the generic error even though the preferences were saved. The design does **not** claim it can always tell "not saved" from "saved but response lost". The contributor restarts, and the next save is refused as consumed. This is an availability defect, not an authorization bypass, and it is listed in §4.

Supabase implementation: PostgREST `DELETE` with `Prefer: return=representation` for step 5; PostgREST `PATCH` with `Prefer: return=representation` and `select=id` for step 6. Both use the **service-role key** and encoded filters. The Supabase path has no bearer or admin-token parameter.

SQLite implementation: the same statements with `?` placeholders. Success requires `run().changes === 1` for each step.

### 3.4 The service-role helpers

Two new functions in `src/lib/supabase.ts`, server-only, named `consumeContributorCapability` and `saveContributorPreferences`:

- Call `getSupabaseConfig(true)`, so a missing service-role key fails closed.
- Take no bearer or admin-token parameter.
- Send the service-role key in both `apikey` and `Authorization`.
- Build the body internally. `saveContributorPreferences` accepts only the four allowlisted values and sends those four columns plus `updated_at`, set explicitly to the current time (commit f36906e). The existing trigger would also set `updated_at`; the explicit value matches the SQLite path and is harmless. No other column is ever sent.
- Never log request bodies, tokens, or hashes.

The existing `updateSubmissionPreferences` admin-token path is left unchanged.

### 3.5 Schema change (additive, Tier 3 review required)

`supabase/schema.sql`, appended:

```sql
create table if not exists public.contributor_capabilities (
  submission_id uuid primary key,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists contributor_capabilities_expires_idx on public.contributor_capabilities (expires_at);
alter table public.contributor_capabilities enable row level security;
revoke all on public.contributor_capabilities from anon, authenticated;
-- No policies: no role except the service role may read or write this table.
```

SQLite: the same table in the schema setup, with `CREATE TABLE IF NOT EXISTS`.

Expired rows: step 5 ignores them. Cleanup is required before public launch, not optional: a scheduled `DELETE FROM contributor_capabilities WHERE expires_at < now()`, and a matching cleanup of orphan `persons` rows with no submission. Capability rows carry no contributor content, but orphan `persons` rows carry name and contact.

**Future RPCs:** the table has no grants today. Any future `SECURITY DEFINER` function that touches it needs a Tier 3 review and a restricted `EXECUTE` grant. Database owners, superusers, and roles with `BYPASSRLS` retain privileged access by design; "service role only" means no application role other than the server's service key.

**Pre-existing defect, out of scope for this design:** in Supabase mode, `insertMediaRows` requires an admin token (`src/lib/db.ts:539`), so a contributor's media upload fails and redirects to `/remember/details?error=media`. Contributors who attach media cannot complete the interview in Supabase mode. This needs its own Tier 3 design, mirroring this one, and is tracked as a separate blocker.

### 3.6 Admin review interaction

- The admin review path does not write capability rows. The status gate in step 6 is the authoritative control.
- The admin review path is not a single statement: it inserts or updates `reviews`, then updates `submissions.status`. A contributor save can land between those two steps. The only fields that save can change are the four contributor-owned preference fields. No review field, status, or original memory is affected. This interleaving is accepted and documented, and it is covered by a test (§6).
- "Reviewed" means a committed `submissions.status` other than `UNREVIEWED`.

## 4. Threats and mitigations

| Threat | Mitigation |
|---|---|
| Edit someone else's submission | The write uses only the SID parsed from the cookie, and that SID must equal the argument. The token is unique to one row. |
| Client supplies another id | Mismatch fails before any database call. Test asserts zero persistence calls. |
| Cookie from submission A used with argument B | Cookie name is derived from the argument, and the value's SID must match. Two checks, both must pass. |
| Guess a token | 256-bit random. Only its SHA-256 is stored. |
| Read the token from the database | The table has no grants. The hash is not reversible to a usable token. |
| Replay after success | Step 5 deletes the row; a second attempt finds nothing. |
| Replay after expiry | `expires_at > now` in step 5; cookie `maxAge` too. |
| Save after admin review | `status = 'UNREVIEWED'` in step 6. |
| Concurrent double submit | Only one DELETE returns a row. The other fails generically. |
| Race: admin review vs. contributor save | Accepted and documented (§3.6). Only preference fields can change, and the status gate applies to any save that reaches step 6. |
| Partial failure after consumption | Fails closed. Contributor restarts; no second save is possible. Documented trade-off. |
| Zero-row false success | Step 5 and step 6 both require exactly the expected rows. |
| Change review or admin fields | Fixed body: the four allowlisted columns plus `updated_at`. Review columns are never in any statement. |
| Change original memory | `original_json` is never in any statement. |
| Enumerate submissions | No list or lookup endpoint. Unknown and foreign ids return the same generic error. |
| Bypass RLS in general | No RLS change. Service-role key used in two narrow server-only functions. |
| Admin or authenticated user reads capability data | The table has no grants and no policies for `authenticated`. Existing wildcard queries on `submissions` cannot reach it. |
| Token theft via XSS | `httpOnly`. An active same-origin script can still call the action while the window is open; bounded to one save per submission and two hours. Residual risk, accepted. |
| Token leak via URL, logs, or errors | Not in URLs. Helpers do not log tokens, hashes, or bodies. Errors are generic. |
| CSRF | `sameSite: strict` plus Next.js server-action origin checks. |
| Cookie collision across submissions | Per-submission cookie name. |
| Malformed cookie | Shape check before hashing. Parsing never throws on arbitrary input. |
| Failure after submission created, before cookie set | Cookie is set only after `createSubmission` succeeds. The submission exists with no usable cookie, so it can't be completed through the interview. The existing error path shows. Fails closed. |
| Orphan capability row and orphan `persons` row (submission insert failed) | Compensating delete on failure (§3.2). If compensation fails, the orphan holds contributor name and contact: **accepted residual risk**, no usable cookie, expires. Requires the cleanup task in §3.5 before public launch. |
| Path-mismatched cookie deletion leaves the cookie in place | Deletion uses the same name, `path: /remember`, and matching attributes (§3.3). Tested. |
| Cookie-quota eviction in a browser with many open submissions | Accepted availability limit. A browser evicts old cookies only after many concurrent starts; the contributor restarts, and no authority leaks. |
| Ambiguous outcome: PATCH commits, response lost | Not an authorization bypass. Contributor sees the generic error and restarts; the next attempt is refused as consumed (§3.3). Documented, not claimed to be detectable. |
| Public error leaks backend detail | Single fixed public message; internal text never interpolated (§3.3). |
| Service-key exposure via errors or instrumentation | Helpers wrap failures in the generic error; no request bodies in errors. |
| Secret rotation | None needed. The token is random, not signed. |
| Migration impact | New table only. Existing rows and queries are unchanged. |

## 5. Alternatives considered

1. **Signed stateless token (v1).** Rejected: a two-hour bearer cannot be revoked or consumed.
2. **Hash columns on `submissions` (v2).** Rejected: `authenticated` admins can select all columns via existing wildcard queries.
3. **JWT with an RLS policy on `submissions`.** Requires a new issuer, a new policy, and new grants. Changes RLS, which this step forbids.
4. **SECURITY DEFINER RPC doing consume and save in one statement.** Stronger atomicity and a good hardening target. It needs a migration with function-owner and `search_path` review. Deferred; the two-statement design fails closed and is simpler to review.
5. **Give contributors a short-lived admin token.** Rejected: it grants admin read access.

## 6. Test plan (required before merge)

Unit, pure functions:
- Cookie value parsing: wrong length, bad characters, missing dot, extra segments, non-UUID SID, empty, non-string. None throws.
- Token generation: 43 characters, base64url, unique across samples. The stored value is the SHA-256, never the token.
- Save payload: extra keys are not in the built body; oversize text is truncated; unknown `attributionPreference` becomes `anonymous`; the only keys are the four allowlisted columns and `updated_at`.

Supabase (mocked fetch):
- Consume request: `DELETE`, `submission_id=eq.<encoded sid>`, `token_hash=eq.<hash>`, `expires_at=gt.<now>`, `Prefer: return=representation`, service-role key in `apikey` and `Authorization`.
- Zero deleted rows fails. Two deleted rows fails. A deleted row with a different id fails.
- Save request: `PATCH`, `id=eq.<encoded sid>`, `status=eq.UNREVIEWED`, `select=id`, `Prefer: return=representation`, the four allowlisted columns plus `updated_at` in the body.
- Zero returned rows fails (reviewed submission). Two rows fails. A row with a different id fails.
- Missing service-role configuration throws before any request.
- Neither request ever uses the anon key alone or an admin token.

Action level (call boundary):
- Argument differs from the cookie SID: no consume, no save, no SQLite write.
- Cookie named for submission A, argument B: fails before any database call.
- The SID passed to both persistence functions is the parsed cookie SID.

SQLite integration (existing smoke harness, plus new cases):
- Full interview saves preferences; cookie cleared; redirect to `/thanks`.
- Replay of the same cookie after success: generic error, row unchanged.
- Cookie for submission A used against B: generic error, row B unchanged.
- Expired capability: generic error.
- Submission reviewed before save: generic error; capability already consumed.
- No cookie: generic error.
- Two memories started in one browser: each completes with its own cookie.
- Concurrent double submit: exactly one save.

Schema:
- The diff of `supabase/schema.sql` adds only the new table, its index, RLS enablement, the revoke, and the comment. No existing grant or policy line changes.
- The existing `supabase-unit-tests.mjs` RLS checks still pass.

Security checklist:
- Service-role key referenced only in `src/lib/supabase.ts`, server-only.
- No `console.log` of tokens, hashes, or request bodies.

## 7. Review requested

Second-model review (Codex, read-only) of v3 against the v1 and v2 findings. Specifically: whether the two-statement consume-then-save is acceptable as a fail-closed design, whether the SID binding is now complete, whether a table with no grants and no policies fully closes the exposure finding, and whether any earlier finding remains open.
