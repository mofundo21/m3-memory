begin;

create extension if not exists pgcrypto;

create type public.date_certainty as enum ('exact', 'approximate', 'unknown');
create type public.submission_status as enum (
  'draft', 'submitted', 'in_review', 'needs_follow_up', 'approved', 'archived', 'rejected'
);
create type public.encounter_kind as enum ('first_meeting', 'later_encounter');
create type public.media_kind as enum ('image', 'video', 'audio', 'document');
create type public.consent_kind as enum (
  'archive_storage', 'public_website', 'book_editorial', 'display_name', 'display_social', 'follow_up_contact'
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 120),
  full_name text,
  email text,
  phone text,
  instagram text,
  other_social_label text,
  other_social_url text,
  preferred_contact_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default ('M3-' || upper(encode(gen_random_bytes(6), 'hex'))),
  contributor_id uuid not null references public.people(id) on delete restrict,
  status public.submission_status not null default 'draft',
  original_payload jsonb not null default '{}'::jsonb,
  policy_version text not null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submitted_at_required check (status = 'draft' or submitted_at is not null)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_type text,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text,
  venue text,
  city text,
  region text,
  country text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz not null default now()
);

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  kind public.encounter_kind not null,
  sequence_number integer not null default 1 check (sequence_number > 0),
  date_certainty public.date_certainty not null,
  occurred_on date,
  approximate_date_text text,
  event_id uuid references public.events(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  submitted_event_name text,
  submitted_venue text,
  submitted_city text,
  submitted_region text,
  submitted_country text,
  story text not null,
  conversation_details text,
  mofundo_wearing text,
  contributor_wearing text,
  first_impression text,
  meaningful_details text,
  things_exchanged text,
  forgotten_detail text,
  book_page_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, sequence_number),
  constraint encounter_date_matches_certainty check (
    (date_certainty = 'exact' and occurred_on is not null and approximate_date_text is null)
    or (date_certainty = 'approximate' and occurred_on is null and nullif(trim(approximate_date_text), '') is not null)
    or (date_certainty = 'unknown' and occurred_on is null)
  )
);

create table public.encounter_participants (
  encounter_id uuid not null references public.encounters(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  role text not null default 'contributor',
  primary key (encounter_id, person_id)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  kind public.media_kind not null,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 104857600),
  caption text,
  approximate_date_text text,
  people_depicted text,
  created_at timestamptz not null default now()
);

create table public.consent_grants (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  kind public.consent_kind not null,
  granted boolean not null,
  policy_version text not null,
  captured_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  unique (submission_id, kind, captured_at)
);

create table public.review_notes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  created_at timestamptz not null default now()
);

create table public.submission_tags (
  submission_id uuid not null references public.submissions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (submission_id, tag_id)
);

create table public.submission_flags (
  submission_id uuid primary key references public.submissions(id) on delete cascade,
  book_potential boolean not null default false,
  sensitive boolean not null default false,
  needs_verification boolean not null default false,
  needs_follow_up boolean not null default false,
  updated_at timestamptz not null default now()
);

create index submissions_status_created_idx on public.submissions(status, created_at desc);
create index encounters_submission_idx on public.encounters(submission_id, sequence_number);
create index media_assets_submission_idx on public.media_assets(submission_id);
create index consent_grants_submission_idx on public.consent_grants(submission_id, kind);

create or replace function public.is_archive_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_archive_admin() from public;
grant execute on function public.is_archive_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.people enable row level security;
alter table public.submissions enable row level security;
alter table public.events enable row level security;
alter table public.locations enable row level security;
alter table public.encounters enable row level security;
alter table public.encounter_participants enable row level security;
alter table public.media_assets enable row level security;
alter table public.consent_grants enable row level security;
alter table public.review_notes enable row level security;
alter table public.tags enable row level security;
alter table public.submission_tags enable row level security;
alter table public.submission_flags enable row level security;

create policy "admins read admin roster" on public.admin_users for select to authenticated using (public.is_archive_admin());
create policy "admins manage people" on public.people for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin());
create policy "admins manage submissions" on public.submissions for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin());
create policy "admins manage events" on public.events for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin());
create policy "admins manage locations" on public.locations for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin());
create policy "admins manage encounters" on public.encounters for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin());
create policy "admins manage participants" on public.encounter_participants for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin());
create policy "admins manage media" on public.media_assets for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin());
create policy "admins manage consents" on public.consent_grants for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin());
create policy "admins manage review notes" on public.review_notes for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin());
create policy "admins manage tags" on public.tags for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin());
create policy "admins manage submission tags" on public.submission_tags for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin());
create policy "admins manage flags" on public.submission_flags for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memory-evidence',
  'memory-evidence',
  false,
  104857600,
  array['image/jpeg','image/png','image/webp','image/heic','video/mp4','video/quicktime','audio/mpeg','audio/mp4','audio/wav','application/pdf']
)
on conflict (id) do nothing;

create policy "admins read evidence objects" on storage.objects for select to authenticated
using (bucket_id = 'memory-evidence' and public.is_archive_admin());
create policy "admins manage evidence objects" on storage.objects for all to authenticated
using (bucket_id = 'memory-evidence' and public.is_archive_admin())
with check (bucket_id = 'memory-evidence' and public.is_archive_admin());

commit;
