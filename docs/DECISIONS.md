# Decisions

## 2026-09-10: Establish AI infrastructure before application expansion

Decision: Set up shared Claude/Codex instructions, historical-integrity rules, project-specific skills, Graphify context, and cross-review contracts before expanding M3 Memory V0.1.

Reason: The project handles personal memory submissions and future story material, so historical integrity, provenance, and independent review need to shape the system from the start.

## 2026-09-10: Production starts empty

Decision: Production data starts empty. Development uses fictional test records only.

Reason: Avoid contaminating the archive with unreviewed, imported, or AI-generated personal history.

## 2026-09-10: Graphify outputs

Decision: Commit `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, and the small `graphify-out/graph.html` visualization when generated. Keep `graphify-out/cost.json`, `graphify-out/cache/`, `graphify-out/.graphify_python`, and root `.graphify_*.json` extraction intermediates local.

Reason: The graph helps agents avoid rereading the entire repository, while cost/cache files are local operational artifacts.
## 2026-09-10: Keep V0.1 locally testable before Supabase credentials

Decision: Keep the live V0.1 implementation on server-side local SQLite for now, and add a Supabase candidate schema/setup guide without wiring untested credentials.

Reason: The public/private memory workflow can be fully tested locally today. Production storage touches RLS, service-role handling, admin identity, and contributor privacy, so it needs a fresh Supabase project and Tier 3 review before launch.

## 2026-09-10: Add repeatable V0.1 smoke coverage

Decision: Add a no-dependency smoke test that starts the app, submits fictional memories through rendered server-action forms, verifies admin auth boundaries, saves review data, and asserts contributor originals stay unchanged.

Reason: Historical integrity and private admin access need a repeatable check, not just manual verification.


## 2026-09-10: Use Supabase Auth allowlist for production admin

Decision: Production admin access uses Supabase Auth plus the `m3_admins` allowlist. Local SQLite development keeps the password gate for repeatable smoke tests.

Reason: Yeriel needs an actual authenticated admin identity in production, and no arbitrary authenticated Supabase user should become admin by default.

## 2026-09-10: Keep public submissions server-side

Decision: Public contributors submit through the Next.js server path. The browser does not receive direct Supabase table insert/read permissions for archive data.

Reason: Server-side insert with service-role containment is simpler and safer for V0.1 than exposing anonymous insert policies while still preventing listing, reads, updates, deletes, and review access.

## 2026-09-10: Exercise RLS for admin operations

Decision: Supabase admin list/detail/review operations use the authenticated admin JWT, not the service-role key.

Reason: RLS and column-scoped grants should protect contributor originals even if application code sends a bad admin update payload.

## 2026-09-11: Preserve column-scoped review updates in Supabase

Decision: Supabase review updates must not include `reviews.submission_id` in the PATCH body. Inserts include `submission_id`; updates use it only as the row filter and patch mutable review fields.

Reason: The schema intentionally grants authenticated admins update rights only to review fields and status metadata. A real Supabase smoke test caught a 403 when application code tried to patch `submission_id`, proving the column-scoped grant is working and should remain part of the safety model.

## 2026-10-31: Museum Acts 03 and 04 use placeholders until a public-safe archive view exists

Decision: The MOFUNDO museum experience (Acts 03 "People × Places × Sound" and 04 "The Story So Far") renders clearly marked placeholder data from a typed adapter. No real people, encounters, or counters are shown until a public-safe view or API exists.

Reason: The archive tables are default-deny for `anon` under RLS. Exposing approved data publicly requires a Tier 3 review of grants, RLS, and contributor privacy. Placeholders keep the museum buildable without weakening access controls or inventing personal history.

## 2026-10-31: Museum transition targets the real interview start

Decision: The museum's final CTA ("Tell me how we met") links to `/remember/write`, the real beginning of the interview. Route naming is not restructured now.

Reason: `/submit` only redirects to `/remember`. Linking directly to the interview start keeps the transition honest and avoids touching existing routes.

## 2026-10-31: Museum audio is configured, not bundled

Decision: Museum audio is configured in `src/lib/museumAudioConfig.ts` with a placeholder path (`/media/museum-ambient.mp3`). No external track is downloaded or committed. Audio is off by default, never autoplays, and the museum must work with the file absent.

Reason: Yeriel will replace the placeholder with his own MOFUNDO music. Bundling a third-party track would need licensing review and would conflict with that plan.

## 2026-10-31: Museum is one cinematic sequence of four scenes, not an interactive exhibit

Decision: The museum is a guided, scroll-driven sequence with four scenes: 01 YERIEL, 02 MOFUNDO, 03 HOW DO YOU REMEMBER HIM?, 04 JOIN THE STORY. The only controls are ENTER, the persistent sound toggle, and the final TELL ME HOW WE MET → link into `/remember/write`. Clickable constellation nodes, museum labels, act navigation, and the separate Story So Far scene are removed. Archive counters move into Scene 04.

Reason: The goal is a single cinematic journey that ends by inviting contribution. Interactive exploration would split attention from the story and weaken the final call to action.

## 2026-10-31: Museum uses labeled placeholder images

Decision: Until approved photographs exist, the museum uses generated placeholder plates under `public/media/museum/placeholders/`. Each plate says PLACEHOLDER. No faces, real places, or dates are generated.

Reason: Keeps the sequence buildable and reviewable without inventing or fabricating personal imagery.
