VERDICT: READY WITH REQUIRED CHANGES

| Prior finding | Status | v3 evidence |
|---|---|---|
| v1-1 Zero-row PATCH false success | CLOSED | Both DELETE and PATCH require exactly one returned matching row; SQLite requires `changes === 1` ([design:66](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:66)). |
| v1-2 Verified SID is sole identifier | CLOSED | Cookie value carries the SID, equality with the argument is mandatory, and only `parsedSid` may reach persistence ([design:62](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:62)). |
| v1-3 Dedicated service-role helper | CLOSED | Two narrow helpers require service-role configuration, accept no bearer/admin token, and construct the fixed body internally ([design:80](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:80)). |
| v1-4 Revocation/one-time consumption | CLOSED | The guarded DELETE consumes the capability before saving; concurrent/replayed calls cannot consume it again ([design:66](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:66)). |
| v1-5 Token verification contract | CLOSED | The signed token was replaced by a random 32-byte bearer with an exact SID/token format and no signing-secret/parser surface ([design:52](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:52)). |
| v1-6 Principal failure tests | PARTIALLY CLOSED | v3 covers malformed values, row counts, SID mismatch, replay, races, and missing configuration, but still lacks the explicitly requested production-like browser/Server Action test ([design:159](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:159)). |
| v1-7 Missing threats | PARTIALLY CLOSED | Most threats are now present, but cookie-quota exhaustion, path-correct cookie deletion, response ambiguity, and partial creation leaving contributor PII are omitted ([design:119](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:119)). |
| v1-8 Cookie scope and ordering | CLOSED | `/remember` scope is correct, and the specified issuance sequence places cookie creation immediately after successful submission creation ([design:52](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:52)). |
| v2-A No usable SID | CLOSED | The canonical SID is now embedded in the cookie value and independently checked against the argument ([design:57](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:57)). |
| v2-B Atomic replay prevention | CLOSED | A matching capability row is atomically deleted; only one concurrent caller can receive it ([design:66](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:66)). |
| v2-C Admin-review interleaving | CLOSED | v3 accurately documents the two-statement review operation, defines “reviewed” by committed status, and accepts/tests the interleaving ([design:113](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:113)). |
| v2-D Hash exposed by wildcard queries | CLOSED | Capability data moved to a separate table, so existing `select=*` and `submissions.*` queries cannot include it ([design:34](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:34)). |
| v2-E Random token plus SHA-256 | CLOSED | v3 retains a 256-bit random token and stores only its SHA-256 hash ([design:40](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:40)). |
| v2-F Argument can influence write | CLOSED | The argument selects a cookie name and is equality-checked, but every database predicate must use the parsed cookie SID ([design:62](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:62)). |
| v2-G Omitted creation/exposure threats | CLOSED | Per-submission cookie names prevent replacement; capability insertion precedes submission insertion; separate storage removes wildcard exposure ([design:52](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:52)). |

## New findings

1. **High — The issuance API described by v3 does not exist.**

   v3 says `submitMemoryAction` generates the SID, inserts the capability, then calls the existing `createSubmission` with that same SID ([design:52](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:52)). Currently, `normalizeSubmission` generates the SID internally ([db.ts:215](C:/Users/yerie/m3-memory/src/lib/db.ts:215)), and `createSubmission(input)` exposes no way to supply or retrieve it before insertion ([db.ts:257](C:/Users/yerie/m3-memory/src/lib/db.ts:257)).

   **Required change:** specify the exact creation contract. Either normalize once in the action and pass the resulting record to both operations, or add a server-generated SID parameter to a narrowly scoped creation function. State that client input can never supply or override this SID. Add a test proving the capability and submission receive the identical server-generated UUID.

2. **Medium — Cookie clearing is underspecified for a path-scoped cookie.**

   The capability cookie is created with `path: "/remember"` ([design:57](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:57)), but v3 merely says to “clear the cookie” ([design:72](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:72)). A deletion cookie using `/` or an implicit different path does not remove the `/remember` cookie.

   **Required change:** require deletion by setting the same name with `maxAge: 0`/expired date and `path: "/remember"` plus matching security attributes. Test the resulting response cookie attributes, not only replay rejection at the database.

