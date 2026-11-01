# Contributor Media Upload: Security Design (Tier 3, separate from the preference capability)

Status: **Design only. Not implemented. Needs its own cross-model review before implementation.**
Problem: in Supabase mode a contributor's media upload fails. `submitMemoryAction` uploads each file with the service role (`uploadSupabaseMedia`, `src/lib/supabase.ts`), but then calls `insertMediaRows` (`src/lib/db.ts:539`), which requires an admin token. The action catches the error and redirects to `/remember/details?error=media`. The submission already exists, so the contributor either loses the media or resubmits and creates a duplicate.

## 1. Current code facts (verified in this repo)

| Fact | Where |
|---|---|
| Uploads run after `createSubmission` | `src/app/remember/actions.ts` (media block after `createSubmission`) |
| Storage upload uses the service-role key | `uploadSupabaseMedia`, `src/lib/supabase.ts` |
| Object path is `submissions/<sid>/<uuid>-<sanitized name>` | same |
| Media row insert requires an admin token | `insertMediaRows` → `insertSupabaseMediaRows` (`src/lib/db.ts:539`, `src/lib/supabase.ts`) |
| Allowed MIME types come from the browser's `file.type` | `ALLOWED_MIME_TYPES` in `src/lib/db.ts:516` |
| No magic-byte (content) check | none |
| Limits: 8 MB per file, 5 files | `src/lib/db.ts:514-515` |
| Validation runs after the submission exists | `validateMediaUpload` is called inside the media block |
| EXIF is not stripped | none in the code |
| Storage bucket `submission-media` is not defined in `supabase/schema.sql` | its visibility and policies are set outside the repo and cannot be verified here |
| `media` table: RLS on, admin-read only, no anon or authenticated write | `supabase/schema.sql` |

## 2. Threats

