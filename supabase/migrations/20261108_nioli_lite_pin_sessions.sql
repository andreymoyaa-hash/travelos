-- PIN-based Nioli Lite cloud, shared only within the authenticated Japan trip.
create table if not exists public.nioli_lite_pin_snapshots (
 trip_id uuid primary key references public.trips(id) on delete cascade,
 itinerary jsonb not null default '[]'::jsonb,
 receipts jsonb not null default '[]'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.nioli_lite_pin_snapshots enable row level security;
revoke all on public.nioli_lite_pin_snapshots from public;
grant select, insert, update on public.nioli_lite_pin_snapshots to anon, authenticated;

drop policy if exists lite_pin_read on public.nioli_lite_pin_snapshots;
create policy lite_pin_read on public.nioli_lite_pin_snapshots for select to anon,authenticated
using (trip_id = (select app.current_trip_id()));

drop policy if exists lite_pin_add on public.nioli_lite_pin_snapshots;
create policy lite_pin_add on public.nioli_lite_pin_snapshots for insert to anon,authenticated
with check (trip_id = (select app.current_trip_id()) and (select app.current_role()) in ('owner','editor'));

drop policy if exists lite_pin_edit on public.nioli_lite_pin_snapshots;
create policy lite_pin_edit on public.nioli_lite_pin_snapshots for update to anon,authenticated
using (trip_id = (select app.current_trip_id()) and (select app.current_role()) in ('owner','editor'))
with check (trip_id = (select app.current_trip_id()) and (select app.current_role()) in ('owner','editor'));

-- Separate private bucket scoped by trip, not by individual email account.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('nioli-lite-pin-receipts','nioli-lite-pin-receipts',false,10000000,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists lite_pin_photo_read on storage.objects;
create policy lite_pin_photo_read on storage.objects for select to anon,authenticated
using (bucket_id='nioli-lite-pin-receipts' and (storage.foldername(name))[1] = (select app.current_trip_id())::text);

drop policy if exists lite_pin_photo_add on storage.objects;
create policy lite_pin_photo_add on storage.objects for insert to anon,authenticated
with check (bucket_id='nioli-lite-pin-receipts' and (storage.foldername(name))[1] = (select app.current_trip_id())::text and (select app.current_role()) in ('owner','editor'));

drop policy if exists lite_pin_photo_update on storage.objects;
create policy lite_pin_photo_update on storage.objects for update to anon,authenticated
using (bucket_id='nioli-lite-pin-receipts' and (storage.foldername(name))[1] = (select app.current_trip_id())::text and (select app.current_role()) in ('owner','editor'))
with check (bucket_id='nioli-lite-pin-receipts' and (storage.foldername(name))[1] = (select app.current_trip_id())::text and (select app.current_role()) in ('owner','editor'));
