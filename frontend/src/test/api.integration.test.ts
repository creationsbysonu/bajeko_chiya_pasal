/**
 * End-to-end contract test for the Supabase-backed API client.
 *
 * Exercises the REAL `services/api.ts` + `@supabase/supabase-js` code path
 * against a faithful local stand-in for the hosted stack:
 *
 *   - Postgres: PGlite (real SQL) with the actual repo migrations + seed
 *   - PostgREST: fetch bridge implementing `POST /rest/v1/rpc/<fn>` semantics
 *     (JSON named args, role switching, JWT claims -> auth.uid(), error shape)
 *   - GoTrue: fetch bridge for anonymous/password grants, logout, updateUser
 *
 * This is the browser-facing interface test: it proves the shipped client
 * serializes arguments, carries the right identity, and unwraps responses the
 * way the deployed Supabase project will.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');

let db: PGlite;
let api: (typeof import('../services/api'))['api'];
let supabaseClient: (typeof import('../services/api'))['supabase'];

const TEST_ADMIN = { email: 'admin@test.local', password: 'correct-horse-battery' };
const TEST_LISTENER = { email: 'someone@test.local', password: 'irrelevant-pw' };

/** email -> plaintext password (test-only stand-in for GoTrue hashing) */
const passwords = new Map<string, string>([
  [TEST_ADMIN.email, TEST_ADMIN.password],
  [TEST_LISTENER.email, TEST_LISTENER.password],
]);

function b64url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function makeToken(claims: Record<string, unknown>): string {
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(claims)}.sig`;
}

function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function userObject(id: string, email: string) {
  const now = new Date().toISOString();
  return {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: now,
    created_at: now,
    updated_at: now,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    identities: [],
    is_anonymous: false,
  };
}

async function sql(query: string, params?: unknown[]) {
  const res = await db.query(query, params);
  return res.rows;
}

async function script(text: string) {
  await db.exec(text);
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Minimal GoTrue: anonymous + password grants, logout, updateUser. */
async function handleAuth(pathname: string, request: Request): Promise<Response> {
  const url = new URL(pathname, 'http://local');
  const endpoint = url.pathname.replace(/^.*\/auth\/v1\//, '');

  if (endpoint === 'token') {
    const contentType = request.headers.get('content-type') ?? '';
    const rawBody = await request.clone().text().catch(() => '');
    if (process.env.BRIDGE_DEBUG) {
      console.log('[bridge] token request:', url.href, '| ct:', contentType, '| body:', rawBody.slice(0, 200));
    }
    let body: Record<string, any> = {};
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      body = Object.fromEntries(new URLSearchParams(rawBody));
    }
    // GoTrue accepts grant_type either as query param or JSON body.
    const grant = url.searchParams.get('grant_type') ?? (body.grant_type as string | undefined);
    const isPassword = grant === 'password' || grant === 'password_credentials';
    const isAnonymous = grant === 'anonymous_credentials' || grant === 'anonymous';

    if (isAnonymous) {
      const id = crypto.randomUUID();
      await sql(
        `insert into auth.users (email, raw_user_meta_data)
         values ($1, '{"anonymous": true}'::jsonb) returning id`,
        [`anon-${id}@anon.local`],
      );
      const claims = { sub: id, role: 'authenticated' };
      return json(200, {
        access_token: makeToken(claims),
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: `refresh-${id}`,
        user: userObject(id, `anon-${id}@anon.local`),
      });
    }

    if (isPassword) {
      const expected = passwords.get(body.email);
      if (!expected || expected !== body.password) {
        return json(400, { code: 'invalid_credentials', error_description: 'Invalid login credentials', msg: 'Invalid login credentials' });
      }
      const rows = await sql(`select id from auth.users where email = $1`, [body.email]);
      if (rows.length === 0) return json(400, { code: 'invalid_credentials', error_description: 'Invalid login credentials' });
      const claims = { sub: rows[0].id, role: 'authenticated' };
      return json(200, {
        access_token: makeToken(claims),
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: `refresh-${rows[0].id}`,
        user: userObject(rows[0].id, body.email),
      });
    }

    return json(400, { error: 'unsupported grant type' });
  }

  if (endpoint === 'signup') {
    // Anonymous sign-ins arrive as POST /signup in this supabase-js version;
    // GoTrue (auto-confirm on) answers with a full session.
    const body = await request.json().catch(() => ({}));
    const id = crypto.randomUUID();
    const email = body.email ?? `anon-${id}@anon.local`;
    if (body.password) passwords.set(email, body.password);
    await sql(
      `insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)`,
      [id, email, JSON.stringify(body.data ?? {})],
    );
    const claims = { sub: id, role: 'authenticated' };
    return json(200, {
      access_token: makeToken(claims),
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: `refresh-${id}`,
      user: userObject(id, email),
    });
  }

  if (endpoint === 'logout') return new Response(null, { status: 204 });

  if (endpoint === 'user' && request.method === 'PUT') {
    const claims = decodeToken(String(request.headers.get('Authorization') ?? '').replace('Bearer ', ''));
    if (!claims?.sub) return json(401, { message: 'invalid token' });
    const body = await request.json();
    if (body.password && passwords.has(TEST_ADMIN.email)) {
      // Test-only: only the admin changes their password in these tests.
      passwords.set(TEST_ADMIN.email, body.password);
    }
    const rows = await sql(`select email from auth.users where id = $1`, [claims.sub]);
    return json(200, { user: userObject(String(claims.sub), rows[0]?.email ?? 'x@test.local') });
  }

  return json(404, { message: `unknown auth endpoint: ${endpoint}` });
}

/** Minimal PostgREST for `POST /rest/v1/rpc/<fn>`. */
async function handleRpc(fnName: string, request: Request): Promise<Response> {
  const authHeader = String(request.headers.get('Authorization') ?? '');
  const token = authHeader.replace(/^Bearer /, '');
  const claims = decodeToken(token);

  const body = await request.json().catch(() => ({}));
  const keys = Object.keys(body);
  for (const key of keys) {
    if (!/^[a-z_][a-z0-9_]*$/.test(key)) {
      return json(400, { code: '42601', message: 'invalid parameter name', details: null, hint: null });
    }
  }
  const call = `select public.${fnName}(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')}) as result`;
  const params = keys.map((k) => {
    const v = body[k];
    return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
  });

  try {
    await sql(`reset role`);
    await sql(`select set_config('request.jwt.claims', $1, false)`, [claims ? JSON.stringify(claims) : '']);
    await sql(`set role ${claims?.sub ? 'authenticated' : 'anon'}`);
    const rows = await sql(call, params);
    return json(200, rows[0]?.result ?? null);
  } catch (err) {
    return json(400, {
      code: 'P0001',
      message: err instanceof Error ? err.message : String(err),
      details: null,
      hint: null,
    });
  } finally {
    await sql(`reset role`);
    await sql(`select set_config('request.jwt.claims', '', false)`);
  }
}

