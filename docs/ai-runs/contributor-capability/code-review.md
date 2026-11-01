VERDICT: REQUEST CHANGES

1. **High — [actions.ts:53](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:53), [db.ts:271](C:/Users/yerie/m3-memory/src/lib/db.ts:271), [supabase.ts:165](C:/Users/yerie/m3-memory/src/lib/supabase.ts:165)**  
   Failure scenario: implementation reverses the approved issuance sequence. It creates the person/submission before inserting the capability, while v3 requires normalize once → capability insert → persist the same normalized record. If Supabase inserts `persons` but the submission insert fails, `createSubmission` throws before returning `personId`; the action performs no compensation and exposes the internal exception path. SQLite likewise lacks a transaction between person and submission inserts.  
   Minimal fix: expose `normalizeSubmission` and `persistNormalizedSubmission`; normalize once in the action, insert the capability first, then persist that exact record inside the guarded block. Compensate using the already-known SID/person ID on either failure.

2. **High — [actions.ts:53](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:53)**  
   Failure scenario: `createSubmission` is outside every catch. Database/configuration errors therefore escape the server action instead of producing the single fixed public failure. This violates the required error contract and can reveal internal error identifiers through framework error handling.  
   Minimal fix: include creation/issuance in a catch that logs only a category, performs best-effort compensation, and returns the fixed contributor-facing message through one controlled path.

3. **Medium — [contributorCapability.ts:25](C:/Users/yerie/m3-memory/src/lib/contributorCapability.ts:25), [contributorCapability.ts:117](C:/Users/yerie/m3-memory/src/lib/contributorCapability.ts:117)**  
   Failure scenario: the approved design permits only `anonymous` or `custom`, but the implementation also accepts `first_name` and `full_name`. A crafted form can persist values outside the specified value allowlist.  
   Minimal fix: reduce `ATTRIBUTION_CHOICES` to `anonymous` and `custom`, or formally revise and re-review the design/schema contract before retaining the extra values.

4. **Medium — [contributorCapability.ts:48](C:/Users/yerie/m3-memory/src/lib/contributorCapability.ts:48), [actions.ts:130](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:130)**  
   Failure scenario: deletion supplies `maxAge: 0` but no explicitly expired `expires` value, contrary to the approved cookie-clearing requirements. Tests inspect the options object rather than the emitted `Set-Cookie`, so they do not prove the browser receives all required deletion attributes.  
   Minimal fix: add an expired date when clearing while retaining identical name, path, HttpOnly, SameSite and Secure settings; assert the actual emitted header.

5. **Medium — [schema.sql:241](C:/Users/yerie/m3-memory/supabase/schema.sql:241)**  
   Failure scenario: cleanup is defined but not scheduled; the comment still says “open decision: scheduler.” The design makes periodic cleanup mandatory before public launch, particularly for orphan person records containing contact information.  
   Minimal fix: provision and document the scheduled invocation before launch, with an operational test or deployment check.

6. **Low — [schema.sql:257](C:/Users/yerie/m3-memory/supabase/schema.sql:257), [db.ts:670](C:/Users/yerie/m3-memory/src/lib/db.ts:670), [supabase.ts:416](C:/Users/yerie/m3-memory/src/lib/supabase.ts:416)**  
   Failure scenario: cleanup deletes every unreferenced person older than two hours, not specifically contributor-flow orphans; direct compensation also deletes the supplied person without an explicit “no remaining submission references it” predicate. Foreign keys protect Supabase’s direct path, but SQLite may not consistently enforce them, and future legitimate standalone-person uses could be removed.  
   Minimal fix: add `NOT EXISTS` guards to compensation and record enough provenance to target contributor-creation orphans specifically.

Verified correct:

- Cookie A cannot modify submission B: SID equality is checked before persistence, and only the parsed cookie SID reaches database predicates.
- Consume-first replay protection is atomic in SQLite and Supabase; concurrent requests cannot both consume one row.
- Both save implementations require `status = 'UNREVIEWED'`; reviewed submissions cannot be changed.
- Save bodies/statements contain exactly the four preference columns—no status, review fields, or `original_json`.
- Tokens use 32 CSPRNG bytes, base64url encoding and SHA-256 storage; no raw-token logging or database storage found.
- Cookie names require canonical UUIDs; issuance attributes are HttpOnly, Strict, `/remember`, production-secure, and two-hour lifetime.
- Supabase filters use `encodeURIComponent`; no PostgREST filter injection found.
- Capability-table RLS is enabled with no policy or application-role grant.
- Service-role configuration is server-only. The four new functions use it narrowly; other references are pre-existing submission, upload, and admin-media uses.
- Cleanup’s two-hour comparison and `NOT EXISTS` submission check prevent deletion of a currently referenced person.
- Supabase request-shape tests passed; TypeScript typecheck passed. SQLite capability tests could not run because the read-only environment denied temporary-directory creation.