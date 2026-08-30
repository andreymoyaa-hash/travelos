-- NIOLI privacy-by-default recovery — participant-private data.
--
-- Review this migration before applying it. It targets the current NIOLI
-- participants/trip_access/pin_sessions contract and intentionally does not
-- create users, trip_members, JWT claims, or a parallel authentication model.

-- Remove only the currently known permissive legacy policies. Unrelated or
-- future policies are intentionally not discovered and dropped dynamically.
drop policy if exists photos_read on public.photos;
drop policy if exists photos_insert on public.photos;
drop policy if exists photos_update on public.photos;
drop policy if exists photos_delete on public.photos;

drop policy if exists expenses_read on public.expenses;
drop policy if exists expenses_insert on public.expenses;
drop policy if exists expenses_update on public.expenses;
drop policy if exists expenses_delete on public.expenses;

drop policy if exists unlocks_read on public.stamp_unlocks;
drop policy if exists unlocks_insert on public.stamp_unlocks;
drop policy if exists unlocks_delete on public.stamp_unlocks;

drop policy if exists companion_read on public.companion_progress;
drop policy if exists companion_write on public.companion_progress;

alter table public.photos enable row level security;
alter table public.expenses enable row level security;
alter table public.stamp_unlocks enable row level security;
alter table public.companion_progress enable row level security;

-- Photos: private to their participant. There is deliberately no owner bypass.
create policy photos_private_select
on public.photos for select
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

create policy photos_private_insert
on public.photos for insert
to anon, authenticated
with check (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

create policy photos_private_update
on public.photos for update
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
)
with check (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

create policy photos_private_delete
on public.photos for delete
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

-- Companion progress: private to the current participant, including owners.
create policy companion_progress_private_select
on public.companion_progress for select
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

create policy companion_progress_private_insert
on public.companion_progress for insert
to anon, authenticated
with check (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

create policy companion_progress_private_update
on public.companion_progress for update
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
)
with check (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

create policy companion_progress_private_delete
on public.companion_progress for delete
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

-- Stamp unlocks: private to the participant who earned the unlock.
create policy stamp_unlocks_private_select
on public.stamp_unlocks for select
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

create policy stamp_unlocks_private_insert
on public.stamp_unlocks for insert
to anon, authenticated
with check (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

create policy stamp_unlocks_private_update
on public.stamp_unlocks for update
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
)
with check (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

create policy stamp_unlocks_private_delete
on public.stamp_unlocks for delete
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

-- Expenses: own records are visible; shared records are visible to the current
-- trip. Only the participant who owns an expense can create, change, or delete it.
create policy expenses_private_or_shared_select
on public.expenses for select
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and (
    participant_id = app.current_participant_id()
    or is_shared = true
  )
);

create policy expenses_owner_insert
on public.expenses for insert
to anon, authenticated
with check (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

create policy expenses_owner_update
on public.expenses for update
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
)
with check (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

create policy expenses_owner_delete
on public.expenses for delete
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and participant_id = app.current_participant_id()
);

-- RLS predicates should have supporting indexes. Existing indexes are preserved.
create index if not exists photos_participant_trip_privacy_idx
  on public.photos (participant_id, trip_id);
create index if not exists companion_progress_participant_trip_privacy_idx
  on public.companion_progress (participant_id, trip_id);
create index if not exists stamp_unlocks_participant_trip_privacy_idx
  on public.stamp_unlocks (participant_id, trip_id);
create index if not exists expenses_participant_trip_privacy_idx
  on public.expenses (participant_id, trip_id);
create index if not exists expenses_shared_trip_privacy_idx
  on public.expenses (trip_id)
  where is_shared = true;

-- The travel-photos bucket remains private. Object paths follow
-- {trip_id}/{participant_id}/..., and every operation is restricted to the
-- current trip and participant. There is deliberately no owner bypass.
drop policy if exists travel_photos_read on storage.objects;
drop policy if exists travel_photos_insert on storage.objects;
drop policy if exists travel_photos_update on storage.objects;
drop policy if exists travel_photos_delete on storage.objects;

create policy travel_photos_read
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'travel-photos'
  and (storage.foldername(name))[1] = app.current_trip_id()::text
  and (storage.foldername(name))[2] = app.current_participant_id()::text
);

create policy travel_photos_insert
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'travel-photos'
  and (storage.foldername(name))[1] = app.current_trip_id()::text
  and (storage.foldername(name))[2] = app.current_participant_id()::text
);

create policy travel_photos_update
on storage.objects for update
to anon, authenticated
using (
  bucket_id = 'travel-photos'
  and (storage.foldername(name))[1] = app.current_trip_id()::text
  and (storage.foldername(name))[2] = app.current_participant_id()::text
)
with check (
  bucket_id = 'travel-photos'
  and (storage.foldername(name))[1] = app.current_trip_id()::text
  and (storage.foldername(name))[2] = app.current_participant_id()::text
);

create policy travel_photos_delete
on storage.objects for delete
to anon, authenticated
using (
  bucket_id = 'travel-photos'
  and (storage.foldername(name))[1] = app.current_trip_id()::text
  and (storage.foldername(name))[2] = app.current_participant_id()::text
);

-- Shared itinerary/catalog policies on trips, trip_days, activities, locations,
-- reservations, and passport_stamps are intentionally left unchanged.
