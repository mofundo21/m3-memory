VERDICT: NOT READY

| V1 finding | Status | Evidence from v2 |
|---|---|---|
| 1. Zero-row PATCH false success | CLOSED | V2 requires `return=representation`, `select=id`, exactly one returned row matching `sid`, and SQLite `changes === 1` ([design:62](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:62), [design:65](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:65), [design:67](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:67)). |
| 2. Verified SID must be sole identifier | OPEN | V2 says `sid` comes “from the matching row,” but provides no operation capable of finding that row without already knowing `sid`; nevertheless the guarded update requires `$sid` ([design:46](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:46), [design:47](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:47), [design:53](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:53)). |
| 3. Dedicated fail-closed service-role helper | CLOSED | The helper is new, calls `getSupabaseConfig(true)`, accepts no bearer token, uses the service key in both headers, and fixes the payload ([design:69](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:69)-[78](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:78)). |
| 4. Revocation/one-time consumption | CLOSED | The stored hash and expiry participate in the same UPDATE that clears both values ([design:50](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:50)-[60](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:60)). |
| 5. Token verification contract | CLOSED | The signed-token construction was replaced by a 256-bit random bearer with an exact 43-character base64url shape check ([design:36](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:36)-[45](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:45)). HMAC parsing and secret-rotation requirements are no longer applicable. |
| 6. Principal failure tests | PARTIALLY CLOSED | Zero/multiple/wrong-row, mismatch, missing key, reviewed row, replay, and concurrency are now covered ([design:141](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:141)-[161](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:161)); however, the plan does not explicitly require the requested production-like browser test, and PostgREST coverage is mocked only. |
| 7. Missing threat-table entries | PARTIALLY CLOSED | Most requested threats were added ([design:108](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:108)-[125](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:125)), but capability-cookie replacement when a browser creates multiple submissions is absent, and the table incorrectly says authenticated users cannot read the new columns. |
| 8. Cookie scope and issuance ordering | CLOSED | Cookie scope remains `/remember`, and issuance is explicitly placed after submission creation and before media work ([design:36](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:36)-[40](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:40)). |

1. **A — blocker: the single-save statement is atomic, but the design cannot obtain its `sid`.**

   The final-save operation describes only one database write: the guarded UPDATE. A Postgres statement cannot partially commit its six assignments, and the primary-key `id` predicate prevents it from updating another row. The exact-one-row and returned-ID checks correctly reject zero, multiple, or unexpected representations ([design:47](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:47)-[65](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:65)).

   The fatal gap is earlier: the cookie contains only the random token, while `sid` is supposedly obtained from “the matching row”; no lookup is defined, and the UPDATE already requires `sid`. Using the action argument to locate that row would make the untrusted argument authoritative.

   **Required change:** bind a canonical submission UUID into the capability, preferably an httpOnly cookie value such as `<canonical-sid>.<43-char-token>`. Validate the UUID and token, derive `tokenHash`, compare the client argument only to the cookie SID, and construct every database predicate solely from the cookie SID. Alternatively remove the action’s `submissionId` argument entirely. Specify this flow and its tests explicitly.

2. **B — low: atomic consumption closes database replay, including concurrent double submit.**

   Both concurrent UPDATEs may start, but row locking and predicate re-evaluation mean only the first can match the non-null hash; after it clears the hash, the second affects zero rows. Expiry closes later attempts independently of cookie expiry ([design:50](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:50)-[60](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:60)).

   Cookie clearing is defense in depth; a lost response does not restore database authority. Before first successful consumption, theft or same-origin XSS can still win the race, which v2 correctly identifies as residual bearer-capability risk ([design:117](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:117)).

   **Required change:** none beyond resolving SID binding and retaining the concurrent replay test.

3. **C — high: the status UPDATE is safe, but the complete admin-review operation is not one statement.**

   The contributor UPDATE and the admin status UPDATE serialize correctly: if the status change commits first, the contributor predicate is rechecked and fails; if the contributor commits first, the save occurred while the row was still `UNREVIEWED`.

   However, v2 incorrectly says both complete operations are single statements ([design:111](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:111)). The current Supabase review path first inserts or updates `reviews`, then separately updates `submissions.status` ([supabase.ts:246](C:/Users/yerie/m3-memory/src/lib/supabase.ts:246)-[264](C:/Users/yerie/m3-memory/src/lib/supabase.ts:264)). A contributor save can land after review content is committed but before status changes.

   **Required change:** either make review persistence plus status transition one database transaction/RPC, or explicitly define “reviewed” solely by committed `submissions.status` and document/test the review-record-before-status interleaving. Do not claim the current admin review path is one statement.

