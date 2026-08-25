-- Travel OS Cloud Mode foundation. This migration is not required by Local Mode.
create extension if not exists pgcrypto;
create type public.trip_member_role as enum ('owner', 'editor', 'viewer');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);
create table public.trips (
  id uuid primary key default gen_random_uuid(), stable_id text not null unique,
  owner_id uuid not null references public.users(id), name text not null, country_id text not null,
  start_date date not null, end_date date not null, currency text not null, destination_timezone text not null,
  settings jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.trip_member_role not null, joined_at timestamptz not null default now(), primary key (trip_id, user_id)
);
create table public.trip_days (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  stable_id text not null, trip_date date not null, position integer not null default 0, data jsonb not null default '{}'::jsonb,
  unique (trip_id, stable_id), unique (trip_id, trip_date)
);
create table public.locations (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  stable_id text not null, name text not null, address text, latitude double precision, longitude double precision, google_place_id text,
  unique (trip_id, stable_id)
);
create table public.activities (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  trip_day_id uuid references public.trip_days(id) on delete cascade, location_id uuid references public.locations(id) on delete set null,
  stable_id text not null, title text not null, data jsonb not null default '{}'::jsonb, unique (trip_id, stable_id)
);
create table public.reservations (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  stable_id text not null, reservation_type text not null, data jsonb not null default '{}'::jsonb, unique (trip_id, stable_id)
);
create table public.expenses (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  stable_id text not null, amount numeric not null check (amount >= 0), currency text not null, paid_by uuid references public.users(id),
  data jsonb not null default '{}'::jsonb, unique (trip_id, stable_id)
);
create table public.photos (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  stable_id text not null, participant_id uuid references public.users(id), storage_path text not null,
  data jsonb not null default '{}'::jsonb, unique (trip_id, stable_id)
);
create table public.passport_stamps (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  stable_id text not null, title text not null, data jsonb not null default '{}'::jsonb, unique (trip_id, stable_id)
);
create table public.stamp_unlocks (
  stamp_id uuid not null references public.passport_stamps(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade, photo_id uuid references public.photos(id) on delete set null,
  method text not null check (method in ('manual', 'gps', 'photo')), unlocked_at timestamptz not null default now(), primary key (stamp_id, user_id)
);
create table public.companion_progress (
  trip_id uuid not null references public.trips(id) on delete cascade, user_id uuid not null references public.users(id) on delete cascade,
  level integer not null default 1, xp integer not null default 0, mood text not null default 'curious', data jsonb not null default '{}'::jsonb,
  primary key (trip_id, user_id)
);
create table public.trip_invites (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  code_hash text not null unique, role public.trip_member_role not null default 'viewer', created_by uuid not null references public.users(id),
  expires_at timestamptz, used_by uuid references public.users(id), used_at timestamptz, created_at timestamptz not null default now()
);

create or replace function public.is_trip_member(target_trip_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.trip_members where trip_id = target_trip_id and user_id = auth.uid()); $$;

alter table public.users enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_days enable row level security;
alter table public.activities enable row level security;
alter table public.locations enable row level security;
alter table public.reservations enable row level security;
alter table public.expenses enable row level security;
alter table public.photos enable row level security;
alter table public.passport_stamps enable row level security;
alter table public.stamp_unlocks enable row level security;
alter table public.companion_progress enable row level security;
alter table public.trip_invites enable row level security;

-- Deployment must add audited owner/editor/viewer policies before Cloud Mode is enabled.
