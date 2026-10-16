# Security Policy (SECURITY.md)

## 1. Threat Model & Principles

Purano Dhun takes security, privacy, and content rights seriously. The application adheres to defense-in-depth principles:

1. **Zero Media Extraction**: The system never downloads, extracts audio streams, re-hosts, or circumvents access controls of external providers. All music playback occurs strictly via client-side official YouTube IFrame embeds.
2. **Server-Side Authorization**: Administrative capabilities (adding songs, moderating takedowns, changing publication status) live in `SECURITY DEFINER` SQL functions that first check the `public.admins` allowlist (`is_admin()`). Every browser-facing table has row-level security enabled with **zero policies**, so the `anon` and `authenticated` roles cannot read or write a single row directly — all access flows through the audited RPC surface. No client-side checks are trusted.
3. **No Secrets in Frontend**: The client bundle only ever holds the **anon** public key (designed to be public and constrained by RLS). The Supabase `service_role` key and database credentials never ship to the browser.
4. **Injection Defenses**:
   - All queries are executed as parameterized SQL inside stored functions; no string-built queries anywhere in the RPC layer.
   - React contextual escaping prevents XSS. No `dangerouslySetInnerHTML` is used with untrusted user input.
5. **Auth & Transport**:
   - Supabase Auth issues short-lived JWTs over HTTPS; anonymous sign-ins are pseudonymous (no personal data) and used only for guest favorites/telemetry.
   - Supabase enforces TLS on all endpoints and rate-limits auth attempts (login brute-force protection).
6. **Rate Limiting**:
   - Supabase free tier enforces project-level API rate limits; the frontend additionally never polls the API faster than user interactions trigger it.

---

## 2. Environment Configuration

- **Local development**: `.env` / `.env.local` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (see `.env.example`).
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
