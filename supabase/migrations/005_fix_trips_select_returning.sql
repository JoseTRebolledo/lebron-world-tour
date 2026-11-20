-- Fix false "violates RLS on trips" when creating a trip.
-- Cause: insert().select() uses RETURNING, which is checked with SELECT policies.
-- Right after insert, is_trip_member() can fail; owner_id = auth.uid() must be allowed.

drop policy if exists "Members can select trips" on public.trips;
create policy "Members can select trips"
  on public.trips for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.is_trip_member(id)
  );

-- Reliable create path for admins (bypasses RETURNING RLS quirks)
create or replace function public.create_trip(
  p_title text default 'LeBron World Tour',
  p_board_json jsonb default '{}'::jsonb
)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.trips;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_app_admin() then
    raise exception 'Only admins can create trips';
  end if;

  insert into public.trips (owner_id, title, board_json, share_mode)
  values (auth.uid(), coalesce(nullif(trim(p_title), ''), 'LeBron World Tour'), p_board_json, 'off')
  returning * into v_trip;

  return v_trip;
end;
$$;

revoke all on function public.create_trip(text, jsonb) from public;
grant execute on function public.create_trip(text, jsonb) to authenticated;
