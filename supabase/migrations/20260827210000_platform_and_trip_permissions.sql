-- NIOLI platform and trip permission separation.
--
-- Review only. This migration is intentionally additive and does not assign
-- platform permissions to any person, PIN, trip, email, or generated ID.
-- A reviewed bootstrap data change must later add the two platform keys only
-- to the specifically authorized trip_access row.

create or replace function app.is_platform_permission(p_permission text)
returns boolean
language sql
immutable
set search_path = ''
as $function$
  select p_permission in ('manage_platform_access', 'create_traveler_spaces');
$function$;

create or replace function app.is_trip_permission(p_permission text)
returns boolean
language sql
immutable
set search_path = ''
as $function$
  select p_permission in (
    'edit_itinerary',
    'manage_reservations',
    'create_stamps',
    'import_pdf',
    'manage_trip_participants',
    'manage_trip'
  );
$function$;

create or replace function app.has_platform_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select app.is_platform_permission(p_permission)
     and coalesce(app.current_permissions() -> p_permission = 'true'::jsonb, false);
$function$;

-- A trip owner retains trip-level authority, but owner is never an implicit
-- platform administrator. Explicit permissions continue to work for existing
-- shared-trip functionality.
create or replace function app.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select case
    when app.is_platform_permission(p_permission)
      then app.has_platform_permission(p_permission)
    when app.is_trip_permission(p_permission)
      then app.current_role() = 'owner'
        or coalesce(app.current_permissions() -> p_permission = 'true'::jsonb, false)
    else false
  end;
$function$;

create or replace function app.can_edit_plan()
returns boolean
language sql
stable
set search_path = ''
as $function$
  select app.current_role() = 'owner'
      or app.has_permission('edit_itinerary');
$function$;

create or replace function app.can_manage_reservations()
returns boolean
language sql
stable
set search_path = ''
as $function$
  select app.current_role() = 'owner'
      or app.has_permission('manage_reservations');
$function$;

create or replace function app.can_manage_trip_participants()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select app.current_role() = 'owner'
      or app.has_permission('manage_trip_participants');
$function$;

