-- Track whether the user has chosen a password in the app (after magic-link signup).
-- Apply in Supabase SQL Editor after 005.
--
-- For users who already have a password set in the Dashboard, mark them done:
--   update public.profiles set password_set = true where email = 'you@example.com';

alter table public.profiles
  add column if not exists password_set boolean not null default false;

create or replace function public.mark_password_set()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  update public.profiles
  set password_set = true
  where id = auth.uid();
end;
$$;

revoke all on function public.mark_password_set() from public;
grant execute on function public.mark_password_set() to authenticated;