| Threat | Current exposure | Mitigation in this design |
|---|---|---|
| Media row insert fails for contributors | **Certain** (admin token required) | Insert under the service role, inside the same server action as the upload, with no client-callable endpoint |
| Spoofed MIME type (e.g. HTML sent as `image/jpeg`) | Possible: MIME comes from the client | Server checks magic bytes (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF....WEBP`) and rejects mismatches |
| Oversized or many files (storage cost, memory) | Limited by 8 MB and 5 files, checked after the submission is created | Check size and count **before** creating anything; also cap total bytes per request |
| Path traversal or name injection | Low: UUID prefix plus sanitized name | Storage key uses only server-generated UUID plus a fixed extension derived from the verified type. The client file name is stored as metadata only, length-capped and stripped of control characters |
| Overwriting existing objects | Low: UUID names | Upload without upsert. A conflict is an error, not an overwrite |
| Cross-submission access | Path contains `sid`; rows keyed by `submission_id` | Object key is built from the verified SID only (§3). No read path for contributors |
| Malicious image metadata: GPS coordinates, device serials, embedded thumbnails | **Real privacy exposure**; EXIF is kept | Strip metadata by re-encoding the image on the server. Requires an image library (**needs approval**; see §6). Until then, reject JPEGs that contain an EXIF APP1 GPS tag |
| Polyglot files (valid image plus appended script) | Low when served as `image/*` with `nosniff` | Re-encoding (§6) removes appended data. Serve only with the verified type and `X-Content-Type-Options: nosniff` |
| Abandoned uploads (objects with no row) | **Exists**: upload succeeds, row insert fails | Compensating delete of uploaded objects on any later failure. A periodic sweep deletes objects under `submissions/` that have no `media` row after 24 h |
| Partial creation (submission exists, media not) | **Exists** | Validate everything first; then create submission, then capability, then upload and insert media. On any failure after creation, compensate: delete objects, media rows, the capability row, the person row, and the submission row |
| Metadata altered after upload | None possible today | Contributors have no path to change media rows or objects. Only admins read them. Changes would need a new Tier 3 review |
| Abuse: unauthenticated upload volume | **Exists**: any visitor can create submissions with media | Per-IP and per-hour limits need infrastructure (edge or WAF); the app has none. **Documented as an open risk; not solved by this design** |
| Storage visibility | Unknown from repo | Bucket must be private (no public read). Admin reads through short-lived signed URLs generated server-side. **Verify the bucket setting in the Supabase dashboard before launch** |

## 3. Recommended design

Upload happens **inside the creation request**, not as a separate client-callable step. This adds no new public write path.

Order inside `submitMemoryAction`:

1. Parse the form and read the files.
2. **Validate everything first, with no database writes:** count, per-file size, total size, magic bytes, and EXIF GPS presence (or re-encoding, if approved). Reject with the generic public error.
3. Normalize the submission record once, generate the SID, generate the capability token, and insert the capability row (§ capability design).
4. Insert the submission and person rows (service role).
5. Set the capability cookie.
6. For each file: write the object under `submissions/<sid>/<uuid>.<ext>` using the verified type's extension, with upsert disabled.
7. Insert all `media` rows in one service-role insert, keyed by the same SID.
8. On success, redirect to `/remember/final`.
9. On any failure at steps 3–7, compensate: delete uploaded objects, delete media rows, delete the capability row, delete the person and submission rows (best effort), clear the cookie, and redirect to `/remember/details?error=media` with the generic message. If a compensation step fails, record an **accepted residual risk** and rely on the sweep (below).

Why not a separate media endpoint with the capability: it would add a second authenticated write surface, and it would need its own consume step. Keeping upload inside the creation request needs no new surface, and the existing creation path is already reviewed for binding.

Why not Option B (a shared capability for both preferences and media): one token would then authorize two different writes. A leaked token would reach more than preference fields. Keep them separate.

## 4. Schema and privileges

- No new policy and no new grant. `media` remains admin-read only. Inserts use the service role.
- Bucket `submission-media`: must be **private**. No anon or authenticated policy on `storage.objects` for this bucket. Verify in the dashboard, and record the result in `docs/MUSEUM_CHECKPOINT.md`.
- The service-role key is referenced only in server-only helpers in `src/lib/supabase.ts`.
- Two new helpers only: `insertContributorMediaRows` (service role, fixed columns) and `deleteSubmissionObjects` (service role, prefix limited to `submissions/<verified sid>/`).

## 5. Validation rules (server side)

- Count: at most 5 files. Total bytes: at most 20 MB. Per file: at most 8 MB.
- Type: detect from magic bytes. Accept JPEG, PNG, WebP. Ignore the client's `file.type` except as a mismatch check. Reject if they disagree.
- Dimensions: reject if width or height exceeds 8000 px, to limit decode cost.
- Metadata: strip or reject EXIF GPS tags. Stored `file_name`: at most 120 characters, control characters removed, used only for display in admin.
- Object key: `submissions/<sid>/<uuid>.<ext>`, where `ext` comes from the verified type.

## 6. Open decisions (need the user's answer)

1. **Metadata stripping.** Option A: add an image library (for example `sharp`) to re-encode uploads. This removes EXIF and any appended data, and it is the robust choice. It is a new dependency and needs your approval. Option B: no new dependency. Reject any JPEG with a GPS EXIF tag and ask the contributor to remove location data. Option B is weaker, because metadata can be missed.
2. **Abuse limits.** Accept the open risk for the prototype, or put rate limits at the hosting edge before launch.
3. **Sweep job.** A scheduled cleanup for orphan objects and capability rows needs a scheduler. Choose the platform.

## 7. Tests (before merge)

- Magic-byte mismatch is rejected (for example, HTML named `.jpg` with `image/jpeg`).
- Oversize, too many files, and too many total bytes are rejected before any database write.
- EXIF GPS JPEG is rejected (Option B) or re-encoded without GPS (Option A).
- Object key contains only the server UUID and the verified extension; a file name with `../` produces a safe key.
- Upload is not done with upsert; a key collision fails.
- Compensation: a failure in media-row insert deletes uploaded objects and the submission, person, and capability rows.
- Cross-submission: a media row for submission A cannot be created with a key under submission B's prefix.
- Storage and RLS: `supabase/schema.sql` diff adds nothing to grants or policies.

## 8. Relationship to the preference capability

Both designs keep the same boundary: the contributor gets no general write access, and the server validates each write against a single submission. They stay separate. A combined capability would widen what one token can do, so media upload gets no preference-capability token.

## 9. Review v1 (cross-model, read-only): APPROVE WITH REQUIRED CHANGES

Recorded in `docs/ai-runs/media-design/review.md`. Implementation stays blocked until these are reflected in this design and the user has made the decisions in §10.

Required changes:

1. **Compensation.** Uploads run sequentially, or with `Promise.allSettled`, and every generated key is written to an in-memory ledger before its upload is attempted. Cleanup attempts every ledger entry independently, is idempotent, and logs only a category. Reconciliation runs in both directions: orphan objects with no media row, and media rows whose object is missing. Failed submission, person, and capability cleanup needs an age-guarded reconciliation job, not only an object sweep.
2. **Content validation is not sanitization.** Signature checks are format detection only. The required boundary is a full decode followed by a fresh re-encode, with strict limits: encoded bytes, width times height, frame count, decode time, and decoder concurrency. Reject malformed or truncated containers, impossible chunk lengths, and decompression bombs.
3. **Serving.** Every delivery path returns the server-verified `Content-Type`, `X-Content-Type-Options: nosniff`, and `Content-Disposition: attachment` by default. Inline viewing needs a sanitized fixed filename, `Content-Security-Policy: default-src 'none'; sandbox`, and ideally a separate origin. Stored client metadata never sets the response type. The upload also sends the verified type as object metadata.
4. **Metadata.** "Reject JPEGs with GPS" is best-effort detection only, and must be described that way. It does not guarantee removal. Option A (re-encode) is the only option that removes metadata. It needs a maintained image library, which needs your approval.
5. **Bucket privacy** cannot be established from this repository. Before launch, verify in the deployed Supabase project: the bucket is private, public URLs fail, anon and ordinary authenticated users cannot select, insert, update, move, copy, or delete relevant `storage.objects`, no broad policy covers the bucket, signed URLs are short-lived, and the service key stays server-only. Record project, environment, verifier, date, and results.
6. **Request-local binding.** The media helper accepts a server-created submission context only, never a client-supplied SID. Every media row's `submission_id` and object prefix must match that one SID. The service-role helper is not exposed through another action or route.
7. **Overwrite.** Keys are create-only. A test uploads twice to an identical forced key and expects a conflict, with the first object preserved. Any successful overwrite response counts as a failure.
8. **Abuse.** Client-side limits are advisory only. The smallest reasonable production control is an edge-enforced per-IP limit on the creation endpoint, a hard request-body limit, the 20 MB aggregate cap, and a conservative global storage alert. Prototype acceptance is limited to that environment and does not carry into production silently.
9. **Resource limits.** Cap total decoded pixels, frame count, decode time, and concurrent decodes. Do not hold five full images in memory at once.
10. **Filenames.** Stored display names are normalized and capped. Response filenames are generated by the server and contain no CR, LF, quotes, slashes, bidi controls, or ambiguous extensions.
11. **Operational threats.** Add requirements for moderation expectations, retention and deletion (including backups), administrator download risk, logging without personal filenames or content, signed-URL leakage and referrers, cache invalidation, sweep authorization and audit, integrity verification, and a submission that succeeds while the final redirect or cookie delivery fails. "Private unless Media Consent" in the UI does not make the bucket public.
12. **RLS and grants.** Keep the proposed no-policy, no-grant test. Review the new helper for fixed columns, verified SID-to-key binding, and no caller-supplied bearer token.

## 10. Decisions needed from the user before implementation

1. Metadata: approve a maintained image library for full decode and re-encode (Option A), or accept best-effort rejection only (Option B, not a privacy guarantee). Recommendation: Option A.
2. Viewing: is inline admin viewing needed? If not, attachment-only delivery. Recommendation: attachment-only.
3. Edge provider and concrete limits (per-IP rate, body size, daily storage budget). Recommendation: an edge per-IP limit on the creation endpoint, with a 20 MB request cap and a global storage alert.
4. Scheduler and owner for the reconciliation and cleanup jobs, with alerting.
5. Retention periods: orphan objects, failed creations, originals, logs, backups, and signed URLs.
6. Animated images: reject, or normalize to a single frame. Recommendation: reject.
7. Launch gate: block production until deployed bucket-policy evidence is recorded. Recommendation: yes.
