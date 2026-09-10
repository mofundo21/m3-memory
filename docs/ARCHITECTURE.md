# Architecture

M3 Memory is a mobile-first Next.js, React, and TypeScript application.

V0.1 is locally testable with server-side SQLite storage and now has a production-capable Supabase persistence path. Supabase must be applied to a fresh empty project and verified with real credentials before launch.

## Current V0.1 Routes

Public:

- `/`: personal introduction and Share a Memory action.
- `/remember`: anonymous memory submission.
- `/thanks`: generic confirmation with no submission ID or contributor data.
- `/submit` and `/submit/thanks`: legacy redirects to `/remember` and `/thanks`.

Private:

- `/admin`: redirects to `/admin/submissions`.
- `/admin/login`: local password gate in SQLite mode, Supabase Auth email/password in production mode.
- `/admin/submissions`: protected private inbox.
- `/admin/submissions/[id]`: protected original + review detail.

## Persistence Modes

The route-facing persistence API lives in `src/lib/db.ts`:

- `createSubmission()`
- `listSubmissions()`
- `getSubmission()`
- `upsertReview()`

`M3_PERSISTENCE=sqlite` uses local SQLite through Node's built-in SQLite support.

`M3_PERSISTENCE=supabase` uses server-only Supabase REST calls:

- public submission creation writes `persons` and `submissions` with the service-role key from the server only;
- admin list/detail/review operations use the authenticated Supabase admin JWT so RLS policies are exercised;
- review operations update `reviews` and `submissions.status`, not `submissions.original_json`.

If Supabase mode is explicitly selected and required Supabase env vars are missing, the app fails the operation with `SUPABASE_MISCONFIGURED` instead of silently falling back.

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

## Production Supabase Persistence

Candidate SQL lives in `supabase/schema.sql`; setup instructions live in `docs/setup/SUPABASE.md`.

The production schema:

- starts empty;
- keeps contributor originals and Yeriel reviews separate;
- stores Supabase originals as JSONB objects, not stringified JSON;
- uses `m3_admins` as the explicit admin allowlist;
- enables RLS on archive tables;
- grants no archive table access to `anon`;
- grants authenticated users only RLS-gated admin access;
- grants status-only updates on `submissions` so `original_json` cannot be updated through the admin JWT;
- leaves media/artifacts/story drafts default-deny until their workflows exist.

## Admin Auth

`M3_ADMIN_AUTH=local` keeps the existing password session for local SQLite testing.

`M3_ADMIN_AUTH=supabase` uses Supabase Auth plus `m3_admins`. A valid Supabase account is not enough; the user id or lowercased email must be present in `m3_admins`.

Session cookies are HTTP-only, `sameSite: "strict"`, and secure in production.

## Security Requirements

Anonymous users can submit through the server action.

Anonymous users cannot:

- enumerate submissions;
- retrieve other submissions;
- retrieve media belonging to other submissions unless explicitly public;
- see admin metadata;
- see Yeriel review data;
- modify source submissions.

Never expose service-role credentials in browser code.

Validate uploads, request sizes, file types, and all trust-boundary inputs before enabling media.

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
