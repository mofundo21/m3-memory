# MOFUNDO Museum: Checkpoint (Round 3: capability implemented, real-portrait experiment built, STOP for visual review)

Date: 2026-10-31
Repo: `C:\Users\yerie\m3-memory` · branch `master` · **nothing committed**. Commit only after the open reviews below are resolved and the user asks.
Read first in a new session: `CLAUDE.md`, `AGENTS.md`, then this file.

## Part 1: Contributor write capability (implemented)

- Final Tier 3 review of design v3: **PASS WITH REQUIRED CHANGES**, no unresolved blocker (`docs/ai-runs/contributor-capability/codex-review-final.md`). The required changes were applied: named randomness (`randomBytes(32)`, unpadded base64url), a named store boundary, the cleanup mechanism, and the accepted timing side channel.
- Implementation: `src/lib/contributorCapability.ts` (server-only), store functions in `src/lib/db.ts` (SQLite) and `src/lib/supabase.ts` (service role, narrow), `src/app/remember/actions.ts` (issue after persistence, redeem on save), `supabase/schema.sql` (new table, RLS on, no policies, all grants revoked, cleanup function executable by no application role).
- Deviation from design v3, recorded here: the capability row is inserted **after** the submission persists (not before). Both orders fail closed; the reviewer accepted the cookie-after-persistence ordering.
- Tests: `scripts/contributor-capability-tests.mjs` (token, cookie shape, binding, allowlist, consume-once, status gate, expiry, compensation); `scripts/contributor-capability-supabase-tests.mjs` (request shapes against a fake fetch: filters, service key only, four-column body, zero/two/wrong-row failures, injection, fail-closed, schema text); `scripts/v01-smoke-test.mjs` (cookie HttpOnly, path `/remember`, SameSite=Strict, cleared after save, all capability rows consumed).
- **Not verified:** the SQL has not been run on a real Postgres here. The tests check its text and the request shapes only. The Supabase cleanup function is not scheduled (open decision).

## Part 2: Contributor media upload (designed, not implemented)

- Design: `docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md`. Recommendation: upload inside the creation request, with validation before any write, server-side magic-byte checks, server-generated object keys, and compensation on failure. No separate client-callable media endpoint.
- **Still a production blocker:** `insertMediaRows` needs an admin token, so contributor media fails in Supabase mode. Not fixed in this round.
- Open decisions: metadata stripping (EXIF GPS is currently kept; needs an image library, which needs your approval), abuse limits, the cleanup scheduler.
- The media design has **not** had a cross-model review.

## Part 3: Real-portrait cinematic experiment (built, failed the visual bar)

- Portraits: four JPEGs copied from `C:\Users\yerie\m3-memory-archive\M3 PICTURES` into `public/media/museum/portraits/portrait-01..04.jpg` (768×1024, 340 KB total). Not altered. Status `pending-approval`: they are not yet approved for public release.
- **Label mismatch to check:** the files are named by timestamp, and their content does not clearly match the labels given (graduation, blond, platinum, ornate red). The order used is 01→04 as supplied, as art-direction order only. No dates, years, or biography are attached.
- Spatial world: `WORLD_DEPTH_KEYFRAMES` and `WORLD_PLATES` in `src/lib/museumConfig.ts`. The timeline evaluator derives `world` (camera depth, plate opacity from reveal and pass-through, fog, dust) in `src/lib/museumTimeline.ts`. The renderer (`src/components/museum/MuseumWebGL.tsx`) reads only that frame.
- Camera: travels along −Z through planes at real depths. Plates fade in on reveal and fade out as the camera passes them. The fragment is a crop of portrait 01 that the camera passes, the only element that carries from YERIEL.
- Shader dissolve removed. The change is spatial. Fixed-pixel dust, up to 300 on desktop and 120 on phone.
- The opt-in `?cinematic=1` is still required. The default page stays DOM-only.

### Visual verdict: **FAIL**

Frames: `docs/ai-runs/museum-webgl/qa/` (desktop 0.02 to 0.46, mobile 0.10, 0.30, 0.44).

