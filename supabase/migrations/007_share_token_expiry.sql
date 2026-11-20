-- Invite links: admin-only + 30 minute expiry.
-- Apply in Supabase SQL Editor after 006.

alter table public.trips
  add column if not exists share_token_expires_at timestamptz;

-- Owners (or anyone) updating share fields must be app admin.
create or replace function public.protect_trip_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;

  if (new.share_token is distinct from old.share_token)
     or (new.share_mode is distinct from old.share_mode)
     or (new.share_token_expires_at is distinct from old.share_token_expires_at) then
    if not public.is_app_admin() then
      raise exception 'Only app admins can change invite settings';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.join_trip_by_share_token(p_token text)
returns table (
  id uuid,
  title text,
  board_json jsonb,
  share_mode text,
  updated_at timestamptz,
  member_role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.trips%rowtype;
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'Invalid share token';
  end if;

  select * into v_trip
  from public.trips t
  where t.share_token = p_token
    and t.share_mode in ('read', 'edit')
  limit 1;

  if not found then
    raise exception 'Invite link invalid or disabled';
  end if;

  if v_trip.share_token_expires_at is not null
     and v_trip.share_token_expires_at < now() then
    update public.trips
    set
      share_token = null,
      share_mode = 'off',
      share_token_expires_at = null,
      updated_at = now()
    where id = v_trip.id;
    raise exception 'Invite link expired';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (v_trip.id, auth.uid(), 'editor')
  on conflict (trip_id, user_id) do nothing;

  select m.role into v_role
  from public.trip_members m
  where m.trip_id = v_trip.id and m.user_id = auth.uid();

  return query
  select
    v_trip.id,
    v_trip.title,
    v_trip.board_json,
    v_trip.share_mode,
    v_trip.updated_at,
    v_role;
end;
$$;

revoke all on function public.join_trip_by_share_token(text) from public;
grant execute on function public.join_trip_by_share_token(text) to authenticated;

-- Return type changed (added share_token_expires_at) — must drop first.
drop function if exists public.set_trip_share_token(uuid, boolean);

create or replace function public.set_trip_share_token(p_trip_id uuid, p_enable boolean)
returns table (
  share_token text,
  share_mode text,
  share_token_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_expires timestamptz;
begin
  if not public.is_app_admin() then
    raise exception 'Only app admins can manage invite links';
  end if;

  if not exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip_id and m.user_id = auth.uid()
  ) then
    raise exception 'Not a member of this trip';
  end if;

  if p_enable then
    v_token := replace(gen_random_uuid()::text, '-', '');
    v_expires := now() + interval '30 minutes';
    update public.trips
    set
      share_token = v_token,
      share_mode = 'edit',
      share_token_expires_at = v_expires,
      updated_at = now()
    where id = p_trip_id;
  else
    update public.trips
    set
      share_token = null,
      share_mode = 'off',
      share_token_expires_at = null,
      updated_at = now()
    where id = p_trip_id;
    v_token := null;
    v_expires := null;
  end if;

  return query
  select t.share_token, t.share_mode, t.share_token_expires_at
  from public.trips t
  where t.id = p_trip_id;
end;
$$;

revoke all on function public.set_trip_share_token(uuid, boolean) from public;
grant execute on function public.set_trip_share_token(uuid, boolean) to authenticated;