create or replace function app.trip_permissions_only(p_permissions jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $function$
  select jsonb_build_object(
    'edit_itinerary', coalesce(p_permissions -> 'edit_itinerary' = 'true'::jsonb, false),
    'manage_reservations', coalesce(p_permissions -> 'manage_reservations' = 'true'::jsonb, false),
    'create_stamps', coalesce(p_permissions -> 'create_stamps' = 'true'::jsonb, false),
    'import_pdf', coalesce(p_permissions -> 'import_pdf' = 'true'::jsonb, false),
    'manage_trip_participants', coalesce(p_permissions -> 'manage_trip_participants' = 'true'::jsonb, false),
    'manage_trip', coalesce(p_permissions -> 'manage_trip' = 'true'::jsonb, false)
  );
$function$;

create or replace function app.list_trip_participants_for_management()
returns table(
  participant_id uuid,
  display_name text,
  participant_role text,
  avatar_url text,
  permissions jsonb,
  access_active boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not app.can_manage_trip_participants() then
    raise exception 'forbidden';
  end if;

  return query
  select
    p.id,
    p.display_name,
    p.role,
    p.avatar_url,
    app.trip_permissions_only(coalesce(ta.permissions, '{}'::jsonb)),
    coalesce(ta.is_active, false)
  from public.participants p
  left join public.trip_access ta
    on ta.trip_id = p.trip_id
   and ta.participant_id = p.id
  where p.trip_id = app.current_trip_id()
  order by p.created_at;
end;
$function$;

create or replace function app.set_trip_participant_permissions(
  p_participant_id uuid,
  p_permissions jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_trip_id uuid := app.current_trip_id();
  v_updated boolean;
begin
  if v_trip_id is null or not app.can_manage_trip_participants() then
    raise exception 'forbidden';
  end if;
  if exists (
    select 1
    from jsonb_object_keys(coalesce(p_permissions, '{}'::jsonb)) as supplied(permission_key)
    where not app.is_trip_permission(supplied.permission_key)
  ) then
    raise exception 'invalid_trip_permission';
  end if;
  if not exists (
    select 1
    from public.participants p
    where p.id = p_participant_id
      and p.trip_id = v_trip_id
      and p.id <> app.current_participant_id()
      and p.role <> 'owner'
  ) then
    raise exception 'participant_not_manageable';
  end if;

  update public.trip_access ta
  set permissions = app.trip_permissions_only(coalesce(p_permissions, '{}'::jsonb))
  where ta.trip_id = v_trip_id
    and ta.participant_id = p_participant_id;
  v_updated := found;
  return v_updated;
end;
$function$;

create or replace function app.revoke_trip_participant_access(p_participant_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_trip_id uuid := app.current_trip_id();
begin
  if v_trip_id is null or not app.can_manage_trip_participants() then
    raise exception 'forbidden';
  end if;
  if not exists (
    select 1
    from public.participants p
    where p.id = p_participant_id
      and p.trip_id = v_trip_id
      and p.id <> app.current_participant_id()
      and p.role <> 'owner'
  ) then
    raise exception 'participant_not_manageable';
  end if;

  update public.trip_access ta
  set is_active = false
  where ta.trip_id = v_trip_id
    and ta.participant_id = p_participant_id;
  update public.pin_sessions ps
  set revoked_at = now()
  where ps.trip_id = v_trip_id
    and ps.participant_id = p_participant_id
    and ps.revoked_at is null;
end;
$function$;

-- Participant management remains scoped to the current trip. Authorized trip
-- organizers can manage companions, but cannot create or modify an owner row.
-- NIOLI currently has no self-profile editing feature, so self-updates remain
-- intentionally blocked. If one is added later, it must use a narrow RPC that
-- updates only display_name and avatar_url, never this broad table policy.
drop policy if exists participants_insert on public.participants;
drop policy if exists participants_update on public.participants;
drop policy if exists participants_delete on public.participants;

create policy participants_insert
on public.participants for insert
to anon, authenticated
with check (
  trip_id = app.current_trip_id()
  and role <> 'owner'
  and app.can_manage_trip_participants()
);

create policy participants_update
on public.participants for update
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and id <> app.current_participant_id()
  and role <> 'owner'
  and app.can_manage_trip_participants()
)
with check (
  trip_id = app.current_trip_id()
  and id <> app.current_participant_id()
  and role <> 'owner'
  and app.can_manage_trip_participants()
);

create policy participants_delete
on public.participants for delete
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and id <> app.current_participant_id()
  and role <> 'owner'
  and app.can_manage_trip_participants()
);

drop policy if exists reservations_write on public.reservations;
create policy reservations_write
on public.reservations for all
to anon, authenticated
using (
  trip_id = app.current_trip_id()
  and app.can_manage_reservations()
)
with check (
  trip_id = app.current_trip_id()
  and app.can_manage_reservations()
);

drop policy if exists trips_update on public.trips;
create policy trips_update
on public.trips for update
to anon, authenticated
using (
  id = app.current_trip_id()
  and (app.current_role() = 'owner' or app.has_permission('manage_trip'))
)
with check (
  id = app.current_trip_id()
  and (app.current_role() = 'owner' or app.has_permission('manage_trip'))
);

-- Platform metadata is minimal and available only with an explicit global
-- permission. It never returns trip content or participant-private records.
drop function if exists app.list_guest_workspace_accesses();
create function app.list_guest_workspace_accesses()
returns table(
  workspace_id uuid,
  display_name text,
  is_active boolean,
  expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not app.has_platform_permission('manage_platform_access') then
    raise exception 'forbidden';
  end if;
  return query
  select gw.id, gwa.display_name, gwa.is_active, gwa.expires_at, gwa.created_at
  from public.guest_workspaces gw
  join public.guest_workspace_access gwa on gwa.workspace_id = gw.id
  order by gwa.created_at desc;
end;
$function$;

create or replace function app.revoke_guest_workspace_access(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not app.has_platform_permission('manage_platform_access') then
    raise exception 'forbidden';
  end if;
  if not exists (select 1 from public.guest_workspaces gw where gw.id = p_workspace_id) then
    raise exception 'traveler_access_not_found';
  end if;
  update public.guest_workspace_access gwa
  set is_active = false
  where gwa.workspace_id = p_workspace_id;
  update public.guest_workspace_sessions gws
  set revoked_at = now()
  where gws.workspace_id = p_workspace_id
    and gws.revoked_at is null;
end;
$function$;

-- Legacy RPCs that return another person's plaintext PIN are disabled. Privacy
-- Sprint Part 2 will replace them with one-time setup links and user-chosen PINs.
do $disable_plaintext_and_pending_setup_rpcs$
begin
  if to_regprocedure('app.generate_participant_pin(uuid,timestamp with time zone,jsonb)') is not null then
    execute 'revoke execute on function app.generate_participant_pin(uuid, timestamptz, jsonb) from public, anon, authenticated';
  end if;
  if to_regprocedure('app.generate_guest_workspace_pin(text,timestamp with time zone)') is not null then
    execute 'revoke execute on function app.generate_guest_workspace_pin(text, timestamptz) from public, anon, authenticated';
  end if;
  if to_regprocedure('app.regenerate_guest_workspace_pin(uuid)') is not null then
    execute 'revoke execute on function app.regenerate_guest_workspace_pin(uuid) from public, anon, authenticated';
  end if;
  if to_regprocedure('app.issue_guest_workspace_setup(text,timestamp with time zone,timestamp with time zone)') is not null then
    execute 'revoke execute on function app.issue_guest_workspace_setup(text, timestamptz, timestamptz) from public, anon, authenticated';
  end if;
  if to_regprocedure('app.issue_guest_workspace_pin_reset(uuid,timestamp with time zone,timestamp with time zone)') is not null then
    execute 'revoke execute on function app.issue_guest_workspace_pin_reset(uuid, timestamptz, timestamptz) from public, anon, authenticated';
  end if;
end
$disable_plaintext_and_pending_setup_rpcs$;

revoke execute on function app.is_platform_permission(text) from public;
revoke execute on function app.is_trip_permission(text) from public;
revoke execute on function app.has_platform_permission(text) from public;
revoke execute on function app.can_manage_trip_participants() from public;
revoke execute on function app.trip_permissions_only(jsonb) from public;
revoke execute on function app.list_trip_participants_for_management() from public;
revoke execute on function app.set_trip_participant_permissions(uuid, jsonb) from public;
revoke execute on function app.revoke_trip_participant_access(uuid) from public;
revoke execute on function app.can_manage_reservations() from public;
revoke execute on function app.list_guest_workspace_accesses() from public;
revoke execute on function app.revoke_guest_workspace_access(uuid) from public;

grant execute on function app.is_platform_permission(text) to anon, authenticated;
grant execute on function app.is_trip_permission(text) to anon, authenticated;
grant execute on function app.has_platform_permission(text) to anon, authenticated;
grant execute on function app.can_manage_trip_participants() to anon, authenticated;
grant execute on function app.trip_permissions_only(jsonb) to anon, authenticated;
grant execute on function app.list_trip_participants_for_management() to anon, authenticated;
grant execute on function app.set_trip_participant_permissions(uuid, jsonb) to anon, authenticated;
grant execute on function app.revoke_trip_participant_access(uuid) to anon, authenticated;
grant execute on function app.can_manage_reservations() to anon, authenticated;
grant execute on function app.list_guest_workspace_accesses() to anon, authenticated;
grant execute on function app.revoke_guest_workspace_access(uuid) to anon, authenticated;
