-- NIOLI Privacy Sprint Part 2: one-time private access invitations.
-- Runs after Privacy Part 1 and the Permission Sprint. It deliberately reuses
-- the existing participants/trip_access and guest-workspace session systems.

create table public.access_setup_invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  invitation_type text not null check (
    invitation_type in ('trip_companion', 'independent_traveler')
  ),
  purpose text not null check (purpose in ('create', 'reset')),
  token_hash bytea not null unique,
  created_by_trip_id uuid not null references public.trips(id) on delete cascade,
  created_by_participant_id uuid not null references public.participants(id) on delete cascade,
  target_trip_id uuid references public.trips(id) on delete cascade,
  target_participant_id uuid references public.participants(id) on delete cascade,
  target_trip_access_id uuid references public.trip_access(id) on delete cascade,
  target_workspace_id uuid references public.guest_workspaces(id) on delete cascade,
  target_workspace_access_id uuid references public.guest_workspace_access(id) on delete cascade,
  intended_permissions jsonb not null default '{}'::jsonb,
  access_expires_at timestamptz,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (
    (invitation_type = 'trip_companion'
      and target_trip_id is not null
      and target_participant_id is not null
      and target_trip_access_id is not null
      and target_workspace_id is null
      and target_workspace_access_id is null)
    or
    (invitation_type = 'independent_traveler'
      and target_trip_id is null
      and target_participant_id is null
      and target_trip_access_id is null
      and target_workspace_id is not null
      and target_workspace_access_id is not null
      and intended_permissions = '{}'::jsonb)
  )
);

alter table public.access_setup_invitations enable row level security;
revoke all on table public.access_setup_invitations from public, anon, authenticated;

create unique index access_setup_one_trip_access_active_idx
  on public.access_setup_invitations (target_trip_access_id)
  where target_trip_access_id is not null
    and consumed_at is null and revoked_at is null;
create unique index access_setup_one_workspace_access_active_idx
  on public.access_setup_invitations (target_workspace_access_id)
  where target_workspace_access_id is not null
    and consumed_at is null and revoked_at is null;
create index access_setup_creator_idx
  on public.access_setup_invitations (
    created_by_trip_id, created_by_participant_id, created_at desc
  );

-- Raw token generation is isolated here. Callers persist only digest(...).
create or replace function app.new_private_setup_token()
returns text language sql volatile security definer set search_path = ''
as $function$
  select encode(extensions.gen_random_bytes(32), 'hex');
$function$;

create or replace function app.validate_setup_expiry(p_expires_at timestamptz)
returns void language plpgsql stable set search_path = ''
as $function$
begin
  if p_expires_at <= now()
     or p_expires_at > now() + interval '7 days' then
    raise exception 'invalid_setup_expiry';
  end if;
end;
$function$;

create or replace function app.validate_private_pin(p_pin text)
returns void language plpgsql immutable set search_path = ''
as $function$
begin
  if p_pin !~ '^[0-9]{6}$' then raise exception 'invalid_pin_format'; end if;
  if p_pin in (
    '000000', '111111', '222222', '333333', '444444',
    '555555', '666666', '777777', '888888', '999999',
    '123456', '654321'
  ) then raise exception 'weak_pin'; end if;
end;
$function$;

-- Presentation-safe lookup: no IDs, permissions, token digest or PIN material.
create or replace function app.inspect_access_setup_invitation(p_setup_token text)
returns table(
  invitation_type text,
  invitation_status text,
  inviter_name text,
  target_name text,
  trip_name text,
  expires_at timestamptz
)
language sql stable security definer set search_path = ''
as $function$
  select
    asi.invitation_type,
    case
      when asi.consumed_at is not null then 'used'
      when asi.revoked_at is not null then 'revoked'
      when asi.expires_at <= now() then 'expired'
      else 'ready'
    end,
    inviter.display_name,
    coalesce(companion.display_name, workspace_access.display_name),
    target_trip.name,
    asi.expires_at
  from public.access_setup_invitations asi
  join public.participants inviter on inviter.id = asi.created_by_participant_id
  left join public.participants companion on companion.id = asi.target_participant_id
  left join public.guest_workspace_access workspace_access
    on workspace_access.id = asi.target_workspace_access_id
  left join public.trips target_trip on target_trip.id = asi.target_trip_id
  where p_setup_token ~ '^[0-9a-f]{64}$'
    and asi.token_hash = extensions.digest(p_setup_token, 'sha256');
