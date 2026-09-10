# Supabase Setup Candidate

M3 Memory V0.1 currently runs and tests against local SQLite. Supabase is not wired because no project URL, anon key, service role key, or admin identity model has been provided.

Use `supabase/schema.sql` only on a new empty Supabase project. Do not import previous ChatGPT memories, book material, old M3 lore, or historical project data.

Minimum values Yeriel must provide before integration can be tested:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- A decision for admin identity: keep app password gate temporarily, or move to Supabase Auth allowlisted user(s)

Security posture in the candidate schema:

- Tables exist for contributor originals, Yeriel reviews, media, artifacts, and future story drafts.
- Contributor originals live in `submissions.original_json`.
- Yeriel review lives in `reviews` and does not overwrite `submissions.original_json`.
- RLS is enabled on all archive tables.
- `anon` and `authenticated` grants are revoked by default.
- Public/browser clients cannot list or read submissions by default.

Next integration step after credentials exist:

1. Apply `supabase/schema.sql` to a fresh empty project.
2. Add the Supabase package and a server-only storage adapter.
3. Keep public submission writes behind a backend route/server action.
4. Keep admin reads/writes server-side.
5. Run Claude/Codex review on RLS, service-role usage, admin identity, and media permissions before launch.
