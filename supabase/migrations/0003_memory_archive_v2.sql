-- MOFUNDO Memory Archive V2
-- Additive only: preserves all existing records and original submitted JSON.

begin;

create extension if not exists pgcrypto;

-- Person context. These fields describe the contributor, not a single event.
alter table public.persons add column if not exists known_as_at_first_meeting text;
alter table public.persons add column if not exists living_location_at_first_meeting text;
alter table public.persons add column if not exists relationship_today text;
alter table public.persons add column if not exists relationship_today_other text;

-- Submission-scoped upload session. The raw token is never stored.
alter table public.submissions add column if not exists upload_token_hash text;
alter table public.submissions add column if not exists upload_token_expires_at timestamptz;
alter table public.submissions alter column reference_code set default ('MOF-' || upper(encode(gen_random_bytes(6), 'hex')));

-- Structured events and locations prepare the archive for grouping and maps.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_type text,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text,
  venue text,
  city text,
  region text,
  country text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- First encounter and future encounter detail.
alter table public.encounters add column if not exists person_id uuid references public.persons(id) on delete set null;
alter table public.encounters add column if not exists event_id uuid references public.events(id) on delete set null;
alter table public.encounters add column if not exists location_id uuid references public.locations(id) on delete set null;
alter table public.encounters add column if not exists definitely_first_meeting text;
alter table public.encounters add column if not exists time_of_day text;
alter table public.encounters add column if not exists exact_place text;
alter table public.encounters add column if not exists contributor_with text;
alter table public.encounters add column if not exists mofundo_with text;
alter table public.encounters add column if not exists introduced_by text;
alter table public.encounters add column if not exists surroundings text;
alter table public.encounters add column if not exists immediately_before text;
alter table public.encounters add column if not exists time_together text;

-- Reconstruction details.
alter table public.encounters add column if not exists mofundo_hair_style text;
alter table public.encounters add column if not exists mofundo_carrying text;
alter table public.encounters add column if not exists contributor_carrying text;
alter table public.encounters add column if not exists music_playing text;
alter table public.encounters add column if not exists artist_or_set text;
alter table public.encounters add column if not exists place_appearance text;
alter table public.encounters add column if not exists distinctive_nearby text;
alter table public.encounters add column if not exists remembered_hearing text;
alter table public.encounters add column if not exists remembered_seeing text;

-- Conversation and perception.
alter table public.encounters add column if not exists mofundo_exact_words text;
alter table public.encounters add column if not exists contributor_exact_words text;
alter table public.encounters add column if not exists mofundo_work_discussed text;
alter table public.encounters add column if not exists talked_about_music text;
alter table public.encounters add column if not exists talked_about_personal text;
alter table public.encounters add column if not exists story_told text;
alter table public.encounters add column if not exists remembered_quote_or_joke text;
alter table public.encounters add column if not exists impression_before_talking text;
alter table public.encounters add column if not exists impression_after_talking text;

-- What happened afterward and relationship history.
alter table public.encounters add column if not exists kept_hanging_out text;
alter table public.encounters add column if not exists exchanged_contact text;
alter table public.encounters add column if not exists contacted_afterward text;
alter table public.encounters add column if not exists told_anyone text;
alter table public.encounters add column if not exists told_anyone_details text;
alter table public.encounters add column if not exists expected_to_meet_again text;
alter table public.encounters add column if not exists seen_since text;
alter table public.encounters add column if not exists next_seen_where text;
alter table public.encounters add column if not exists next_seen_when text;
alter table public.encounters add column if not exists next_seen_story text;
alter table public.encounters add column if not exists approximate_meeting_count text;
alter table public.encounters add column if not exists connection_today text;
alter table public.encounters add column if not exists life_impact text;
alter table public.encounters add column if not exists watched_change text;
alter table public.encounters add column if not exists change_details text;
alter table public.encounters add column if not exists first_known_identity text;
alter table public.encounters add column if not exists knew_music_at_time text;
alter table public.encounters add column if not exists knew_book_at_time text;

