# Supabase Setup

M3 Memory supports local SQLite for development/tests and Supabase for production persistence.

Production must start empty. Do not import ChatGPT memories, book material, old lore, prior timelines, development SQLite rows, or smoke-test submissions.

## Required Env Vars

Set these in the deployment environment. Do not commit real values.

- `M3_PERSISTENCE=supabase`
- `M3_ADMIN_AUTH=supabase`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`

Local/offline testing can keep:

- `M3_PERSISTENCE=sqlite`
- `M3_ADMIN_AUTH=local`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `DATABASE_PATH`

## Create The Empty Project

1. Create a fresh Supabase project.
2. Open the SQL editor.
3. Apply `supabase/schema.sql` once.
4. Confirm the tables are empty: `persons`, `submissions`, `reviews`, `media`, `artifacts`, and `story_drafts` should have zero rows.

## Create The Admin Identity

1. Create Yeriel's admin user in Supabase Auth.
2. Copy the Auth user id and email.
3. Insert the allowlist row, using lowercase email:

```sql
insert into public.m3_admins (user_id, email)
values ('AUTH-USER-UUID-HERE', lower('yeriel@example.com'));
```

Do not add broad policies for every authenticated user. `m3_admins` is the admin allowlist.

## Security Model

Public visitors submit through the Next.js server action. The browser never gets table grants for archive data.

- `anon` has no table read/update/delete policies.
- Public insert uses `SUPABASE_SERVICE_ROLE_KEY` only on the server.
- Admin login uses Supabase Auth email/password.
- Admin reads and review writes use the admin user's JWT so RLS is exercised.
- Review writes update `reviews` and `submissions.status`; they do not update `submissions.original_json`.

## Production Smoke Test

After env vars and an admin user exist, run against the real Supabase project with fictional removable data only:

1. Submit one fictional memory from `/remember`.
2. Confirm one `persons` row and one `submissions` row exist.
3. Confirm anonymous Supabase/PostgREST requests cannot list or read submissions.
4. Confirm an unallowlisted Supabase Auth user cannot enter admin.
5. Sign in with the allowlisted admin.
6. Read the inbox and detail page.
7. Create a review, update it, and change status.
8. Verify `submissions.original_json` is unchanged after review create/update.
9. Sign out and confirm admin pages redirect to `/admin/login`.
10. Delete the fictional test rows before launch if they are not wanted.

Do not claim production persistence works until this real Supabase path passes.

## Deployment Basics

- Build command: `npm run build`
- Start command: `npm run start`
- Runtime: Node.js with Next.js App Router support and outbound HTTPS access to Supabase.
- Required server env vars: the values listed above.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to browser code or client components.

## Rollback

If Supabase production setup fails before real public launch:

1. Set deployment env back to `M3_PERSISTENCE=sqlite` and `M3_ADMIN_AUTH=local` only for private/local recovery.
2. Remove any fictional Supabase test rows.
3. Fix schema or app code in a new reviewed checkpoint.
4. Reapply schema only to a fresh empty project if the first project became contaminated.

## Future Media

The schema has a `media` table, but uploads remain disabled. Before enabling photos, video, or audio, add private storage buckets, file type/size validation, request limits, retrieval authorization, and another Tier 3 review.