beforeAll(async () => {
  db = new PGlite();

  // Supabase prerequisites: roles, grants, auth schema (mirrors verify.mjs).
  await script(`
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
    end $$;
    create schema if not exists auth;
    create table if not exists auth.users (
      id uuid primary key default gen_random_uuid(),
      email text,
      raw_user_meta_data jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      last_sign_in_at timestamptz
    );
    create or replace function auth.uid() returns uuid
    language sql stable as $fn$
      select case
        when coalesce(current_setting('request.jwt.claims', true), '') = '' then null
        else (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
      end;
    $fn$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    grant usage on schema public to anon, authenticated, service_role;
    grant all on all tables in schema public to anon, authenticated, service_role;
    grant usage, select on all sequences in schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
  `);

  const migrations = readdirSync(join(repoRoot, 'supabase', 'migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of migrations) {
    await script(readFileSync(join(repoRoot, 'supabase', 'migrations', file), 'utf8'));
  }
  await script(readFileSync(join(repoRoot, 'supabase', 'seed.sql'), 'utf8'));

  // Test identities: the admin user + allowlist row, and a non-admin listener.
  await sql(`insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', $1)`, [TEST_ADMIN.email]);
  await sql(`insert into public.admins (user_id, email) values ('11111111-1111-1111-1111-111111111111', $1)`, [TEST_ADMIN.email]);
  await sql(`insert into auth.users (id, email) values ('22222222-2222-2222-2222-222222222222', $1)`, [TEST_LISTENER.email]);

  // Route Supabase traffic to the bridge BEFORE importing api.ts, because
  // supabase-js captures the global fetch reference when the client is built.
  const realFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const request = new Request(raw, init);
    const { pathname } = new URL(raw);
    if (process.env.BRIDGE_DEBUG) {
      console.log('[bridge] fetch:', init?.method ?? 'GET', raw.slice(0, 140));
    }

    if (pathname.includes('/auth/v1/')) return handleAuth(raw, request);
    if (pathname.includes('/rest/v1/rpc/')) {
      const fnName = pathname.split('/rest/v1/rpc/')[1].split('?')[0];
      return handleRpc(decodeURIComponent(fnName), request);
    }
    return realFetch(input as RequestInfo, init);
  }) as typeof fetch;

  const mod = await import('../services/api');
  api = mod.api;
  supabaseClient = mod.supabase;
}, 60_000);

