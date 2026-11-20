# Deploy: Supabase + Vercel

## 1. Supabase

1. Create a free project at https://supabase.com
2. SQL Editor → run in order:
   - `supabase/migrations/001_trips.sql`
   - `supabase/migrations/002_profiles_members.sql`
   - `supabase/migrations/003_table_grants.sql` (fixes `permission denied for table trips`)
3. Promote yourself to **admin** (only admins can create trips):

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';

select id, email, role from public.profiles;
```

If create-trip fails with RLS on `trips`:
- run `004_fix_trips_insert_rls.sql`
- run `005_fix_trips_select_returning.sql` (fixes RETURNING/select after insert)
- confirm your profile row shows `role = admin`

4. Authentication → URL Configuration → Redirect URLs:
   - `http://localhost:3011`
   - `http://localhost:3011/**`
   - `https://YOUR_VERCEL_DOMAIN.vercel.app`
   - `https://YOUR_VERCEL_DOMAIN.vercel.app/**`
5. Project Settings → API → copy **Project URL** and **anon public** key

### Access model

| Role | Can create trips | Can invite |
|------|------------------|------------|
| `profiles.role = admin` | Yes | As trip owner, via invite link |
| `profiles.role = member` | No | Only join via owner invite link |

Invite link = `/?share=<share_token>`. Only app **admins** can generate/revoke it. Links expire after **30 minutes** (`share_token_expires_at`). Recipients must be logged in; opening the link joins them as **editor**. Run migration `007_share_token_expiry.sql`.

## 2. Local env

```bash
cp .env.example .env
# edit .env with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
yarn install
make start
```

Never commit `.env`. Never put the **service_role** key in the frontend.

## 3. Vercel (Hobby / free)

1. Push this repo to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Framework preset: Create React App (or Other)
4. Build command: `yarn build` · Output: `build`
5. Environment Variables (Production + Preview):
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
6. Deploy, then add the production URL to Supabase Redirect URLs

## Auth note

- **Crear cuenta**: magic link → the app asks the user to choose a password once (`profiles.password_set`).
- **Iniciar sesión**: email + password (no email sent).
- Run migration `006_password_set.sql`.
- If you already set a password in the Dashboard for an existing user, mark them done:

```sql
update public.profiles set password_set = true where email = 'you@example.com';
```

- In Supabase → Authentication → Providers → Email: leave Email enabled.
- Magic links land on the app origin; the session is stored by `@supabase/supabase-js` in localStorage.
- Built-in SMTP is ~2 emails/hour — use magic link sparingly (signup only), or configure custom SMTP.
