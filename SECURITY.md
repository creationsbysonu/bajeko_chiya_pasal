# Security Policy (SECURITY.md)

## 1. Threat Model & Principles

Purano Dhun takes security, privacy, and content rights seriously. The application adheres to defense-in-depth principles:

1. **Zero Media Extraction**: The system never downloads, extracts audio streams, re-hosts, or circumvents access controls of external providers. All music playback occurs strictly via client-side official YouTube IFrame embeds.
2. **Server-Side Authorization**: Administrative capabilities (adding songs, moderating takedowns, changing publication status) live in `SECURITY DEFINER` SQL functions that first check the `public.admins` allowlist (`is_admin()`). Every browser-facing table has row-level security enabled with **zero policies**, so the `anon` and `authenticated` roles cannot read or write a single row directly — all access flows through the audited RPC surface. No client-side checks are trusted.
   - **RLS is not enough on its own** — row-level security protects *tables*, not *functions*. Supabase's PostgREST exposes every function in the `public` schema at `/rest/v1/rpc/<fn>`, and Postgres grants `EXECUTE` on new functions to `PUBLIC` by default. `supabase/migrations/0005_security_hardening.sql` therefore revokes `EXECUTE` on the internal `_`-prefixed helpers (`_audit`, `_song_payload`, `_songs_payload`, `_station_queue_rows`, `_bulk_target_ids`, `_unique_slug`, `_apply_song_payload`) from `public`/`anon`/`authenticated`. Without that revoke, `_audit()` would let anyone forge audit entries, `_song_payload()` would return `draft`/`disputed`/`taken_down` rows that the public RPCs deliberately filter out, and `_station_queue_rows()` would expose a station queue with no allowlist check. The `admin_*` and public RPCs keep working because their nested calls are privilege-checked as the function *owner*, not as the browser role. **Any new function you add to `public` is auto-exposed — revoke it explicitly where you create it if it is not meant to be an endpoint.**
   - `get_takedown_status()` requires the claimant's email and matches it against the ticket: ticket ids are sequential, so an ID-free/IDOR-style lookup would expose status and admin-written `resolution_notes` to anyone walking the ids.
   - The public `get_genre_categories()` ignores its legacy `p_include_inactive` argument and always returns active rows — the toggle that reveals admin-side (inactive) taxonomy now only exists on the allowlist-guarded `admin_genre_categories()`.
3. **No Secrets in Frontend**: The client bundle only ever holds the **anon** public key (designed to be public and constrained by RLS). The Supabase `service_role` key and database credentials never ship to the browser.
4. **Injection Defenses**:
   - All queries are executed as parameterized SQL inside stored functions (bind parameters / `using` clauses); there is no query built by concatenating untrusted input anywhere in the RPC layer.
   - There is exactly one dynamic-identifier site: `public._unique_slug()` builds `execute format('select exists (select 1 from public.%I ...)', p_table)`. It uses `%I` (identifier quoting), never `%s`, so the table name cannot break out into SQL, and since `0005` it is no longer reachable by browser roles. The `ILIKE` search terms in `get_songs()`/`get_artists()` are bound parameters, so they cannot inject SQL — note that `%` and `_` in user search text still act as *wildcards* rather than literals (a cosmetic quirk, not an injection).
   - React contextual escaping prevents XSS. No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `document.write` is used anywhere in `frontend/src`.
   - Public free-text inputs are length-bounded server-side (`log_playback_event.error_message` ≤ 1000, `submit_takedown.details` ≤ 5000, `claimant_name` ≤ 200, `claimant_email` ≤ 320) so unauthenticated callers cannot bloat the tables with oversized rows.
5. **Auth & Transport**:
   - Supabase Auth issues short-lived JWTs over HTTPS; anonymous sign-ins are pseudonymous (no personal data) and used only for guest favorites/telemetry.
   - Supabase enforces TLS on all endpoints and rate-limits auth attempts (login brute-force protection).
