-- Profiles, trip members, invite join RPC, updated RLS
-- Apply after 001_trips.sql in Supabase SQL Editor

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'member'
    check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Role changes only via SQL Dashboard (service role), never from the client.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'member')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill existing auth users
insert into public.profiles (id, email, role)
select id, email, 'member'
from auth.users
on conflict (id) do nothing;

-- Promote an admin (run manually):
-- update public.profiles set role = 'admin' where email = 'you@example.com';

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Trip members
-- ---------------------------------------------------------------------------
create table if not exists public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'editor'
    check (role in ('owner', 'editor')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index if not exists trip_members_user_id_idx on public.trip_members (user_id);

alter table public.trip_members enable row level security;

create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_trip_owner(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

drop policy if exists "Members can read trip_members" on public.trip_members;
create policy "Members can read trip_members"
  on public.trip_members for select
  using (public.is_trip_member(trip_id));

drop policy if exists "Owners can delete trip_members" on public.trip_members;
create policy "Owners can delete trip_members"
  on public.trip_members for delete
  using (
    public.is_trip_owner(trip_id)
    and role <> 'owner'
  );

-- Inserts into trip_members go through security-definer functions / triggers

-- ---------------------------------------------------------------------------
-- Auto-add owner on trip create
-- ---------------------------------------------------------------------------
create or replace function public.handle_trip_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (trip_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_trip_created on public.trips;
create trigger on_trip_created
  after insert on public.trips
  for each row execute procedure public.handle_trip_created();

-- Backfill members for existing trips
insert into public.trip_members (trip_id, user_id, role)
select id, owner_id, 'owner'
from public.trips
on conflict (trip_id, user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Replace trips RLS (membership-based)
-- ---------------------------------------------------------------------------
drop policy if exists "Owners can select own trips" on public.trips;
drop policy if exists "Owners can insert own trips" on public.trips;
drop policy if exists "Owners can update own trips" on public.trips;
drop policy if exists "Owners can delete own trips" on public.trips;

create policy "Members can select trips"
  on public.trips for select
  using (public.is_trip_member(id));

create policy "Admins can insert trips"
  on public.trips for insert
  with check (
    auth.uid() = owner_id
    and public.is_app_admin()
  );

create policy "Members can update trips"
  on public.trips for update
  using (public.is_trip_member(id))
  with check (public.is_trip_member(id));

create policy "Owners can delete trips"
  on public.trips for delete
  using (public.is_trip_owner(id));

-- Members may update board_json; only owners may change share / ownership fields.
create or replace function public.protect_trip_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;

  if (new.share_token is distinct from old.share_token)
     or (new.share_mode is distinct from old.share_mode) then
    if not public.is_trip_owner(old.id) then
      raise exception 'Only the trip owner can change invite settings';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_trip_protect_columns on public.trips;
create trigger on_trip_protect_columns
  before update on public.trips
  for each row execute procedure public.protect_trip_privileged_columns();

-- ---------------------------------------------------------------------------
-- Join via invite token (authenticated)
-- ---------------------------------------------------------------------------
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

-- Owner-only share token management
create or replace function public.set_trip_share_token(p_trip_id uuid, p_enable boolean)
returns table (
  share_token text,
  share_mode text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  if not public.is_trip_owner(p_trip_id) then
    raise exception 'Only the trip owner can manage invite links';
  end if;

  if p_enable then
    v_token := replace(gen_random_uuid()::text, '-', '');
    update public.trips
    set
      share_token = v_token,
      share_mode = 'edit',
      updated_at = now()
    where id = p_trip_id;
  else
    update public.trips
    set
      share_token = null,
      share_mode = 'off',
      updated_at = now()
    where id = p_trip_id;
    v_token := null;
  end if;

  return query
  select t.share_token, t.share_mode
  from public.trips t
  where t.id = p_trip_id;
end;
$$;

revoke all on function public.set_trip_share_token(uuid, boolean) from public;
grant execute on function public.set_trip_share_token(uuid, boolean) to authenticated;

-- List members with emails (for trip profile)
create or replace function public.list_trip_members(p_trip_id uuid)
returns table (
  user_id uuid,
  email text,
  role text,
  joined_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select m.user_id, p.email, m.role, m.joined_at
  from public.trip_members m
  left join public.profiles p on p.id = m.user_id
  where m.trip_id = p_trip_id
    and public.is_trip_member(p_trip_id)
  order by
    case when m.role = 'owner' then 0 else 1 end,
    m.joined_at;
$$;

revoke all on function public.list_trip_members(uuid) from public;
grant execute on function public.list_trip_members(uuid) to authenticated;

create or replace function public.remove_trip_member(p_trip_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_trip_owner(p_trip_id) then
    raise exception 'Only the trip owner can remove members';
  end if;

  delete from public.trip_members
  where trip_id = p_trip_id
    and user_id = p_user_id
    and role <> 'owner';
end;
$$;

revoke all on function public.remove_trip_member(uuid, uuid) from public;
grant execute on function public.remove_trip_member(uuid, uuid) to authenticated;

-- Deprecate anonymous board edits: revoke from anon
revoke all on function public.get_trip_by_share_token(text) from public;
revoke all on function public.get_trip_by_share_token(text) from anon;
revoke all on function public.update_trip_by_share_token(text, jsonb) from public;
revoke all on function public.update_trip_by_share_token(text, jsonb) from anon;
revoke all on function public.update_trip_by_share_token(text, jsonb) from authenticated;
