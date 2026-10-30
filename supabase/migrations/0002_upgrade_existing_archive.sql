-- Safe additive upgrade for the pre-existing M3 archive schema.
-- Preserves persons, submissions, media, reviews, story_drafts, artifacts,
-- m3_admins, and every existing record.

begin;

create extension if not exists pgcrypto;

do $$ begin
  create type public.date_certainty as enum ('exact', 'approximate', 'unknown');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.encounter_kind as enum ('first_meeting', 'later_encounter');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.consent_kind as enum (
    'archive_storage', 'public_website', 'book_editorial',
    'display_name', 'display_social', 'follow_up_contact'
  );
exception when duplicate_object then null;
end $$;

alter table public.persons add column if not exists full_name text;
alter table public.persons add column if not exists email text;
alter table public.persons add column if not exists phone text;
alter table public.persons add column if not exists instagram text;
alter table public.persons add column if not exists other_social_label text;
alter table public.persons add column if not exists other_social_url text;
alter table public.persons add column if not exists preferred_contact_method text;
alter table public.persons add column if not exists updated_at timestamptz not null default now();

alter table public.submissions add column if not exists reference_code text;
alter table public.submissions add column if not exists policy_version text;
alter table public.submissions add column if not exists submitted_at timestamptz;

update public.submissions
set reference_code = 'M3-' || upper(encode(gen_random_bytes(6), 'hex'))
where reference_code is null;

update public.submissions
set submitted_at = coalesce(created_at, now())
where submitted_at is null and upper(coalesce(status, '')) <> 'DRAFT';

alter table public.submissions alter column reference_code set default ('M3-' || upper(encode(gen_random_bytes(6), 'hex')));
alter table public.submissions alter column reference_code set not null;
create unique index if not exists submissions_reference_code_idx on public.submissions(reference_code);
create index if not exists submissions_status_created_idx on public.submissions(status, created_at desc);

create table if not exists public.encounters (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  kind public.encounter_kind not null,
  sequence_number integer not null default 1 check (sequence_number > 0),
  date_certainty public.date_certainty not null,
  occurred_on date,
  approximate_date_text text,
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

create table if not exists public.encounter_participants (
  encounter_id uuid not null references public.encounters(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  role text not null default 'contributor',
  primary key (encounter_id, person_id)
);

create table if not exists public.consent_grants (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  kind public.consent_kind not null,
  granted boolean not null,
  policy_version text not null,
  captured_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.submission_tags (
  submission_id uuid not null references public.submissions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (submission_id, tag_id)
);

create table if not exists public.submission_flags (
  submission_id uuid primary key references public.submissions(id) on delete cascade,
  book_potential boolean not null default false,
  sensitive boolean not null default false,
  needs_verification boolean not null default false,
  needs_follow_up boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.submission_flags (submission_id)
select id from public.submissions
on conflict (submission_id) do nothing;

create index if not exists encounters_submission_idx on public.encounters(submission_id, sequence_number);
create index if not exists consent_grants_submission_idx on public.consent_grants(submission_id, kind);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memory-evidence', 'memory-evidence', false, 104857600,
  array['image/jpeg','image/png','image/webp','image/heic','video/mp4','video/quicktime','audio/mpeg','audio/mp4','audio/wav','application/pdf']
)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

commit;