3. **Medium — Generic public errors are not tied to the current action boundary.**

   The current action interpolates the internal exception message into its public error ([actions.ts:85](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:85)). That can expose configuration, PostgREST status, or persistence details despite v3’s generic-error promise.

   **Required change:** explicitly replace this behavior: log only a sanitized server-side event without token/hash/body and return one fixed public error for missing, malformed, expired, reviewed, consumed, misconfigured, and backend-failure cases. Test that each case produces the same public message.

4. **Medium — Creation failure can leave contributor PII, not merely a harmless capability row.**

   v3 calls an orphan capability harmless ([design:145](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:145)), but current Supabase creation first inserts `persons` containing name/contact and then separately inserts `submissions` ([supabase.ts:165](C:/Users/yerie/m3-memory/src/lib/supabase.ts:165)). A failure in the second request can leave both an orphan capability and an orphan person containing contributor PII.

   **Required change:** add this threat and define one of: transactional creation through a reviewed RPC, compensating deletion of the just-created capability and person on submission failure, or an explicit accepted residual risk with an auditable cleanup mechanism and test. Do not describe the complete orphan state as harmless.

5. **Low — Per-submission names trade collision for browser cookie-quota exhaustion.**

   An unauthenticated browser can accumulate one cookie per started submission ([design:57](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:57)). Browser per-domain cookie limits can evict older capability cookies, stranding otherwise valid submissions.

   **Required change:** add this availability threat. Specify an acceptable bound/cleanup strategy or explicitly accept eviction as a contributor restart condition; add a bounded multi-submission test.

## Required specific assessments

**(a) DELETE then PATCH:** Security-wise, it is sound as fail-closed. DELETE is the single-use authorization gate. If PATCH definitively fails, authority is already gone and retry is impossible. If the PATCH commits but its response is lost, the client will report failure even though preferences were saved; this is an outcome-ambiguity/availability defect, not an authorization bypass. The design must not claim it can always distinguish “not saved” from “saved but response lost.”

**(b) SID binding:** Complete in the intended write path:

- Cookie name: `m3_contrib_<argument>`.
- Cookie value: `<parsedSid>.<token>`.
- Equality: `parsedSid === argument`.
- Capability DELETE predicate: parsed SID.
- Submission PATCH predicate: parsed SID.

The implementation should validate the argument as a canonical UUID before constructing the cookie name, then discard it after equality checking. Both PostgREST filters must use `encodeURIComponent(parsedSid)`.

**(c) Separate RLS table:** This closes v2-D. Direct PostgREST table access requires SQL privileges; `anon` and `authenticated` have none, and no RLS policy permits them. Existing `select=*` and `submissions.*` queries address `submissions`, not the separate table. The current schema contains no RPC that reads capability data: its only `SECURITY DEFINER` function is `is_m3_admin()` ([schema.sql:97](C:/Users/yerie/m3-memory/supabase/schema.sql:97)). A future `SECURITY DEFINER` RPC could bypass this boundary if executable and written to expose the table, so future RPCs touching it require explicit Tier 3 review and restricted `EXECUTE`. Database owners, superusers, and bypass-RLS roles remain privileged by design; “only service role” is not literally true at the PostgreSQL level.

**(d) Cookie ordering and media:** The correct insertion point is immediately after `createSubmission` returns at [actions.ts:41](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:41), before media processing begins at [actions.ts:43](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:43). That preserves the capability if upload or media-row insertion fails. v3’s order produces that result if implemented literally. Separately, the current Supabase media-row call still requires an admin token that the contributor path does not supply ([db.ts:539](C:/Users/yerie/m3-memory/src/lib/db.ts:539)); this is an existing media-flow defect, not fixed by the capability design.

**(e) Remaining omitted threats:** Path-mismatched cookie deletion, browser cookie-quota eviction, ambiguous PATCH outcome after commit, public propagation of internal errors, and orphan `persons` PII after partial creation.

## Verified correct

- The four-field allowlist excludes source memory, review data, status, IDs, and timestamps.
- Consumption prevents successful and concurrent replay.
- The `UNREVIEWED` predicate is the authoritative review-state gate.
- Zero/multiple/wrong-row PostgREST responses are rejected.
- Missing service-role configuration fails before a request.
- No contributor UPDATE grant or RLS policy is introduced.
- Existing wildcard submission queries cannot expose the separate capability table.
- Random 256-bit tokens with stored SHA-256 hashes are adequate.
- `/remember`, `httpOnly`, `SameSite=Strict`, production `Secure`, and two-hour expiry are appropriate.
- The design accurately preserves contributor source records; only separately owned preference fields are writable.