# MOFUNDO Memory Archive

The MOFUNDO Memory Archive is a private-first system for collecting, reviewing, and organizing memories of MOFUNDO through the people who were there.

## Current journey

`QR link -> tell the story -> upload evidence -> choose permissions -> submit -> private review -> approve or archive`

Nothing submitted becomes public automatically.

## Architecture

Next.js App Router and TypeScript provide the public guided form and private Control Room. Supabase/Postgres stores people, submissions, encounters, permissions, reviews, tags, follow-ups, book research, and private evidence metadata. Supabase Storage holds evidence in a private bucket.

The form autosaves text fields locally, never stores file blobs in local storage, and clears its draft after a successful submission. Uploads use short-lived, hashed tokens. Public submissions never receive direct database access; archive reads and writes run server-side, and private tables have row-level security enabled.

## Main routes

- `/` and `/submit` — seven-step public memory interview
- `/admin` — private submission inbox
- `/admin/submissions/[id]` — archive review workspace
- `/admin/book-desk` — book-potential research queue
- `/admin/follow-ups` — human follow-up queue
- `/admin/search` — structured archive search

## Database history

- `0001_initial_archive.sql` — original greenfield design reference
- `0002_upgrade_existing_archive.sql` — additive upgrade for the existing archive
- `0003_memory_archive_v2.sql` — additive V2 people, encounter, evidence, verification, Book Desk, follow-up, tag, event, and location structure

Never reset the live database. Apply new changes through additive migrations and preserve `submissions.original_json` as the contributor's original recollection.

## Local verification

```bash
npm run typecheck
npm run build
```

See:

- `docs/V1_SPEC.md` for the user and administrator experience
- `docs/DATA_MODEL.md` for the entity model
- `supabase/migrations/` for the full migration history