$function$;

-- FOR UPDATE serializes concurrent redemption. The final consumed_at predicate
-- supplies a second replay guard. PostgreSQL rolls the entire function back if
-- any target update or consumption step fails.
create or replace function app.complete_access_setup_invitation(
  p_setup_token text,
  p_pin text
)
returns table(access_kind text, display_name text)
language plpgsql security definer set search_path = ''
as $function$
declare
  v_invitation public.access_setup_invitations%rowtype;
  v_display_name text;
begin
  if p_setup_token !~ '^[0-9a-f]{64}$' then raise exception 'invalid_setup_token'; end if;
  perform app.validate_private_pin(p_pin);

  select invitation.* into v_invitation
  from public.access_setup_invitations invitation
  where invitation.token_hash = extensions.digest(p_setup_token, 'sha256')
  for update;
  if not found then raise exception 'invalid_setup_token'; end if;
  if v_invitation.consumed_at is not null then raise exception 'setup_token_used'; end if;
  if v_invitation.revoked_at is not null then raise exception 'setup_token_revoked'; end if;
  if v_invitation.expires_at <= now() then raise exception 'setup_token_expired'; end if;
  if v_invitation.access_expires_at is not null
     and v_invitation.access_expires_at <= now() then
    raise exception 'access_expired';
  end if;

  if v_invitation.invitation_type = 'trip_companion' then
    if not exists (
      select 1
      from public.participants p
      join public.trip_access ta
        on ta.id = v_invitation.target_trip_access_id
       and ta.trip_id = p.trip_id and ta.participant_id = p.id
      where p.id = v_invitation.target_participant_id
        and p.trip_id = v_invitation.target_trip_id
        and p.role <> 'owner'
    ) then raise exception 'target_access_invalid'; end if;

    if app.pin_exists_anywhere(p_pin, null, v_invitation.target_trip_access_id) then
      raise exception 'pin_in_use';
    end if;
    update public.trip_access ta
    set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf', 12)),
        permissions = app.trip_permissions_only(v_invitation.intended_permissions),
        is_active = true,
        expires_at = v_invitation.access_expires_at,
        last_used_at = null
    where ta.id = v_invitation.target_trip_access_id
      and ta.trip_id = v_invitation.target_trip_id
      and ta.participant_id = v_invitation.target_participant_id;
    if not found then raise exception 'target_access_invalid'; end if;

    update public.pin_sessions ps set revoked_at = now()
    where ps.trip_id = v_invitation.target_trip_id
      and ps.participant_id = v_invitation.target_participant_id
      and ps.revoked_at is null;
    select p.display_name into v_display_name
    from public.participants p where p.id = v_invitation.target_participant_id;
  else
    if not exists (
      select 1 from public.guest_workspace_access gwa
      where gwa.id = v_invitation.target_workspace_access_id
        and gwa.workspace_id = v_invitation.target_workspace_id
    ) then raise exception 'target_access_invalid'; end if;

    if app.pin_exists_anywhere(p_pin, v_invitation.target_workspace_id, null) then
      raise exception 'pin_in_use';
    end if;
    update public.guest_workspace_access gwa
    set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf', 12)),
        is_active = true,
        expires_at = v_invitation.access_expires_at,
        last_used_at = null
    where gwa.id = v_invitation.target_workspace_access_id
      and gwa.workspace_id = v_invitation.target_workspace_id
    returning gwa.display_name into v_display_name;
    if not found then raise exception 'target_access_invalid'; end if;

    update public.guest_workspace_sessions gws set revoked_at = now()
    where gws.access_id = v_invitation.target_workspace_access_id
      and gws.workspace_id = v_invitation.target_workspace_id
      and gws.revoked_at is null;
  end if;

  update public.access_setup_invitations asi set consumed_at = now()
  where asi.id = v_invitation.id
    and asi.consumed_at is null and asi.revoked_at is null;
  if not found then raise exception 'setup_token_replayed'; end if;

  return query select
    case when v_invitation.invitation_type = 'trip_companion' then 'trip' else 'workspace' end,
    v_display_name;
