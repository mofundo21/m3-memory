-- MOFUNDO Memory Archive V3: multiple social profiles per person.
-- Additive only. Existing persons.instagram values remain untouched.

begin;

create table if not exists public.person_social_profiles (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.persons(id) on delete cascade,
  platform text not null,
  handle_or_url text not null,
  is_how_we_met boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(handle_or_url) between 1 and 300)
);

create index if not exists person_social_profiles_person_idx
  on public.person_social_profiles(person_id);

alter table public.person_social_profiles enable row level security;

commit;
