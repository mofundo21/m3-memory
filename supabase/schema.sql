-- M3 Memory V0.1 production candidate schema.
-- Apply only to a new empty Supabase project. Do not import old memories or lore.

create extension if not exists pgcrypto;

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

alter table public.persons enable row level security;
alter table public.submissions enable row level security;
alter table public.reviews enable row level security;
alter table public.media enable row level security;
alter table public.artifacts enable row level security;
alter table public.story_drafts enable row level security;

-- Default stance: anonymous/browser clients cannot read or modify archive data.
-- Server-side insertion/review should use a locked-down backend route with service-role credentials.
-- Add explicit authenticated admin policies only after the admin identity model is chosen.

revoke all on public.persons from anon, authenticated;
revoke all on public.submissions from anon, authenticated;
revoke all on public.reviews from anon, authenticated;
revoke all on public.media from anon, authenticated;
revoke all on public.artifacts from anon, authenticated;
revoke all on public.story_drafts from anon, authenticated;
