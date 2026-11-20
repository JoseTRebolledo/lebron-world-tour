-- Table privileges for authenticated clients (RLS still applies)
-- Run in Supabase SQL Editor if you see: permission denied for table trips

grant usage on schema public to anon, authenticated;

grant select on table public.profiles to authenticated;

grant select, insert, update, delete on table public.trips to authenticated;

grant select, delete on table public.trip_members to authenticated;
-- inserts into trip_members go through security-definer triggers/RPCs

grant execute on function public.is_app_admin() to authenticated;
grant execute on function public.is_trip_member(uuid) to authenticated;
grant execute on function public.is_trip_owner(uuid) to authenticated;
grant execute on function public.join_trip_by_share_token(text) to authenticated;
grant execute on function public.set_trip_share_token(uuid, boolean) to authenticated;
grant execute on function public.list_trip_members(uuid) to authenticated;
grant execute on function public.remove_trip_member(uuid, uuid) to authenticated;