afterAll(async () => {
  try {
    await supabaseClient?.auth.signOut();
  } catch {
    // best-effort cleanup
  }
  await db?.close();
});

describe('api.ts end-to-end against PostgREST bridge', () => {
  it('serves the public catalog with the exact legacy response envelopes', async () => {
    const stations = await api.getStations();
    expect(stations).toHaveLength(10);
    expect(stations[0]).toHaveProperty('slug');
    expect(stations[0]).toHaveProperty('songs_count');

    const songs = await api.getSongs();
    expect(songs.count).toBe(349);
    expect(songs.results).toHaveLength(24);
    expect(songs.previous).toBeNull();
    expect(typeof songs.next).toBe('string');
    expect(songs.results[0]).toHaveProperty('artist_name');
    expect(songs.results[0]).toHaveProperty('secondary_genre_names');

    const page2 = await api.getSongs({ page: 2 });
    expect(page2.previous).not.toBeNull();
  });

  it('serves the festival calendar with upcoming-first countdowns', async () => {
    const calendar = await api.getFestivalCalendar();
    expect(calendar.length).toBe(23);
    const first = calendar[0];
    expect(first).toHaveProperty('start_date');
    expect(typeof first.days_until_start).toBe('number');
    // The soonest festival is the one happening now or starting within 20 days.
    expect(first.is_active_window || first.days_until_start <= 20).toBe(true);
    expect(calendar.some((f) => f.is_imminent)).toBe(true);

    const playlist = await api.getFestivalSongs('chhath');
    expect(playlist.dedicated_count).toBeGreaterThanOrEqual(2);
    expect(playlist.results.length).toBeGreaterThanOrEqual(2);
    expect(playlist.results.every((s) => typeof s.provider_video_id === 'string' && s.provider_video_id.length > 0)).toBe(true);
  });

  it('filters, orders, and aggregates taxonomy', async () => {
    const decade = await api.getSongs({ decade: '1970s' });
    expect(decade.count).toBeGreaterThan(0);
    expect(decade.results.every((s) => s.decade === '1970s')).toBe(true);

    const ordered = await api.getSongs({ ordering: 'title' });
    const titles = ordered.results.map((s) => s.title);
    expect([...titles].sort()).toEqual(titles);

    const genres = await api.getGenres();
    expect(genres).toHaveLength(14);
    const categories = await api.getGenreCategories();
    expect(categories).toHaveLength(5);
    expect(categories[0]).toHaveProperty('genres_count');

    const featured = await api.getFeatured();
    expect(featured.stations.length).toBeGreaterThan(0);
    expect(featured.songs).toHaveLength(8);
  });

  it('creates a listener session, favorites, and playback telemetry', async () => {
    const favorites = await api.getFavorites();
    expect(favorites).toEqual([]);

    const target = (await api.getSongs()).results[0];
    const added = await api.addFavorite(target.id);
    expect(added.song.id).toBe(target.id);
    expect(added).toHaveProperty('session_key');

    const listed = await api.getFavorites();
    expect(listed).toHaveLength(1);
    expect(listed[0].song.title).toBe(target.title);

    await api.removeFavorite(target.id);
    expect(await api.getFavorites()).toHaveLength(0);

    const before = await api.getSongDetail(target.id);
    await api.logPlaybackEvent({ event_type: 'start', song: target.id });
    const after = await api.getSongDetail(target.id);
    expect(after.play_count).toBe(before.play_count + 1);
  });

  it('files takedown reports with server-side validation', async () => {
    const target = (await api.getSongs()).results[0];
    const res = await api.submitTakedown({
      song: target.id,
      claimant_name: 'Rights Desk',
      claimant_email: 'rights@example.com',
      reason: 'copyright',
      details: 'Automated contract test',
    });
    expect(typeof res.ticket_id).toBe('number');
    expect(res.message).toContain('received');

    await expect(
      api.submitTakedown({
        song: target.id,
        claimant_name: 'X',
        claimant_email: 'not-an-email',
        reason: 'copyright',
        details: '',
      }),
    ).rejects.toThrow('Failed to submit notice');
  });

  it('collects song recommendations from listeners', async () => {
    const res = await api.submitSongRequest({
      title: 'Contract Test Recommendation',
      artist: 'Nobody',
      youtube_url: 'https://www.youtube.com/watch?v=abcdefghijk',
      festival_slug: 'dashain',
      requester_name: 'Listener One',
      requester_email: 'listener@example.com',
    });
    expect(typeof res.request_id).toBe('number');

    const recent = await api.getRecentSongRequests(5);
    const mine = recent.find((r) => r.title === 'Contract Test Recommendation');
    expect(mine).toBeDefined();
    // The feed carries the festival slug (not an emoji) so the client can draw its glyph.
    expect(mine?.festival_slug).toBe('dashain');
    // The public feed must never leak requester contact details.
    expect((recent[0] as unknown as Record<string, unknown>).requester_email).toBeUndefined();

    await expect(
      api.submitSongRequest({ title: '', requester_name: 'X' }),
    ).rejects.toThrow(/title/);
  });

  it('rejects bad logins and non-allowlisted users', async () => {
    await expect(api.login(TEST_ADMIN.email, 'wrong-password')).rejects.toThrow(/Invalid login credentials/i);

    await expect(api.login(TEST_LISTENER.email, TEST_LISTENER.password)).rejects.toThrow(
      'Admin access requires a staff account.',
    );

    const anon = await api.getCurrentUser();
    expect(anon.authenticated).toBe(false);
  });

  it('logs the allowlisted admin in and serves admin data', async () => {
    const me = await api.login(TEST_ADMIN.email, TEST_ADMIN.password);
    expect(me.authenticated).toBe(true);
    expect(me.is_staff).toBe(true);
    expect(me.email).toBe(TEST_ADMIN.email);

    const stats = await api.getAdminStats();
    expect(stats.total_songs).toBe(349);
    expect(stats.total_artists).toBe(185);

    const insights = await api.getAdminInsights(30);
    expect(insights.window_days).toBe(30);
    expect(Array.isArray(insights.most_played)).toBe(true);

    const songs = await api.getAdminSongs({ page_size: 5 });
    expect(songs.page_size).toBe(5);
    expect(songs.results).toHaveLength(5);

    const audit = await api.getAdminAuditLogs();
    expect(audit.length).toBeGreaterThan(0);
    expect(audit.some((l) => l.action === 'TAKEDOWN_SUBMITTED')).toBe(true);

    const queue = await api.getAdminSongRequests();
    expect(queue.count).toBeGreaterThanOrEqual(1);
    expect(queue.available_statuses).toContain('added');
    const resolvedRequest = await api.handleSongRequestAction(queue.results[0].id, 'added', 'Queued');
    expect(resolvedRequest.status).toBe('added');
  });

  it('performs admin catalog mutations through the RPC surface', async () => {
    const artists = await api.getAdminArtists();
    const artist = await api.createAdminArtist({ display_name: 'Contract Test Artist', verification_status: 'verified' });
    expect(artist.id).toBeGreaterThan(0);

    const song = await api.createAdminSong({
      title: 'Contract Test Song',
      romanized_title: 'Contract Test Song',
      artist: artist.id,
      release_year: 1988,
      language: 'Nepali',
      provider_video_id: 'contract-test',
      publication_status: 'draft',
    });
    expect(song.artist_name).toBe('Contract Test Artist');
    expect(song.decade).toBe('1980s');

    const updated = await api.updateAdminSong(song.id, { publication_status: 'published' });
    expect(updated.publication_status).toBe('published');

    const found = await api.getAdminSongs({ search: 'Contract Test Song' });
    expect(found.count).toBe(1);

    await api.deleteAdminSong(song.id);
    const afterDelete = await api.getAdminSongs({ search: 'Contract Test Song' });
    expect(afterDelete.results[0].publication_status).toBe('taken_down');

    await api.deleteAdminArtist(artist.id, artists[0].id);
  });

  it('refuses admin RPCs for signed-out callers', async () => {
    await api.logout();
    const anon = await api.getCurrentUser();
    expect(anon.authenticated).toBe(false);
    await expect(api.getAdminStats()).rejects.toThrow('Admin authentication required');
    await expect(api.getAdminAuditLogs()).rejects.toThrow('Admin access required');
    // Regression: these read RPCs used to be callable by guests (takedown PII,
    // inactive catalog rows). They must now enforce the allowlist server-side.
    const adminOnly = /Admin access|Admin authentication|permission denied/i;
    await expect(api.getAdminTakedowns()).rejects.toThrow(adminOnly);
    await expect(api.getAdminGenres()).rejects.toThrow(adminOnly);
    await expect(api.getAdminArtists()).rejects.toThrow(adminOnly);
    await expect(api.getAdminStations()).rejects.toThrow(adminOnly);
  });
});
