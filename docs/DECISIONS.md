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
