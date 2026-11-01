VERDICT: APPROVE WITH REQUIRED CHANGES

1. **CRITICAL — Compensation is incomplete and unsafe under concurrent upload failure.**  
   Evidence: the design requires deleting uploaded objects and related rows on failure, but treats failed compensation as an accepted residual risk and relies on an orphan-object sweep ([design:34-35](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:34), [design:54](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:54)). Current uploads use `Promise.all` ([actions.ts:85](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:85)); if one upload rejects, successful object paths may never be returned to the caller, while other requests can still finish. The proposed sweep only addresses objects without media rows, not residual media rows, capability rows, submissions, or people left by failed deletion. Current database compensation stops at the first failed request ([supabase.ts:410](C:/Users/yerie/m3-memory/src/lib/supabase.ts:410)).  
   Required change: specify sequential uploads or `Promise.allSettled` with every generated key recorded before upload. Compensation must attempt every cleanup independently, record failures without identifiers or secrets, and be idempotent. The sweep must reconcile both directions: orphan objects and media rows whose objects/submissions are missing. Failed submission/person/capability cleanup needs a separate age-guarded database reconciliation or operational retry queue. Do not call this risk fully handled merely because an object sweep exists.

2. **HIGH — Magic-byte checks alone do not establish that content is a safe image.**  
   Evidence: current validation trusts `file.type` ([db.ts:539-551](C:/Users/yerie/m3-memory/src/lib/db.ts:539)); the design adds only short signatures for JPEG, PNG, and WebP ([design:27](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:27), [design:70](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:70)). An attacker can prepend a valid signature, construct malformed containers, append arbitrary HTML/script, or create a valid image/polyglot. Signature checks also do not safely establish dimensions.  
   Required change: treat signatures as preliminary format detection, not sanitization. Parse the complete container with strict bounds and reject malformed/truncated files, impossible chunk lengths, trailing content where practical, excessive dimensions, excessive decoded pixels, and unsupported animated/multiframe forms. The robust boundary is full decode followed by fresh re-encoding.

3. **HIGH — Serving controls are mandatory even after validation.**  
   Evidence: the existing admin route serves the database MIME type inline and lacks `X-Content-Type-Options` ([route.ts:58-63](C:/Users/yerie/m3-memory/src/app/admin/media/%5BmediaId%5D/route.ts:58)). Current upload does not send the supplied `contentType` at all ([supabase.ts:300-310](C:/Users/yerie/m3-memory/src/lib/supabase.ts:300)).  
   Required change: every delivery path, including signed/direct bucket URLs, must return the server-verified `Content-Type`, `X-Content-Type-Options: nosniff`, and preferably `Content-Disposition: attachment`. If inline viewing is required, use a fixed sanitized filename, restrictive `Content-Security-Policy: default-src 'none'; sandbox`, and an isolated origin where feasible. Never derive response type from stored client metadata. Set storage object metadata to the verified type during upload.

4. **HIGH — “Reject JPEGs with GPS” is not a reliable privacy guarantee.**  
   Evidence: the design acknowledges that Option B can miss metadata ([design:77](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:77)). A conventional EXIF GPS IFD detector can miss malformed or duplicated APP1 segments, XMP GPS fields, vendor MakerNote location data, embedded thumbnails, and nonstandard byte ordering. Location or identifying data can also appear in PNG `tEXt`/`zTXt`/`iTXt`/eXIf chunks and WebP EXIF/XMP chunks.  
   Required change: Option B must be described as best-effort rejection, not metadata removal or a privacy guarantee. Option A must fully decode pixels, enforce encoded-byte and decoded-pixel limits before/during decoding, discard all source metadata/profiles/thumbnails/comments, and encode a fresh JPEG/PNG/WebP with only explicitly generated metadata. Verify the output by parsing it again. Decide how animation, orientation, color profiles, transparency, and decode failures are handled.

5. **HIGH — Bucket privacy cannot be established from this repository.**  
   Evidence: `submission-media` is absent from the schema, which the design correctly notes ([design:19](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:19)). The repository proves only that table RLS is enabled and media reads are admin-only ([schema.sql:132-146](C:/Users/yerie/m3-memory/supabase/schema.sql:132), [schema.sql:214-221](C:/Users/yerie/m3-memory/supabase/schema.sql:214)).  
   Required change: before implementation/launch, verify in the deployed Supabase project that the bucket is private; public URLs fail; anon and ordinary authenticated users cannot select, upload, update, move, copy, or delete relevant `storage.objects`; no broad policy covers the bucket; signed URLs are short-lived; and service-role access remains server-only. Record project/environment, verifier, date, and results. The repo cannot prove dashboard configuration, deployed migrations, inherited storage policies, leaked signed URLs, CDN caching, or service-key handling outside this code.

6. **MEDIUM — Upload-inside-creation is sound only with strict request-local binding.**  
   Evidence: the action creates the submission itself before processing media and does not accept a submission ID from the client ([actions.ts:20-53](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:20), [actions.ts:72-104](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:72)). The design similarly derives one SID inside the creation request ([design:42-52](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:42)). Under that constraint, no path uploads to a pre-existing submission the contributor does not own.  
   Required change: make the helper accept a server-created submission context, not an arbitrary client-derived SID. Validate the canonical UUID and require every media row’s `submission_id` and object prefix to match the same request-local SID. Do not expose the service-role helper through another action/route. Add the cross-submission negative test already proposed at [design:89](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:89).