-- High-value prompts.
alter table public.encounters add column if not exists smallest_detail text;
alter table public.encounters add column if not exists never_told_detail text;
alter table public.encounters add column if not exists differing_memory text;

-- Verified facts remain separate from submitted recollections.
alter table public.encounters add column if not exists verified_occurred_on date;
alter table public.encounters add column if not exists verified_event_name text;
alter table public.encounters add column if not exists verified_venue text;
alter table public.encounters add column if not exists verified_city text;
alter table public.encounters add column if not exists verified_region text;
alter table public.encounters add column if not exists verified_country text;
alter table public.encounters add column if not exists verification_notes text;
alter table public.encounters add column if not exists verification_source text;
alter table public.encounters add column if not exists verification_confidence integer check (verification_confidence between 0 and 100);

-- Link all existing encounters to their known contributor without altering recollections.
update public.encounters e
set person_id = s.submitter_person_id
from public.submissions s
where e.submission_id = s.id and e.person_id is null;

insert into public.encounter_participants (encounter_id, person_id, role)
select e.id, e.person_id, 'contributor'
from public.encounters e
where e.person_id is not null
on conflict (encounter_id, person_id) do nothing;

-- Evidence metadata belongs to the media record, never the filename.
alter table public.media add column if not exists encounter_id uuid references public.encounters(id) on delete set null;
alter table public.media add column if not exists media_category text;
alter table public.media add column if not exists description text;
alter table public.media add column if not exists people_pictured text;
alter table public.media add column if not exists approximate_date_text text;
alter table public.media add column if not exists caption text;

-- Names mentioned in memories remain free text until a reviewer links them.
create table if not exists public.mentioned_people (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references public.encounters(id) on delete cascade,
  submitted_name text not null,
  role text,
  linked_person_id uuid references public.persons(id) on delete set null,
  match_status text not null default 'unmatched',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dedicated book research record, separate from the general review.
create table if not exists public.book_desk_entries (
  submission_id uuid primary key references public.submissions(id) on delete cascade,
  category text not null default 'Unsorted',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Follow-up workflow never sends messages automatically.
create table if not exists public.follow_ups (
  submission_id uuid primary key references public.submissions(id) on delete cascade,
  status text not null default 'Needed',
  reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Suggested tags remain editable; arbitrary tags are supported by the same table.
insert into public.tags (name) values
  ('First Meeting'), ('Festival'), ('Funny'), ('Emotional'), ('Friendship'),
  ('Music'), ('Photography'), ('Work'), ('Travel'), ('Book'),
  ('Important Quote'), ('Recurring Person')
on conflict (name) do nothing;

create index if not exists encounters_person_idx on public.encounters(person_id, sequence_number);
create index if not exists encounters_event_idx on public.encounters(event_id);
create index if not exists encounters_location_idx on public.encounters(location_id);
create index if not exists media_encounter_idx on public.media(encounter_id);
create index if not exists mentioned_people_encounter_idx on public.mentioned_people(encounter_id);
create index if not exists mentioned_people_linked_person_idx on public.mentioned_people(linked_person_id);

-- The application accesses archive data server-side with the service role.
-- RLS prevents direct browser access to private records.
alter table public.persons enable row level security;
alter table public.submissions enable row level security;
alter table public.encounters enable row level security;
alter table public.encounter_participants enable row level security;
alter table public.media enable row level security;
alter table public.consent_grants enable row level security;
alter table public.reviews enable row level security;
alter table public.submission_flags enable row level security;
alter table public.tags enable row level security;
alter table public.submission_tags enable row level security;
alter table public.events enable row level security;
alter table public.locations enable row level security;
alter table public.mentioned_people enable row level security;
alter table public.book_desk_entries enable row level security;
alter table public.follow_ups enable row level security;

commit;
