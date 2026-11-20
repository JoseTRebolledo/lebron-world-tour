-- LeBron World Tour: trips table + RLS + share RPCs
-- Apply in Supabase Dashboard → SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'LeBron World Tour',
  board_json jsonb not null,
  share_token text unique,
  share_mode text not null default 'off'
    check (share_mode in ('off', 'read', 'edit')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists trips_owner_id_idx on public.trips (owner_id);
create index if not exists trips_share_token_idx on public.trips (share_token)
  where share_token is not null;

alter table public.trips enable row level security;

drop policy if exists "Owners can select own trips" on public.trips;
create policy "Owners can select own trips"
  on public.trips for select
  using (auth.uid() = owner_id);

drop policy if exists "Owners can insert own trips" on public.trips;
create policy "Owners can insert own trips"
  on public.trips for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can update own trips" on public.trips;
create policy "Owners can update own trips"
  on public.trips for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can delete own trips" on public.trips;
create policy "Owners can delete own trips"
  on public.trips for delete
  using (auth.uid() = owner_id);

-- Share access via security-definer RPCs (token never exposed via open RLS)

create or replace function public.get_trip_by_share_token(p_token text)
returns table (
  id uuid,
  title text,
  board_json jsonb,
  share_mode text,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select t.id, t.title, t.board_json, t.share_mode, t.updated_at
  from public.trips t
  where t.share_token = p_token
    and t.share_mode in ('read', 'edit')
  limit 1;
$$;

create or replace function public.update_trip_by_share_token(
  p_token text,
  p_board_json jsonb
)
returns table (
  id uuid,
  title text,
  board_json jsonb,
  share_mode text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.trips t
  set
    board_json = p_board_json,
    updated_at = now()
  where t.share_token = p_token
    and t.share_mode = 'edit'
  returning t.id, t.title, t.board_json, t.share_mode, t.updated_at;
end;
$$;

revoke all on function public.get_trip_by_share_token(text) from public;
revoke all on function public.update_trip_by_share_token(text, jsonb) from public;
grant execute on function public.get_trip_by_share_token(text) to anon, authenticated;
grant execute on function public.update_trip_by_share_token(text, jsonb) to anon, authenticated;
