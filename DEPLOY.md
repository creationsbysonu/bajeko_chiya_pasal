# Deploying Purano Dhun (Supabase + Vercel)

The app is a React SPA (Vercel) talking directly to Supabase — Postgres plus
a locked-down RPC layer that replaces the old Django API. There is no
traditional backend server anymore, so there is nothing to cold-start.

## Why this is fast

- **Vercel** serves the SPA from a global CDN. No spin-down, no 60s cold start.
- **Supabase** Postgres free tier does not wipe your data (the old Render free
  Postgres was erased every 90 days). It pauses a project after ~7 days of
  complete inactivity and wakes it in about 2 minutes — visiting the site
  (or a daily visit) keeps it warm.
- Admin RPCs are plain SQL functions: ~single-digit-ms cold-less execution.

---

## 1. Create the Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**.
2. Pick a name/region, save the database password somewhere safe.
3. Note the two values under **Settings → API**:
   - `Project URL` → becomes `VITE_SUPABASE_URL`
   - `anon public` key → becomes `VITE_SUPABASE_ANON_KEY`

   (The `service_role` key must never reach the frontend.)

## 2. Apply the schema, functions, and seed

In order, run each file's contents in the **SQL Editor** (New query → paste →
Run), or use the Supabase CLI from the repo root:

```bash
supabase link --project-ref <your-project-ref>
supabase db push          # applies supabase/migrations/*
# then paste supabase/seed.sql into the SQL editor (or: supabase db execute -f supabase/seed.sql)
```

Files, in order:

1. `supabase/migrations/0001_schema.sql` — tables + indexes
2. `supabase/migrations/0002_functions_public.sql` — catalog/favorites/takedown RPCs
3. `supabase/migrations/0003_functions_admin.sql` — admin RPCs (allowlist-guarded)
4. `supabase/migrations/0004_rls.sql` — deny-all row-level security on every table
5. `supabase/migrations/0005_security_hardening.sql` — revokes EXECUTE on the
   internal `_`-prefixed helpers, requires the claimant email for takedown
   status lookups, bounds free-text inputs
6. `supabase/migrations/0006_abuse_controls.sql` — abuse controls: identified +
   deduplicated + flood-capped playback telemetry, a 5/hour takedown rate limit,
   and active-only reads of the public genre taxonomy
7. `supabase/migrations/0007_festival_features.sql` — festival taxonomy
   (`festival_categories`), a nullable `songs.festival_id`, and the festival
   RPCs
8. `supabase/migrations/0008_festival_calendar.sql` — `festival_dates`, every
   major Nepali festival, per-festival `mood_tags`, `get_festival_calendar()`,
   and the calendar-aware `get_festival_songs()`
9. `supabase/migrations/0009_song_requests.sql` — the public **"Recommend a
   song"** workflow: `song_requests` (RLS-locked), a validated/throttled
   `submit_song_request()`, a contact-free `get_song_requests_recent()` feed,
   and the admin moderation RPCs (`admin_song_requests`,
   `admin_song_request_action`)
10. `supabase/seed.sql` — the full catalog (224 songs, 116 artists, 10 stations,
    23 festivals, taxonomies)

> **Already deployed?** Run the new migrations once (`supabase db push` applies
> `0007` + `0008` + `0009`). Because `supabase/seed.sql` is only safe on an empty
> database, existing installs should instead paste the generated
> **`supabase/deploy/upgrade_festive.sql`** into the SQL Editor — it bundles
> `0007` + `0008` + `0009` + just the festival rows, and is safe to re-run.
> Regenerate it after changing the seed or migrations with
> `cd supabase && npm run build:upgrade` (`npm run verify:upgrade` proves it
> upgrades a pre-festival database).

> `supabase/seed.sql` is idempotent only on an **empty** database; it pins ids.

## 3. Enable anonymous sign-ins

**Authentication → Providers → Anonymous users → Enable.**

This is how guest listeners get a stable identity for favorites and playback
telemetry (it replaces the old `X-Session-Key` header). If you skip this step
the catalog still works; favorites silently no-op for logged-out visitors.

## 4. Create the admin account

**Authentication → Users → Add user** → set an email + password, leave
"Auto confirm user" checked. Then allowlist that user for the admin portal
(SQL Editor):

```sql
insert into public.admins (user_id, email)
select id, email from auth.users where email = 'you@example.com'
on conflict do nothing;
```

Only ids in `public.admins` can call the `admin_*` RPCs or read the audit
log — signing into Supabase Auth alone is not enough. To remove an admin
later, delete their row from `public.admins` (and disable the auth user).

Password changes happen in the admin portal (Security tab) or the Supabase
dashboard. The old Django captcha is gone — Supabase Auth rate-limits logins.

## 5. Deploy the frontend to Vercel

1. <https://vercel.com/new> → import the repo.
2. Set **Root Directory** to `frontend` (the SPA lives there).
3. Add the environment variables (Production + Preview):
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon key
4. Deploy. Every push to `main` redeploys automatically; CI (tests + SQL
   suite) runs on GitHub in parallel.

Custom domain later: add it under Project → Settings → Domains.

## 6. Local development

Option A — point at the cloud project: copy `.env.example` to
`frontend/.env.local` (or `frontend/.env`) and fill in the cloud values, then
`npm run dev` in `frontend/`. Both filenames are git-ignored.

Option B — fully local (needs Docker + Supabase CLI):

```bash
supabase start          # local Postgres + Auth + REST on 127.0.0.1:54321
supabase db reset       # applies migrations + seed.sql
cd frontend && npm run dev
```

The SQL verification suite (the old Django tests' replacement) runs anywhere,
no Docker needed:

```bash
cd supabase && npm install && npm run verify && npm run verify:upgrade
```

## 7. Cut over from Render

The repo no longer contains the Django backend, `render.yaml`, or the Docker
compose files, so new deploys only go to Vercel/Supabase. When you're happy
with the Vercel URL:

1. Point your custom domain at Vercel (or update links).
2. Delete the old Render services so nobody hits the stale API.
3. Export/download the Render Postgres data if you want a final backup, then
   delete the Render database.

## Regenerating the seed

`supabase/seed.sql` was generated from the legacy dev database with
`python3 supabase/tools/generate_seed.py`. It reads `legacy-dev-catalog.sqlite3`
at the repo root by default (kept out of git by `*.sqlite3`), or you can pass a
path: `python3 supabase/tools/generate_seed.py path/to/catalog.sqlite3`. The old
`backend/` Django directory is gone from the repo but recoverable from git
history (`git show <sha>:backend/...`) if you ever need it.

## Free-tier notes

- Supabase free: 500 MB DB, 5 GB egress, paused after 7 days idle (~2 min to
  wake). Hobby Vercel: personal/non-commercial use only.
- Anonymous sign-ins count toward the MAU limit (generous on free tier).
- `playback_events` grows unbounded; a monthly
  `delete from public.playback_events where timestamp < now() - interval '90 days';`
  keeps the free DB small.