7. **MEDIUM — Path safety improves materially, but overwrite behavior needs an explicit contract and test.**  
   Evidence: current keys retain a sanitized client filename ([supabase.ts:300-345](C:/Users/yerie/m3-memory/src/lib/supabase.ts:300)); the proposed UUID plus verified extension removes traversal/name ambiguity ([design:51](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:51), [design:73](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:73)). Current upload sends a normal `POST` and no upsert directive ([supabase.ts:306-310](C:/Users/yerie/m3-memory/src/lib/supabase.ts:306)); therefore upsert is not enabled in the current helper, but this is implicit rather than asserted.  
   Required change: keep client names out of object keys, validate SID format, use a fixed bucket/prefix, and length-cap cleaned display names. Explicitly document the storage API’s create-only semantics and test that uploading twice to an identical forced key returns conflict and preserves the first object. Treat any successful overwrite response as a failure.

8. **MEDIUM — Abuse mitigation options are incomplete; an explicit launch control is required.**  
   Evidence: the design leaves unauthenticated volume abuse open ([design:37](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:37), [design:78](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:78)). Client restrictions are advisory only ([MediaPicker.tsx:19-20](C:/Users/yerie/m3-memory/src/app/remember/MediaPicker.tsx:19), [MediaPicker.tsx:44-53](C:/Users/yerie/m3-memory/src/app/remember/MediaPicker.tsx:44)). Missing options include edge request/body-size enforcement, application or database token buckets, global daily storage budgets, CAPTCHA/challenge escalation, and operational alerts/circuit breakers.  
   Required change: the smallest reasonable production option is an edge-enforced per-IP limit on the creation endpoint, combined with a hard request-body limit and the proposed 20 MB aggregate file limit. Add a conservative global rate/storage alert. IP limiting is imperfect behind NAT/VPNs but is substantially smaller than introducing a new application capability system. Prototype acceptance must be explicitly environment-limited and must not silently carry into production.

9. **MEDIUM — Decode and resource-exhaustion threats need explicit controls.**  
   Evidence: the design proposes 8 MB/file, 20 MB/request, and 8000-pixel dimensions ([design:69-72](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:69)), but dimensions alone do not cap total decoded pixels, frame count, CPU, or memory. Current code reads all files into memory and uploads them concurrently ([actions.ts:85-102](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:85)).  
   Required change: cap width × height, frame count, decode time, decoder memory/concurrency, and total request body at the platform boundary. Avoid holding five full encoded and decoded images concurrently. Reject malformed chunk lengths and decompression bombs.

10. **MEDIUM — Metadata and response filenames need separate sanitization rules.**  
    Evidence: the design limits stored names and removes control characters ([design:29](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:29)), while the existing response interpolates `media.file_name` into `Content-Disposition` ([route.ts:61](C:/Users/yerie/m3-memory/src/app/admin/media/%5BmediaId%5D/route.ts:61)).  
    Required change: normalize and cap the stored display value, but independently generate a safe response filename containing no CR/LF, quotes, slashes, bidi controls, or ambiguous extension. Prefer a server-generated filename for delivery.

11. **MEDIUM — Missing operational threats.**  
    Evidence: the current/design scope focuses on file format, paths, and orphan cleanup.  
    Required change: add requirements for malware/content moderation expectations, retention/deletion policy, backup deletion behavior, administrator download risk, logging without personal filenames/content, signed-URL leakage and referrer exposure, cache invalidation, sweep authorization and auditability, object integrity verification, and handling a submission that succeeds but the final redirect/cookie delivery fails. Clarify that “private unless Media Consent” in the UI ([MediaPicker.tsx:53](C:/Users/yerie/m3-memory/src/app/remember/MediaPicker.tsx:53)) does not mean consent makes the bucket public.

12. **LOW — RLS and grant boundary is correctly designed.**  
    Evidence: the design adds no policy or grant and uses the service role ([design:60-65](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md:60)). Current schema revokes media access, enables RLS, and grants only admin-authenticated SELECT through policy ([schema.sql:136-145](C:/Users/yerie/m3-memory/supabase/schema.sql:136), [schema.sql:214-221](C:/Users/yerie/m3-memory/supabase/schema.sql:214)).  
    Required change: retain the proposed test asserting no policy/grant diff. Review the new helper to ensure fixed columns, verified SID/key binding, and no caller-supplied bearer token.

## Decisions that need the user

1. Approve robust full decode/re-encoding with a maintained image library, or explicitly accept that Option B cannot guarantee removal/detection of location metadata.
2. Decide whether inline admin viewing is necessary; otherwise require attachment delivery.
3. Choose the production edge/WAF provider and concrete rate/body-size limits.
4. Choose the scheduler and ownership/alerting for reconciliation jobs.
5. Set retention periods for orphan objects, failed creations, uploaded originals, logs, backups, and signed URLs.
6. Decide whether animated images are rejected or normalized to a single frame.
7. Decide whether production launch is blocked until deployed bucket-policy evidence is recorded. Recommendation: yes.

## Verified-correct items

- Keeping uploads inside the original creation action avoids a second contributor write surface.
- The current failure is real: contributor code calls an admin-token-required insert without a token ([db.ts:554-557](C:/Users/yerie/m3-memory/src/lib/db.ts:554)).
- The proposed UUID-plus-verified-extension key is safer than the current client-name-derived key.
- Current storage upload does not enable upsert explicitly.
- Count and per-file checks exist server-side today, although they run too late and trust client MIME.
- The proposed pre-write validation and aggregate byte limit are correct.
- The design correctly keeps media table RLS admin-read-only and proposes no new grant or policy.
- The repository correctly does not claim it can prove deployed bucket privacy.
- No files were modified.