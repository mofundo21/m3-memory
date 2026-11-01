You are the independent cross-model security reviewer (Tier 3). Read-only. Do NOT edit files.

Review the DESIGN in docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md against the current code it describes: src/app/remember/actions.ts (media block), src/lib/supabase.ts (uploadSupabaseMedia, insertSupabaseMediaRows), src/lib/db.ts (validateMediaUpload, insertMediaRows, ALLOWED_MIME_TYPES, limits), supabase/schema.sql (media table RLS), and src/app/remember/MediaPicker.tsx (client-side selection).

Assess, with file:line evidence:
1. Is the recommended upload-inside-creation design sound? Any path where an upload occurs for a submission the contributor does not own?
2. Magic-byte validation: is the proposed check sufficient, or can an attacker still store a non-image or a polyglot that a browser would interpret as HTML or script when served from the bucket? Recommend serving headers.
3. Compensation: is the proposed rollback complete? What if the storage delete itself fails? Is the sweep sufficient?
4. Path safety: object keys, name sanitization, overwrite prevention (is upsert really disabled in the current helper?).
5. Metadata: EXIF GPS. Is "reject JPEGs with GPS" implementable reliably? Describe the failure cases (GPS in XMP, in MakerNote, in PNG tEXt, in WebP XMP). State what Option A (re-encoding) would need, without installing anything.
6. Abuse: rate limits. Is the surfaced set of options complete? Recommend the smallest reasonable option.
7. Storage bucket privacy: what must be verified, and what the repo can and cannot prove.
8. RLS and storage policy boundaries: confirm the design adds no policy or grant.
9. Missing threats.
10. Legitimate blockers that must be resolved before implementation.

Output:
- First line: VERDICT: APPROVE FOR IMPLEMENTATION | APPROVE WITH REQUIRED CHANGES | NOT READY
- Numbered findings: severity, evidence, required change.
- Decisions that need the user (list).
- Verified-correct items.
No padding.