- The photographs are much stronger than the placeholders. At 0.10 the YERIEL crop sits in front of the portrait, and there is real layering.
- It still reads as a sequence of near-frontal photo close-ups, each filling the frame. At 0.31 the grey backdrop of portrait 02 fills the right half and reads as a wall, not as a space. At 0.38 and 0.46 one photograph fills the screen under the DOM text.
- The plates sit on almost the same vertical axis, so there is little lateral arrangement. Fog barely separates depths.
- Mobile at 0.30 is a face close-up. There is no visible sense of passing the image.

**Primary reason:** camera language and composition. Plates are sized to fill the frame at their depths, and the camera arrives head-on at each one. Secondary: photographic treatment (backdrops are not separated from subjects) and scroll distance (each photo gets only a short arrival window).

**Smallest next experiment:** a composition test, not more tuning. Scale plates to about 40–60% of the frame at their nearest point, spread them in X and Y along a diagonal, so the camera travels between them and never sits in one. Add a stronger fog ramp and a deeper span (about −30). Test a single camera pass-through of one foreground plate. Judge the result on frames before adding any shader.

## Measurements

- Initial `/museum` JavaScript: **180.5 KB gzip** (baseline before this round 178.4; the tier and loader code add about 2 KB).
- Lazy renderer chunk: **238.8 KB gzip**, under the 250 KB budget.
- Portrait files: 340 KB total. Decoded, about 12.6 MB of GPU memory (about 17 MB with mipmaps). Crop clones share the source texture.
- Real-device frame timing: **not measured.** Headless Chrome uses software GL (SwiftShader), so timings would not represent a GPU. Mobile GPU measurement is still open.
- DOM visitors download no renderer: enforced by `scripts/museum-webgl-test.mjs` (content check for renderer code in chunks).

## Tests

`npm test` exits 0 (build plus 8 stages): Supabase unit and RLS, capability Supabase request shapes, capability unit, interview smoke (with cookie and consume checks), timeline (with world checks), tier, museum DOM smoke, WebGL browser (default DOM, opt-in canvas, reduced motion, no-WebGL, context loss, phone overflow). Typecheck clean.

## Open reviews and decisions

1. **Code review of this round:** not run. Required before commit (project rule for material changes). The timeline, renderer, name capture, and capability implementation all need it.
2. **Media design review:** not run (Tier 3).
3. **Disputed review findings from last round:** reduced-motion fade timing and the pending label. Both match the pre-extraction behavior, which is locked by test. Your call.
4. **Portrait approval:** the four photos are for the prototype. Public release needs your approval, and the real order and identities need confirming.
5. **Supabase:** run `supabase/schema.sql` against the project to create the new table and cleanup function (not run here). Then schedule the cleanup.
6. **Media:** approve the metadata-stripping option, and decide on the abuse-limit and cleanup scheduler.

## Key files

- Capability: `src/lib/contributorCapability.ts` (new), `src/lib/db.ts`, `src/lib/supabase.ts`, `src/app/remember/actions.ts`, `supabase/schema.sql`
- Design and reviews: `docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md`, `docs/MUSEUM_CONTRIBUTOR_MEDIA_DESIGN.md`, `docs/ai-runs/contributor-capability/`
- Timeline and world: `src/lib/museumTimeline.ts`, `src/lib/museumConfig.ts`, `src/lib/museumAssets.ts`
- Renderer: `src/components/museum/MuseumWebGL.tsx`, `src/lib/museumCapability.ts`
- Tests: `scripts/contributor-capability-tests.mjs`, `scripts/contributor-capability-supabase-tests.mjs`, `scripts/museum-timeline-tests.mjs`, `scripts/museum-capability-tests.mjs`, `scripts/museum-webgl-test.mjs`, `scripts/v01-smoke-test.mjs`
- QA: `docs/ai-runs/museum-webgl/qa/` (current), `docs/ai-runs/museum-webgl/qa-v1-placeholder/` (previous round)

## How to resume

```bash
cd /c/Users/yerie/m3-memory
npm test
MUSEUM_WEBGL_SHOTS=docs/ai-runs/museum-webgl/qa node scripts/museum-webgl-test.mjs   # regenerate the frames
```
