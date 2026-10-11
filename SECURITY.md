# Security Policy (SECURITY.md)

## 1. Threat Model & Principles

Purano Dhun takes security, privacy, and content rights seriously. The application adheres to defense-in-depth principles:

1. **Zero Media Extraction**: The system never downloads, extracts audio streams, re-hosts, or circumvents access controls of external providers. All music playback occurs strictly via client-side official YouTube IFrame embeds.
2. **Server-Side Authorization**: Administrative capabilities (adding songs, moderating takedowns, changing publication status) are guarded by Django `IsAdminUser` permissions and session authentication. No client-side checks can bypass access controls.
3. **No Secrets in Frontend**: `DJANGO_SECRET_KEY`, database credentials, and internal administrative tokens are isolated on the server and never exposed in the client build bundle.
4. **Injection Defenses**:
   - Django ORM handles all database interactions using parameterized queries.
   - React contextual escaping prevents XSS. No `dangerouslySetInnerHTML` is used with untrusted user input.
5. **CSRF & Cookie Protection**:
   - Cookie authentication adheres to Django CSRF protection with `SameSite=Lax` (or `Strict`), and `Secure=True` in production.
6. **Rate Limiting & Throttling**:
   - Public APIs enforce DRF throttling (`120/min` for anonymous clients, `60/min` for search endpoints) to defend against denial-of-service and catalog scraping.

---

## 2. Environment Configuration

- **Development**: Uses SQLite by default or local PostgreSQL, with CORS enabled for `http://localhost:5173`.
- **Production**:
  - `DJANGO_DEBUG=False`
  - Strict `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`
  - Enforced `SECURE_SSL_REDIRECT=True`
  - HSTS enabled with `SECURE_HSTS_SECONDS=31536000`
  - `SECURE_CONTENT_TYPE_NOSNIFF=True` and `X_FRAME_OPTIONS='DENY'`

---

## 3. Audit Logging & Governance

- All critical actions (`SONG_CREATED`, `SONG_UPDATED`, `SONG_UNPUBLISHED`, `TAKEDOWN_SUBMITTED`, moderation decisions) are automatically recorded to the `AuditLog` table with timestamp, actor username, and target entity IDs.

---

## 4. Reporting Security Vulnerabilities

If you discover a security vulnerability in Purano Dhun:
- Please send a detailed email to **security@puranodhun.org**.
- Do not publicly disclose the issue until it has been reviewed and addressed.
- Our team will acknowledge receipt within 48 hours and work on remediation.