6. **Rate Limiting** (three layers, all enforced server-side):
   - **Supabase** enforces project-level API rate limits and login brute-force limits.
   - **Database** (`supabase/migrations/0006_abuse_controls.sql`): `submit_takedown()` accepts at most **5 tickets/hour per claimant email or reporter session**; `log_playback_event()` **requires an identified listener session**, counts a play **at most once per song/listener/30 minutes**, and silently drops further events from any listener writing **more than 120 rows/minute**. Public free-text payloads are length-bounded (see §4).
   - **Client**: the frontend never polls faster than user interactions trigger it.
7. **Browser Hardening**: `frontend/vercel.json` sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Strict-Transport-Security`, and a **resource-restricting** `Content-Security-Policy` (`script-src` limited to `'self'` plus the YouTube IFrame API hosts; `object-src 'none'`; `base-uri 'self'`; `frame-ancestors 'none'`; `form-action 'self'`). The service worker (`frontend/public/sw.js`) only caches same-origin **static** assets — hashed bundles, icons and files with a real extension — never arbitrary SPA routes or JSON. See §5.4 for the one browser check this CSP still needs.

---

## 2. Environment Configuration

- **Local development**: `frontend/.env.local` (git-ignored) with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (see `.env.example`). No credential files live at the repo root.
- **Production**:
  - Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured in Vercel.
  - Supabase project settings: HTTPS-only API, JWT expiry defaults, RLS enabled on every table (enforced by `supabase/migrations/0004_rls.sql`).
  - Admin access requires both a Supabase Auth session **and** a row in `public.admins`.

---

## 3. Audit Logging & Governance

- All critical actions (`SONG_CREATED`, `SONG_UPDATED`, `SONG_UNPUBLISHED`, `TAKEDOWN_SUBMITTED`, moderation decisions, bulk operations, queue changes) are automatically recorded in the `audit_logs` table with timestamp, actor (admin email prefix or `public_reporter`), and target entity IDs. The audit log itself is admin-only (`admin_audit_logs()` checks the allowlist).

---

## 4. Reporting Security Vulnerabilities

If you discover a security vulnerability in Purano Dhun:
- Please send a detailed email to **security@puranodhun.org**.
- Do not publicly disclose the issue until it has been reviewed and addressed.
- Our team will acknowledge receipt within 48 hours and work on remediation.

---

## 5. Known Limitations (hardening backlog)

Stated honestly rather than claimed as solved. The free, unauthenticated
vectors that mattered most are now closed in `0005`/`0006` (helper RPC exposure,
takedown IDOR, unbounded payloads, `play_count` manipulation, takedown spam,
public taxonomy leak, missing security headers). What deliberately remains:

1. **Anonymous sessions can still be minted without limit.**
   `ensureListenerSession()` signs guests in anonymously, so a determined caller
   can create many `auth.users` rows. That raises the *cost* of inflating
   `play_count` (one anonymous session per increment, throttled by Supabase Auth
   rate limits) rather than making it impossible — with an open guest-login
   design there is no free fix. If this ever matters, move to a cookie-backed
   session key or per-IP quotas at an edge gateway.
2. **No per-IP throttling inside SQL.** PostgREST does not portably expose the
   client IP to a stored function, so the limits in §6 key off `auth.uid()` and
   the claimant email instead. Per-IP quotas need an Edge Function / gateway in
   front of the RPC surface.
3. **`playback_events` still grows over time.** The flood guard caps it at
   ~120 rows/minute/listener, not overall — keep the monthly prune documented at
   the bottom of DEPLOY.md, or schedule it with `pg_cron`.
4. **The CSP must be browser-verified before you rely on it.**
   `frontend/vercel.json` now ships a full resource-restricting CSP, but it
   cannot be exercised from a test suite. After deploying, load the site, play a
   track, and check the console for CSP violations. Two things to check
   specifically: `connect-src` allows only `https://*.supabase.co` /
   `wss://*.supabase.co`, so **a custom or self-hosted Supabase domain must be
   added there**; and `script-src` allows `www.youtube.com` + `s.ytimg.com` for
   the IFrame API. If playback ever breaks, remove the `Content-Security-Policy`
   header and re-tighten incrementally.
5. **`service_role` bypasses all of this by design** (BYPASSRLS + full function
   access). It is only safe because it never ships to the browser — treat a leak
   of that key as a full compromise and rotate it immediately.
