# Architecture

M3 Memory is a mobile-first Next.js, React, and TypeScript application.

V0.1 is locally testable with server-side SQLite storage. Production storage is not yet wired; Supabase/PostgreSQL remains the intended candidate once Yeriel creates a fresh empty project and provides credentials.

## Current V0.1 Routes

Public:

- `/`: personal introduction and Share a Memory action.
- `/remember`: anonymous memory submission.
- `/thanks`: generic confirmation with no submission ID or contributor data.
- `/submit` and `/submit/thanks`: legacy redirects to `/remember` and `/thanks`.

Private:

- `/admin`: redirects to `/admin/submissions`.
- `/admin/login`: password-gated admin entry.
- `/admin/submissions`: protected private inbox.
- `/admin/submissions/[id]`: protected original + review detail.

## Current Local Persistence

Local development storage uses Node's built-in SQLite support through `src/lib/db.ts`.

Tables:

- `persons`: contributor name/contact metadata.
- `submissions`: immutable contributor source record in `original_json`, searchable preview/status/date/location metadata.
- `reviews`: Yeriel review layer, one row per submission.
- `media`: reserved for future secure uploads.
- `artifacts`: reserved for future artifact notes.
- `story_drafts`: reserved for future AI/story work.

The application writes contributor originals only during submission creation. Review saves update the separate `reviews` row and status metadata, not `submissions.original_json`.

## Security Requirements

Anonymous users can submit.

Anonymous users cannot:

- enumerate submissions
- retrieve other submissions
- retrieve media belonging to other submissions unless explicitly public
- see admin metadata
- see Yeriel review data
- modify source submissions

Admin access is currently protected by a server-side password session cookie. Production requires explicit `ADMIN_PASSWORD` and `SESSION_SECRET`; local development has fallback values only outside production.

Production storage must use database-level authorization where supported. Never expose service-role credentials in browser code.

Validate uploads, request sizes, file types, and all trust-boundary inputs before enabling media.

## Supabase Candidate

Candidate SQL lives in `supabase/schema.sql`; setup instructions live in `docs/setup/SUPABASE.md`.

The candidate schema:

- starts empty
- keeps contributor originals and Yeriel reviews separate
- enables RLS on archive tables
- revokes default `anon` and `authenticated` table grants
- expects public submission/admin operations to remain server-side

Do not claim Supabase integration works until a real project is configured and tested.

## Application Code

Application code currently lives under `src/`.

Project AI infrastructure lives under:

- `docs/`
- `skills/`
- `scripts/`
- `config/`
- `.agents/`
- `.claude/`