end;
$function$;

create or replace function app.issue_trip_companion_invitation(
  p_display_name text,
  p_permissions jsonb default '{}'::jsonb,
  p_access_expires_at timestamptz default null,
  p_setup_expires_at timestamptz default (now() + interval '48 hours')
)
returns table(participant_id uuid, setup_token text, setup_expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $function$
declare
  v_trip_id uuid := app.current_trip_id();
  v_participant_id uuid;
  v_trip_access_id uuid;
  v_setup_token text;
  v_permissions jsonb;
begin
  if v_trip_id is null or not app.can_manage_trip_participants() then
    raise exception 'forbidden';
  end if;
  if nullif(trim(p_display_name), '') is null then raise exception 'display_name_required'; end if;
  if char_length(trim(p_display_name)) > 120 then raise exception 'display_name_too_long'; end if;
  if p_access_expires_at is not null and p_access_expires_at <= now() then
    raise exception 'invalid_access_expiry';
  end if;
  perform app.validate_setup_expiry(p_setup_expires_at);
  if exists (
    select 1 from jsonb_object_keys(coalesce(p_permissions, '{}'::jsonb)) supplied(permission_key)
    where not app.is_trip_permission(supplied.permission_key)
  ) then raise exception 'invalid_trip_permission'; end if;
  v_permissions := app.trip_permissions_only(coalesce(p_permissions, '{}'::jsonb));

  insert into public.participants (trip_id, display_name, role)
  values (v_trip_id, trim(p_display_name), 'participant')
  returning id into v_participant_id;

  insert into public.trip_access (
    trip_id, participant_id, pin_hash, permissions, is_active, expires_at, created_by
  ) values (
    v_trip_id,
    v_participant_id,
    extensions.crypt(encode(extensions.gen_random_bytes(32), 'hex'), extensions.gen_salt('bf', 12)),
    v_permissions,
    false,
    p_access_expires_at,
    app.current_participant_id()
  ) returning id into v_trip_access_id;

  v_setup_token := app.new_private_setup_token();
  insert into public.access_setup_invitations (
    invitation_type, purpose, token_hash,
    created_by_trip_id, created_by_participant_id,
    target_trip_id, target_participant_id, target_trip_access_id,
    intended_permissions, access_expires_at, expires_at
  ) values (
    'trip_companion', 'create', extensions.digest(v_setup_token, 'sha256'),
    v_trip_id, app.current_participant_id(),
    v_trip_id, v_participant_id, v_trip_access_id,
    v_permissions, p_access_expires_at, p_setup_expires_at
  );
  return query select v_participant_id, v_setup_token, p_setup_expires_at;
end;
$function$;

create or replace function app.issue_independent_traveler_invitation(
  p_display_name text,
  p_access_expires_at timestamptz default null,
  p_setup_expires_at timestamptz default (now() + interval '48 hours')
)
returns table(workspace_id uuid, setup_token text, setup_expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $function$
declare
  v_workspace_id uuid;
  v_workspace_access_id uuid;
  v_setup_token text;
begin
  if not app.has_platform_permission('create_traveler_spaces') then raise exception 'forbidden'; end if;
  if nullif(trim(p_display_name), '') is null then raise exception 'display_name_required'; end if;
  if char_length(trim(p_display_name)) > 120 then raise exception 'display_name_too_long'; end if;
  if p_access_expires_at is not null and p_access_expires_at <= now() then
    raise exception 'invalid_access_expiry';
  end if;
  perform app.validate_setup_expiry(p_setup_expires_at);

  insert into public.guest_workspaces (
    label, map_provider, created_by_trip_id, created_by_participant_id
  ) values (
    trim(p_display_name) || ' · NIOLI', 'open',
    app.current_trip_id(), app.current_participant_id()
  ) returning id into v_workspace_id;

  insert into public.guest_workspace_access (
    workspace_id, display_name, pin_hash, is_active, expires_at
  ) values (
    v_workspace_id,
    trim(p_display_name),
    extensions.crypt(encode(extensions.gen_random_bytes(32), 'hex'), extensions.gen_salt('bf', 12)),
    false,
    p_access_expires_at
  ) returning id into v_workspace_access_id;

  v_setup_token := app.new_private_setup_token();
  insert into public.access_setup_invitations (
    invitation_type, purpose, token_hash,
    created_by_trip_id, created_by_participant_id,
    target_workspace_id, target_workspace_access_id,
    intended_permissions, access_expires_at, expires_at
  ) values (
    'independent_traveler', 'create', extensions.digest(v_setup_token, 'sha256'),
    app.current_trip_id(), app.current_participant_id(),
    v_workspace_id, v_workspace_access_id,
    '{}'::jsonb, p_access_expires_at, p_setup_expires_at
  );
  return query select v_workspace_id, v_setup_token, p_setup_expires_at;
end;
$function$;

create or replace function app.issue_trip_companion_pin_reset(
  p_participant_id uuid,
  p_setup_expires_at timestamptz default (now() + interval '48 hours')
)
returns table(setup_token text, setup_expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $function$
declare
  v_trip_id uuid := app.current_trip_id();
  v_trip_access_id uuid;
  v_access_expires_at timestamptz;
  v_permissions jsonb;
  v_setup_token text;
begin
  if v_trip_id is null or not app.can_manage_trip_participants() then raise exception 'forbidden'; end if;
  perform app.validate_setup_expiry(p_setup_expires_at);
  select ta.id, ta.expires_at, app.trip_permissions_only(ta.permissions)
  into v_trip_access_id, v_access_expires_at, v_permissions
  from public.participants p
  join public.trip_access ta on ta.trip_id = p.trip_id and ta.participant_id = p.id
  where p.id = p_participant_id
    and p.trip_id = v_trip_id
    and p.id <> app.current_participant_id()
    and p.role <> 'owner'
  for update of ta;
  if not found then raise exception 'participant_not_manageable'; end if;
  if v_access_expires_at is not null and v_access_expires_at <= now() then
    raise exception 'access_expired';
  end if;

  update public.trip_access ta set is_active = false, last_used_at = null
  where ta.id = v_trip_access_id;
  update public.pin_sessions ps set revoked_at = now()
  where ps.trip_id = v_trip_id and ps.participant_id = p_participant_id
    and ps.revoked_at is null;
  update public.access_setup_invitations asi set revoked_at = now()
  where asi.target_trip_access_id = v_trip_access_id
    and asi.consumed_at is null and asi.revoked_at is null;

  v_setup_token := app.new_private_setup_token();
  insert into public.access_setup_invitations (
    invitation_type, purpose, token_hash,
    created_by_trip_id, created_by_participant_id,
    target_trip_id, target_participant_id, target_trip_access_id,
    intended_permissions, access_expires_at, expires_at
  ) values (
    'trip_companion', 'reset', extensions.digest(v_setup_token, 'sha256'),
    v_trip_id, app.current_participant_id(),
    v_trip_id, p_participant_id, v_trip_access_id,
    v_permissions, v_access_expires_at, p_setup_expires_at
  );
  return query select v_setup_token, p_setup_expires_at;
end;
$function$;

create or replace function app.issue_independent_traveler_pin_reset(
  p_workspace_id uuid,
  p_setup_expires_at timestamptz default (now() + interval '48 hours')
)
returns table(setup_token text, setup_expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $function$
declare
  v_workspace_access_id uuid;
  v_access_expires_at timestamptz;
  v_setup_token text;
begin
  if not app.has_platform_permission('manage_platform_access') then raise exception 'forbidden'; end if;
  perform app.validate_setup_expiry(p_setup_expires_at);
  select gwa.id, gwa.expires_at into v_workspace_access_id, v_access_expires_at
  from public.guest_workspace_access gwa
  where gwa.workspace_id = p_workspace_id
  for update;
  if not found then raise exception 'traveler_access_not_found'; end if;
  if v_access_expires_at is not null and v_access_expires_at <= now() then
    raise exception 'access_expired';
  end if;

  update public.guest_workspace_access gwa set is_active = false, last_used_at = null
  where gwa.id = v_workspace_access_id;
  update public.guest_workspace_sessions gws set revoked_at = now()
  where gws.access_id = v_workspace_access_id and gws.workspace_id = p_workspace_id
    and gws.revoked_at is null;
  update public.access_setup_invitations asi set revoked_at = now()
  where asi.target_workspace_access_id = v_workspace_access_id
    and asi.consumed_at is null and asi.revoked_at is null;

  v_setup_token := app.new_private_setup_token();
  insert into public.access_setup_invitations (
    invitation_type, purpose, token_hash,
    created_by_trip_id, created_by_participant_id,
    target_workspace_id, target_workspace_access_id,
    intended_permissions, access_expires_at, expires_at
  ) values (
    'independent_traveler', 'reset', extensions.digest(v_setup_token, 'sha256'),
    app.current_trip_id(), app.current_participant_id(),
    p_workspace_id, v_workspace_access_id,
    '{}'::jsonb, v_access_expires_at, p_setup_expires_at
  );
  return query select v_setup_token, p_setup_expires_at;
end;
$function$;

-- Existing revoke operations now also invalidate every unconsumed link.
create or replace function app.revoke_trip_participant_access(p_participant_id uuid)
returns void language plpgsql security definer set search_path = ''
as $function$
declare
  v_trip_id uuid := app.current_trip_id();
  v_trip_access_id uuid;
begin
  if v_trip_id is null or not app.can_manage_trip_participants() then raise exception 'forbidden'; end if;
  select ta.id into v_trip_access_id
  from public.participants p
  join public.trip_access ta on ta.trip_id = p.trip_id and ta.participant_id = p.id
  where p.id = p_participant_id and p.trip_id = v_trip_id
    and p.id <> app.current_participant_id() and p.role <> 'owner';
  if not found then raise exception 'participant_not_manageable'; end if;
  update public.trip_access ta set is_active = false where ta.id = v_trip_access_id;
  update public.pin_sessions ps set revoked_at = now()
  where ps.trip_id = v_trip_id and ps.participant_id = p_participant_id
    and ps.revoked_at is null;
  update public.access_setup_invitations asi set revoked_at = now()
  where asi.target_trip_access_id = v_trip_access_id
    and asi.consumed_at is null and asi.revoked_at is null;
end;
$function$;

create or replace function app.revoke_guest_workspace_access(p_workspace_id uuid)
returns void language plpgsql security definer set search_path = ''
as $function$
declare v_workspace_access_id uuid;
begin
  if not app.has_platform_permission('manage_platform_access') then raise exception 'forbidden'; end if;
  select gwa.id into v_workspace_access_id
  from public.guest_workspace_access gwa where gwa.workspace_id = p_workspace_id;
  if not found then raise exception 'traveler_access_not_found'; end if;
  update public.guest_workspace_access gwa set is_active = false
  where gwa.id = v_workspace_access_id;
  update public.guest_workspace_sessions gws set revoked_at = now()
  where gws.access_id = v_workspace_access_id and gws.workspace_id = p_workspace_id
    and gws.revoked_at is null;
  update public.access_setup_invitations asi set revoked_at = now()
  where asi.target_workspace_access_id = v_workspace_access_id
    and asi.consumed_at is null and asi.revoked_at is null;
end;
$function$;

-- Audit metadata stays within the caller's authority and contains no secrets.
create or replace function app.list_access_setup_invitations()
returns table(
  invitation_type text,
  target_name text,
  invitation_status text,
  created_at timestamptz,
  expires_at timestamptz,
  consumed_at timestamptz
)
language sql stable security definer set search_path = ''
as $function$
  select
    asi.invitation_type,
    coalesce(companion.display_name, workspace_access.display_name),
    case
      when asi.consumed_at is not null then 'completed'
      when asi.revoked_at is not null then 'revoked'
      when asi.expires_at <= now() then 'expired'
      else 'pending'
    end,
    asi.created_at, asi.expires_at, asi.consumed_at
  from public.access_setup_invitations asi
  left join public.participants companion on companion.id = asi.target_participant_id
  left join public.guest_workspace_access workspace_access
    on workspace_access.id = asi.target_workspace_access_id
  where (
    asi.invitation_type = 'trip_companion'
    and asi.target_trip_id = app.current_trip_id()
    and app.can_manage_trip_participants()
  ) or (
    asi.invitation_type = 'independent_traveler'
    and app.has_platform_permission('manage_platform_access')
  )
  order by asi.created_at desc;
$function$;

-- Explicitly disable known plaintext/incomplete entry points; do not discover
-- and alter unrelated future functions.
do $disable_legacy_pin_issuers$
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
  if to_regprocedure('app.complete_guest_workspace_setup(text,text)') is not null then
    execute 'revoke execute on function app.complete_guest_workspace_setup(text, text) from public, anon, authenticated';
  end if;
  if to_regprocedure('app.issue_guest_workspace_pin_reset(uuid,timestamp with time zone,timestamp with time zone)') is not null then
    execute 'revoke execute on function app.issue_guest_workspace_pin_reset(uuid, timestamptz, timestamptz) from public, anon, authenticated';
  end if;
end
$disable_legacy_pin_issuers$;

revoke execute on function app.new_private_setup_token() from public, anon, authenticated;
revoke execute on function app.validate_setup_expiry(timestamptz) from public, anon, authenticated;
revoke execute on function app.validate_private_pin(text) from public, anon, authenticated;
revoke execute on function app.issue_trip_companion_invitation(text, jsonb, timestamptz, timestamptz) from public;
revoke execute on function app.issue_independent_traveler_invitation(text, timestamptz, timestamptz) from public;
revoke execute on function app.inspect_access_setup_invitation(text) from public;
revoke execute on function app.complete_access_setup_invitation(text, text) from public;
revoke execute on function app.issue_trip_companion_pin_reset(uuid, timestamptz) from public;
revoke execute on function app.issue_independent_traveler_pin_reset(uuid, timestamptz) from public;
revoke execute on function app.list_access_setup_invitations() from public;

grant execute on function app.issue_trip_companion_invitation(text, jsonb, timestamptz, timestamptz) to anon, authenticated;
grant execute on function app.issue_independent_traveler_invitation(text, timestamptz, timestamptz) to anon, authenticated;
grant execute on function app.inspect_access_setup_invitation(text) to anon, authenticated;
grant execute on function app.complete_access_setup_invitation(text, text) to anon, authenticated;
grant execute on function app.issue_trip_companion_pin_reset(uuid, timestamptz) to anon, authenticated;
grant execute on function app.issue_independent_traveler_pin_reset(uuid, timestamptz) to anon, authenticated;
grant execute on function app.list_access_setup_invitations() to anon, authenticated;
