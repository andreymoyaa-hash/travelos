-- Nioli Lite private user snapshots and receipt photos.
-- Apply via Supabase SQL editor if the management API is unavailable.
create table if not exists public.nioli_lite_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  itinerary jsonb not null default '[]'::jsonb,
  receipts jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.nioli_lite_snapshots enable row level security;
revoke all on public.nioli_lite_snapshots from anon;
grant select, insert, update, delete on public.nioli_lite_snapshots to authenticated;
drop policy if exists "lite_select_own" on public.nioli_lite_snapshots;
create policy "lite_select_own" on public.nioli_lite_snapshots for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "lite_insert_own" on public.nioli_lite_snapshots;
create policy "lite_insert_own" on public.nioli_lite_snapshots for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "lite_update_own" on public.nioli_lite_snapshots;
create policy "lite_update_own" on public.nioli_lite_snapshots for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "lite_delete_own" on public.nioli_lite_snapshots;
create policy "lite_delete_own" on public.nioli_lite_snapshots for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nioli-lite-receipts','nioli-lite-receipts',false,10000000,array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do nothing;

drop policy if exists "lite_receipt_select" on storage.objects;
create policy "lite_receipt_select" on storage.objects for select to authenticated
using (bucket_id='nioli-lite-receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "lite_receipt_insert" on storage.objects;
create policy "lite_receipt_insert" on storage.objects for insert to authenticated
with check (bucket_id='nioli-lite-receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "lite_receipt_delete" on storage.objects;
create policy "lite_receipt_delete" on storage.objects for delete to authenticated
using (bucket_id='nioli-lite-receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
