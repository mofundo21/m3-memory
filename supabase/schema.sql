-- M3 Memory V0.1 production Supabase schema.
-- Apply only to a new empty Supabase project. Do not import old memories or lore.

create extension if not exists pgcrypto;

create table if not exists public.m3_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  email text unique,
  created_at timestamptz not null default now(),
  check (user_id is not null or email is not null)
);

create table if not exists public.persons (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  contact text,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  submitter_person_id uuid references public.persons(id),
  original_json jsonb not null,
  memory_preview text not null,
  encounter_date text,
  is_approximate_date boolean not null default false,
  location_name text,
  city text,
  region text,
  country text,
  event_name text,
  media_link text,
  media_consent boolean not null default false,
  attribution_preference text default 'anonymous',
  preferred_attribution text,
  book_note text,
  final_notes text,
  status text not null default 'UNREVIEWED' check (status in ('UNREVIEWED', 'IN_REVIEW', 'REVIEWED', 'APPROVED_FOR_STORY', 'REJECTED', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions(id) on delete cascade,
  notes text,
  remembered text,
  corrections text,
  context text,
  people text,
  tags text,
  importance integer check (importance between 1 and 5),
  emotional_significance integer check (emotional_significance between 1 and 5),
  historical_significance integer check (historical_significance between 1 and 5),
  accuracy_confidence integer check (accuracy_confidence between 1 and 5),
  book_potential integer check (book_potential between 1 and 5),
  chapter_category text,
  private_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  file_name text not null,
  mime_type text not null,
  storage_path text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  label text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.story_drafts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  label text not null default 'AI-GENERATED DRAFT',
  draft_text text not null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_m3_admins_user_id on public.m3_admins(user_id);
create index if not exists idx_m3_admins_email on public.m3_admins(email);
create index if not exists idx_submissions_status on public.submissions(status);
create index if not exists idx_submissions_created_at on public.submissions(created_at desc);
create index if not exists idx_reviews_submission_id on public.reviews(submission_id);

create or replace function public.is_m3_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.m3_admins
    where user_id = auth.uid()
       or lower(email) = lower(auth.jwt()->>'email')
  );
$$;

create or replace function public.trigger_update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_submissions_updated_at on public.submissions;
create trigger update_submissions_updated_at
before update on public.submissions
for each row execute function public.trigger_update_updated_at();

drop trigger if exists update_reviews_updated_at on public.reviews;
create trigger update_reviews_updated_at
before update on public.reviews
for each row execute function public.trigger_update_updated_at();

alter table public.m3_admins enable row level security;
alter table public.persons enable row level security;
alter table public.submissions enable row level security;
alter table public.reviews enable row level security;
alter table public.media enable row level security;
alter table public.artifacts enable row level security;
alter table public.story_drafts enable row level security;

revoke all on public.m3_admins from anon, authenticated;
revoke all on public.persons from anon, authenticated;
revoke all on public.submissions from anon, authenticated;
revoke all on public.reviews from anon, authenticated;
revoke all on public.media from anon, authenticated;
revoke all on public.artifacts from anon, authenticated;
revoke all on public.story_drafts from anon, authenticated;

grant select on public.m3_admins to authenticated;
grant select on public.persons to authenticated;
grant select on public.submissions to authenticated;
grant update(status, updated_at) on public.submissions to authenticated;
grant insert, select on public.reviews to authenticated;
grant update(
  notes,
  remembered,
  corrections,
  context,
  people,
  tags,
  importance,
  emotional_significance,
  historical_significance,
  accuracy_confidence,
  book_potential,
  chapter_category,
  private_notes,
  updated_at
) on public.reviews to authenticated;
grant insert, select, update on public.story_drafts to authenticated;

create policy admin_read_allowlist on public.m3_admins
for select to authenticated
using (public.is_m3_admin());

create policy admin_read_persons on public.persons
for select to authenticated
using (public.is_m3_admin());

create policy admin_read_submissions on public.submissions
for select to authenticated
using (public.is_m3_admin());

create policy admin_update_submission_status on public.submissions
for update to authenticated
using (public.is_m3_admin())
with check (public.is_m3_admin());

create policy admin_read_reviews on public.reviews
for select to authenticated
using (public.is_m3_admin());

create policy admin_insert_reviews on public.reviews
for insert to authenticated
with check (public.is_m3_admin());

create policy admin_update_reviews on public.reviews
for update to authenticated
using (public.is_m3_admin())
with check (public.is_m3_admin());

create policy admin_read_story_drafts on public.story_drafts
for select to authenticated
using (public.is_m3_admin());

create policy admin_insert_story_drafts on public.story_drafts
for insert to authenticated
with check (public.is_m3_admin());

create policy admin_update_story_drafts on public.story_drafts
for update to authenticated
using (public.is_m3_admin())
with check (public.is_m3_admin());

create policy admin_read_media on public.media
for select to authenticated
using (public.is_m3_admin());

-- No anon policies are created. Public submissions and media are inserted only through the
-- Next.js server path with SUPABASE_SERVICE_ROLE_KEY (which bypasses RLS). Media and story drafts are admin-only
-- and never accessible to anonymous or non-admin authenticated users. Media table defaults to default-deny
-- (RLS enabled, no insert/update/delete grants to any role, insert through service role only).