4. **D — high: the new hash column is exposed to authenticated admins.**

   The claim that the columns are “invisible” because they are not in a new grant is false ([design:40](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:40), [design:83](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:83), [design:98](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:98)). The schema already grants table-level `SELECT` on `submissions` to `authenticated` ([schema.sql:148](C:/Users/yerie/m3-memory/supabase/schema.sql:148)-[151](C:/Users/yerie/m3-memory/supabase/schema.sql:151)). RLS restricts rows to admins, but authenticated admins can select all columns.

   The current detail query explicitly uses `select=*` ([supabase.ts:212](C:/Users/yerie/m3-memory/src/lib/supabase.ts:212)-[218](C:/Users/yerie/m3-memory/src/lib/supabase.ts:218)), and `mapSupabaseDetail` spreads unremoved columns into the returned object ([db.ts:343](C:/Users/yerie/m3-memory/src/lib/db.ts:343)-[355](C:/Users/yerie/m3-memory/src/lib/db.ts:355)). SQLite similarly uses `submissions.*` ([db.ts:365](C:/Users/yerie/m3-memory/src/lib/db.ts:365)-[374](C:/Users/yerie/m3-memory/src/lib/db.ts:374)). Anon remains unable to select; non-admin authenticated users are stopped by RLS; authenticated admins are exposed.

   **Required change:** preferably store capabilities in a separate service-role-only table keyed by submission ID. If columns remain on `submissions`, replace table-level SELECT with an explicit column grant excluding both capability columns and replace every `select=*`/`submissions.*` detail query with an explicit allowlist. This necessarily revises the “no grant changes” claim and requires Tier 3 review.

5. **E — low: raw high-entropy token in an httpOnly cookie plus unkeyed SHA-256 storage is adequate.**

   A uniformly generated 256-bit token has sufficient preimage resistance that a keyed hash adds no practical protection against offline guessing. SHA-256 is appropriate here; password-hashing or HMAC is unnecessary. The 43-character canonical base64url validation is also appropriate ([design:36](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:36)-[45](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:45)).

   **Required change:** none. Compare fixed-format hash strings exactly and never log token or hash.

6. **F — blocker: the argument can influence the write unless SID derivation is redesigned.**

   Server actions can be invoked with cookie A and arbitrary argument B; the current action already accepts the identifier as an ordinary client-controlled parameter ([actions.ts:85](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:85)-[92](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:92)). V2 intends to reject a mismatch before persistence, but cannot perform that comparison because the token-only cookie contains no SID and no safe SID-resolution operation is specified.

   **Required change:** derive SID from authenticated capability material, not from an argument or an argument-filtered lookup. Put the canonical SID in the httpOnly capability cookie or eliminate the argument and use a separately bound server-side capability record. Test cookie A with argument B and assert no persistence call.

7. **G — medium: omitted threats remain.**

   V2 omits or misstates:

   - Creating submission B in the same browser overwrites submission A’s fixed-name cookie, stranding A’s unused capability. Concurrent creation responses can leave whichever cookie arrives last, independent of creation order.
   - Capability issuance is described as occurring after `createSubmission`; storing the hash therefore requires an additional write that is neither specified nor atomic with creation ([design:36](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:36)-[38](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:38)). Current creation already performs separate person and submission inserts in Supabase ([supabase.ts:165](C:/Users/yerie/m3-memory/src/lib/supabase.ts:165)-[201](C:/Users/yerie/m3-memory/src/lib/supabase.ts:201)).
   - Existing wildcard admin queries expose the capability hash.
   - The threat table overstates admin-review atomicity.

   **Required change:** add these threats and mitigations. Generate token/hash before submission insertion and include hash and expiry in the submission INSERT, avoiding a post-create capability UPDATE. Define fixed-cookie replacement as an availability limitation or adopt per-submission cookie/server-side session handling.

Verified as correct:

- The guarded UPDATE’s field allowlist excludes historical source content, status, review fields, IDs, and timestamps.
- Hash consumption and expiry are in the same atomic statement.
- Exact returned-row validation closes PostgREST’s zero-row-success behavior.
- The proposed service-role helper is narrow and fails closed on missing configuration.
- No anon UPDATE grant or contributor RLS policy is introduced.
- The random-token/hash construction is cryptographically adequate.
- Cookie flags and `/remember` scope are appropriate.
- Service-role bypass remains confined to a purpose-specific server-only path.