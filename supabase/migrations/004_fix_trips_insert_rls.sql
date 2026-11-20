-- Fix: "new row violates row-level security policy for table trips"
-- Usually: user is not admin, or is_app_admin()/grants are wrong.
-- Run in Supabase SQL Editor.

-- 1) Ensure helper works for RLS
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

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

-- 2) Recreate insert policy (admin + owner_id = auth.uid())
drop policy if exists "Admins can insert trips" on public.trips;
create policy "Admins can insert trips"
  on public.trips for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and public.is_app_admin()
  );

-- 3) Allow trip_members insert via trigger path (backup policy)
drop policy if exists "Owners can insert themselves as owner" on public.trip_members;
create policy "Owners can insert themselves as owner"
  on public.trip_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1 from public.trips t
      where t.id = trip_id and t.owner_id = auth.uid()
    )
  );

grant insert on table public.trip_members to authenticated;

-- 4) Promote YOUR user to admin (edit the email), then verify:
-- update public.profiles set role = 'admin' where email = 'tu@email.com';
-- select id, email, role from public.profiles;
