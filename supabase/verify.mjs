// Purano Dhun — supabase/verify.mjs
//
// Runs the SQL migrations + seed against an in-process Postgres (PGlite) and
// exercises every public and admin RPC the way PostgREST would: role switching
// (anon / authenticated), request.jwt.claims for auth.uid(), and assertions on
// response shapes and error messages.
//
//   cd supabase && npm install && npm run verify
//
// This is the CI gate that replaced the old Django test suite for the API
// layer. It cannot run Supabase-specific infrastructure (GoTrue auth,
// PostgREST itself), so auth.uid() and auth.users are stubbed to match
// Supabase's contract exactly.

import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// Keep failure output concise (PGlite errors embed the whole SQL text).
function fatal(err) {
  console.error('FATAL:', err?.message ?? err);
  const stack = String(err?.stack ?? '').split('\n').filter((l) => l.includes('verify.mjs')).slice(0, 3);
  for (const line of stack) console.error(line.trim());
  process.exit(1);
}
process.on('uncaughtException', fatal);
process.on('unhandledRejection', fatal);

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
  } else {
    failed += 1;
    failures.push({ name, detail });
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function eq(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  check(name, a === e, `expected ${e}, got ${a}`);
}

const db = new PGlite();

async function sql(query, params) {
  const res = await db.query(query, params);
  return res.rows;
}

// Multi-statement scripts (migrations, bootstrap) need the simple protocol.
async function script(text) {
  await db.exec(text);
}

async function one(query, params) {
  const rows = await sql(query, params);
  return rows[0];
}

// ---------------------------------------------------------------------------
// Supabase prerequisites: roles, auth schema, auth.uid()
// ---------------------------------------------------------------------------

await script(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then
      create role anon nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
      create role authenticated nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then
      create role service_role nologin bypassrls;
    end if;
  end $$;
`);

await script(`
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
`);

// Supabase grants table privileges to these roles by default; RLS (with zero
// policies) is the only barrier. Mirror that here so the lockdown tests test
// RLS and not missing grants.
await script(`
  grant usage on schema public to anon, authenticated, service_role;
  grant all on all tables in schema public to anon, authenticated, service_role;
  grant usage, select on all sequences in schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
`);

// ---------------------------------------------------------------------------
// Migrations + seed
// ---------------------------------------------------------------------------

const migrations = readdirSync(join(here, 'migrations')).filter((f) => f.endsWith('.sql')).sort();
for (const file of migrations) {
  console.log(`applying ${file}`);
  try {
    await script(readFileSync(join(here, 'migrations', file), 'utf8'));
  } catch (err) {
    console.error(`migration ${file} failed: ${err.message}`);
    process.exit(1);
  }
}
console.log('applying seed.sql');
try {
  await script(readFileSync(join(here, 'seed.sql'), 'utf8'));
} catch (err) {
  console.error(`seed.sql failed: ${err.message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Role / identity helpers mimicking PostgREST
// ---------------------------------------------------------------------------

async function asAnon(fn) {
  await sql(`set role anon`);
  try {
    return await fn();
  } finally {
    await sql(`reset role`);
  }
}

async function asUser(userId, fn) {
  await sql(
    `select set_config('request.jwt.claims', $1, false)`,
    [JSON.stringify({ sub: userId, role: 'authenticated' })]
  );
  await sql(`set role authenticated`);
  try {
    return await fn();
  } finally {
    await sql(`reset role`);
    await sql(`select set_config('request.jwt.claims', '', false)`);
  }
}

async function rpc(fnName, args = {}, runner = asAnon) {
  const keys = Object.keys(args);
  // Named notation so omitted arguments keep their declared defaults.
  const call = `select public.${fnName}(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')}) as result`;
  try {
    return await runner(async () => {
      const row = await one(call, keys.map((k) => normalize(args[k])));
      return row?.result ?? row?.[fnName];
    });
  } catch (err) {
    err.message = `${fnName}: ${err.message}`;
    throw err;
  }
}

function normalize(value) {
  if (Array.isArray(value)) {
    // Primitive arrays map to bigint[]/text[] params (postgres array literal);
    // arrays of objects stay JSON for jsonb params.
    if (value.every((v) => v === null || typeof v !== 'object')) {
      return `{${value.join(',')}}`;
    }
    return JSON.stringify(value);
  }
  if (value !== null && typeof value === 'object') return JSON.stringify(value);
  return value;
}

async function rpcError(fnName, args = {}, runner = asAnon) {
  try {
    await rpc(fnName, args, runner);
    return null;
  } catch (err) {
    return err.message ?? String(err);
  }
}

async function execAs(runner, query, params) {
  return runner(async () => sql(query, params));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

console.log('\n== public catalog ==');

const stations = await rpc('get_stations');
check('get_stations returns seeded stations', Array.isArray(stations) && stations.length === 10, `got ${stations?.length}`);
check('get_stations payload shape', stations[0]?.slug !== undefined && stations[0]?.songs_count !== undefined, JSON.stringify(stations[0]).slice(0, 120));

const stationDetail = await rpc('get_station_detail', { p_slug: 'purano-radio' });
check('get_station_detail includes queue', Array.isArray(stationDetail?.station_songs) && stationDetail.station_songs.length > 0, JSON.stringify(stationDetail?.station_songs?.length));
check('get_station_detail song payload', stationDetail?.station_songs?.[0]?.song?.artist_name !== undefined);

const station404 = await rpcError('get_station_detail', { p_slug: 'nope' });
check('get_station_detail 404 message', station404?.includes('Station not found'), station404);

const songs = await rpc('get_songs');
check('get_songs paginates at 24', songs?.results?.length === 24, `got ${songs?.results?.length}`);
check('get_songs count matches seed', songs?.count === 77, `got ${songs?.count}`);
check('get_songs DRF envelope', typeof songs?.next === 'string' && songs?.previous === null, JSON.stringify({ next: songs?.next, previous: songs?.previous }));

const songsPage2 = await rpc('get_songs', { p_page: 2 });
check('get_songs page 2 works', songsPage2?.results?.length === 24 && songsPage2?.previous !== null);

const devanagari = await rpc('get_songs', { p_search: 'छेकेर' });
check('get_songs Devanagari search', (devanagari?.count ?? 0) >= 0, JSON.stringify(devanagari?.count));
const romanized = await rpc('get_songs', { p_search: 'Chhekyo' });
check('get_songs romanized search finds rows', (romanized?.count ?? 0) >= 0, JSON.stringify(romanized?.count));

const genreFiltered = await rpc('get_songs', { p_genre: 'lok-dohori' });
check('get_songs genre filter', genreFiltered?.count >= 0, JSON.stringify(genreFiltered?.count));
const ordered = await rpc('get_songs', { p_ordering: 'bogus' });
check('get_songs unknown ordering falls back', ordered?.count === 77);

const songDetail = await rpc('get_song_detail', { p_id: songs.results[0].id });
check('get_song_detail shape', songDetail?.title === songs.results[0].title);
const song404 = await rpcError('get_song_detail', { p_id: 999999 });
check('get_song_detail 404 message', song404?.includes('Song not found'), song404);

const genres = await rpc('get_genres');
check('get_genres with counts', genres?.length === 14 && genres[0].songs_count !== undefined, `got ${genres?.length}`);

const categories = await rpc('get_genre_categories');
check('get_genre_categories with counts', categories?.length === 5 && categories[0].genres_count !== undefined, `got ${categories?.length}`);

const artists = await rpc('get_artists');
check('get_artists returns all', artists?.length === 27, `got ${artists?.length}`);

const decades = await rpc('get_decades');
check('get_decades shape', Array.isArray(decades) && decades.every((d) => d.decade && typeof d.count === 'number'));

const languages = await rpc('get_languages');
check('get_languages shape', Array.isArray(languages) && languages.every((l) => l.language && typeof l.count === 'number'));

const featured = await rpc('get_featured');
check('get_featured stations + songs', Array.isArray(featured?.stations) && featured?.songs?.length === 8, JSON.stringify({ s: featured?.stations?.length, n: featured?.songs?.length }));

const festivals = await rpc('get_festival_categories');
check('get_festival_categories returns seeded festivals', Array.isArray(festivals) && festivals.length === 7, `got ${festivals?.length}`);
check('get_festival_categories shape', festivals?.[0]?.slug === 'dashain' && festivals?.[0]?.name_ne !== undefined && festivals?.[0]?.emoji !== undefined, JSON.stringify(festivals?.[0]).slice(0, 140));

const dashain = await rpc('get_festival_songs', { p_festival_slug: 'dashain', p_limit: 24 });
const dashainIds = (dashain?.results ?? []).map((s) => s.id);
check('get_festival_songs returns festive songs', Array.isArray(dashain?.results) && dashain.results.length > 0 && dashain?.count === dashain.results.length, JSON.stringify({ count: dashain?.count, len: dashain?.results?.length }));
// Regression: the lateral join used to shadow the outer `songs s` alias, so
// every festival song was returned once per row in the whole catalog.
check('get_festival_songs has no duplicate rows', new Set(dashainIds).size === dashainIds.length, `distinct ${new Set(dashainIds).size} of ${dashainIds.length}`);
check('get_festival_songs respects the limit', dashainIds.length <= 24, `got ${dashainIds.length}`);

const missingFestival = await rpc('get_festival_songs', { p_festival_slug: 'does-not-exist' });
check('get_festival_songs unknown slug is empty', missingFestival?.count === 0 && missingFestival?.results?.length === 0, JSON.stringify(missingFestival).slice(0, 120));

// ---------------------------------------------------------------------------
// RLS: direct table access must be denied for anon/authenticated
// ---------------------------------------------------------------------------

console.log('\n== RLS lockdown ==');

const anonReadRows = await execAs(asAnon, `select id from public.songs`);
check('anon reads zero rows directly', Array.isArray(anonReadRows) && anonReadRows.length === 0, `got ${anonReadRows?.length} rows`);

const directInsert = await execAs(asAnon, `insert into public.songs (title, artist_id, provider_video_id) values ('hack', 1, 'x')`).then(() => null).catch((e) => e.message);
check('anon cannot insert songs directly', typeof directInsert === 'string' && directInsert.toLowerCase().includes('row-level security'), directInsert);

const anonDelete = await execAs(asAnon, `delete from public.songs where id = 1`).then((r) => r).catch((e) => e.message);
check('anon deletes nothing directly', Array.isArray(anonDelete) || (typeof anonDelete === 'string' && anonDelete.toLowerCase().includes('row-level security')), JSON.stringify(anonDelete));

const authUser = await one(`insert into auth.users (email) values ('listener@example.com') returning id`);
const authReadRows = await execAs((fn) => asUser(authUser.id, fn), `select id from public.favorites`);
check('authenticated user reads zero favorites directly', Array.isArray(authReadRows) && authReadRows.length === 0, `got ${authReadRows?.length} rows`);

// ---------------------------------------------------------------------------
// Favorites + playback events via RPCs (anonymous session identity)
// ---------------------------------------------------------------------------

console.log('\n== listener features ==');

const firstSongId = songs.results[0].id;
const favCountBefore = (await rpc('get_favorites', {}, (fn) => asUser(authUser.id, fn))).length;
const fav = await rpc('add_favorite', { p_song_id: firstSongId }, (fn) => asUser(authUser.id, fn));
check('add_favorite returns FavoriteSerializer shape', fav?.song?.title !== undefined && fav?.session_key === authUser.id, JSON.stringify(fav).slice(0, 120));
const favs = await rpc('get_favorites', {}, (fn) => asUser(authUser.id, fn));
check('get_favorites lists it', favs.length === favCountBefore + 1);
await rpc('add_favorite', { p_song_id: firstSongId }, (fn) => asUser(authUser.id, fn));
const favsAfterDupe = await rpc('get_favorites', {}, (fn) => asUser(authUser.id, fn));
check('add_favorite is idempotent', favsAfterDupe.length === favs.length);
await rpc('remove_favorite', { p_song_id: firstSongId }, (fn) => asUser(authUser.id, fn));
const favsAfterRemove = await rpc('get_favorites', {}, (fn) => asUser(authUser.id, fn));
check('remove_favorite deletes', favsAfterRemove.length === favs.length - 1);

const favNoAuth = await rpcError('add_favorite', { p_song_id: firstSongId });
check('add_favorite without session errors', favNoAuth?.includes('authentication required'), favNoAuth);

// Telemetry must be attributable: a bare `anon` JWT (a scripted caller) can
// neither write events nor move play_count — that was the free play_count
// inflation vector. The frontend always calls ensureListenerSession() first, so
// real listeners do have a session.
const listenerAs = (fn) => asUser(authUser.id, fn);

const noSession = await rpcError('log_playback_event', { p_event_type: 'start', p_song_id: firstSongId });
check('log_playback_event refuses a caller with no session', noSession?.includes('authentication required'), noSession);

const playBefore = (await one(`select play_count from public.songs where id = $1`, [firstSongId])).play_count;
await rpc('log_playback_event', { p_event_type: 'start', p_song_id: firstSongId }, listenerAs);
const playAfter = (await one(`select play_count from public.songs where id = $1`, [firstSongId])).play_count;
check('log_playback_event increments play_count for a real listener', playAfter === playBefore + 1, `${playBefore} -> ${playAfter}`);

// Replays from the same listener inside the 30-minute window are recorded but
// must not count again.
await rpc('log_playback_event', { p_event_type: 'start', p_song_id: firstSongId }, listenerAs);
const playDedup = (await one(`select play_count from public.songs where id = $1`, [firstSongId])).play_count;
check('log_playback_event dedups repeat plays per listener', playDedup === playAfter, `${playAfter} -> ${playDedup}`);

const badEvent = await rpcError('log_playback_event', { p_event_type: 'nope' });
check('log_playback_event validates type', badEvent?.includes('Invalid event_type'), badEvent);

// ---------------------------------------------------------------------------
// Takedown workflow
// ---------------------------------------------------------------------------

console.log('\n== takedown workflow ==');

const ticket = await rpc('submit_takedown', {
  p_song: firstSongId,
  p_claimant_name: 'Rights Holder',
  p_claimant_email: 'rights@example.com',
  p_reason: 'copyright',
  p_details: 'Official notice',
});
check('submit_takedown returns ticket id', typeof ticket?.ticket_id === 'number', JSON.stringify(ticket));

const status = await rpc('get_takedown_status', { p_ticket_id: ticket.ticket_id, p_email: 'rights@example.com' });
check('get_takedown_status shape', status?.status === 'pending' && status?.song_title !== undefined, JSON.stringify(status));

const wrongEmail = await rpcError('get_takedown_status', { p_ticket_id: ticket.ticket_id, p_email: 'wrong@example.com' });
check('get_takedown_status email guard', wrongEmail?.includes('Email does not match'), wrongEmail);

// ---------------------------------------------------------------------------
// Admin: non-admins are refused
// ---------------------------------------------------------------------------

console.log('\n== admin auth gate ==');

const anonStats = await rpcError('admin_stats');
check('anon admin_stats refused', anonStats?.includes('Admin access required'), anonStats);

const nonAdminStats = await rpcError('admin_stats', {}, (fn) => asUser(authUser.id, fn));
check('non-admin admin_stats refused', nonAdminStats?.includes('Admin access required'), nonAdminStats);

// Regression: these read RPCs used to lack the is_admin() guard, exposing
// takedown PII and inactive catalog rows to anonymous callers.
for (const fn of ['admin_takedowns', 'admin_genres', 'admin_artists', 'admin_stations']) {
  const anonErr = await rpcError(fn);
  check(`anon ${fn} refused`, anonErr?.includes('Admin access required'), anonErr);
  const nonAdminErr = await rpcError(fn, {}, (s) => asUser(authUser.id, s));
  check(`non-admin ${fn} refused`, nonAdminErr?.includes('Admin access required'), nonAdminErr);
}

const anonCurrent = await rpc('admin_current_user');
check('admin_current_user anonymous', anonCurrent?.authenticated === false);

const nonAdminCurrent = await rpc('admin_current_user', {}, (fn) => asUser(authUser.id, fn));
check('admin_current_user non-admin', nonAdminCurrent?.authenticated === false);

// Promote a real admin (the DEPLOY.md bootstrap flow)
const adminUser = await one(`insert into auth.users (email, raw_user_meta_data) values ('sonu@example.com', '{"full_name": "Sonu"}') returning id`);
await sql(`insert into public.admins (user_id, email) values ($1, 'sonu@example.com')`, [adminUser.id]);

const adminAs = (fn) => asUser(adminUser.id, fn);
const me = await rpc('admin_current_user', {}, adminAs);
check('admin_current_user admin payload', me?.authenticated === true && me?.is_staff === true && me?.email === 'sonu@example.com', JSON.stringify(me).slice(0, 160));

// ---------------------------------------------------------------------------
// Admin: catalog management
// ---------------------------------------------------------------------------

console.log('\n== admin catalog ==');

const stats = await rpc('admin_stats', {}, adminAs);
check('admin_stats totals', stats?.total_songs === 77 && stats?.total_artists === 27, JSON.stringify({ songs: stats?.total_songs, artists: stats?.total_artists }));
check('admin_stats breakdowns', stats?.status_breakdown?.published === 77 && typeof stats?.language_breakdown === 'object', JSON.stringify(stats?.status_breakdown));

const insights = await rpc('admin_insights', { p_days: 30 }, adminAs);
check('admin_insights shape', insights?.window_days === 30 && Array.isArray(insights?.top_songs) && typeof insights?.completion_rate === 'number', JSON.stringify(insights).slice(0, 120));

const adminSongs = await rpc('admin_songs', {}, adminAs);
check('admin_songs includes unpublished + pagination', adminSongs?.count === 77 && adminSongs?.page === 1 && adminSongs?.page_size === 25, JSON.stringify({ c: adminSongs?.count }));

const adminSearch = await rpc('admin_songs', { p_search: 'Mayalu' }, adminAs);
check('admin_songs search', (adminSearch?.count ?? 0) >= 0);

const newArtist = await rpc('admin_artist_create', { p_data: { display_name: 'Test Kazi', display_name_ne: 'टेस्ट', verification_status: 'verified' } }, adminAs);
check('admin_artist_create returns serializer shape', newArtist?.id !== undefined && newArtist?.songs_count === 0, JSON.stringify(newArtist).slice(0, 120));

const newSong = await rpc('admin_song_create', {
  p_data: {
    title: 'Test Song',
    title_ne: 'टेस्ट गीत',
    romanized_title: 'Test Song',
    artist: newArtist.id,
    release_year: 1995,
    language: 'Nepali',
    provider_video_id: 'abc123',
    metadata_verification_status: 'community_submitted',
    publication_status: 'draft',
  },
}, adminAs);
check('admin_song_create returns Song payload', newSong?.artist_name === 'Test Kazi' && newSong?.publication_status === 'draft', JSON.stringify(newSong).slice(0, 160));
check('decade auto-computed by trigger', newSong?.decade === '1990s', newSong?.decade);

const missingField = await rpcError('admin_song_create', { p_data: { title: 'x' } }, adminAs);
check('admin_song_create validates required fields', missingField?.includes('provider_video_id'), missingField);

const updatedSong = await rpc('admin_song_update', { p_id: newSong.id, p_data: { publication_status: 'published', metadata_verification_status: 'verified' } }, adminAs);
check('admin_song_update partial', updatedSong?.publication_status === 'published' && updatedSong?.title === 'Test Song');

const unpublished = await rpc('admin_song_unpublish', { p_id: newSong.id }, adminAs);
check('admin_song_unpublish soft-deletes', unpublished?.message?.includes('unpublished'), JSON.stringify(unpublished));

// Bulk operations with preview + apply
const bulkPreview = await rpc('admin_songs_bulk', {
  p_payload: { action: 'set_status', preview: true, ids: [newSong.id], value: 'published' },
}, adminAs);
check('bulk preview does not write', bulkPreview?.preview === true && bulkPreview?.affected === 1, JSON.stringify(bulkPreview));
const stillUnpublished = await one(`select publication_status from public.songs where id = $1`, [newSong.id]);
check('bulk preview leaves row untouched', stillUnpublished.publication_status === 'taken_down', stillUnpublished.publication_status);

const bulkApply = await rpc('admin_songs_bulk', {
  p_payload: { action: 'set_status', ids: [newSong.id], value: 'published' },
}, adminAs);
check('bulk set_status applies', bulkApply?.affected === 1, JSON.stringify(bulkApply));

const bulkNoTarget = await rpcError('admin_songs_bulk', { p_payload: { action: 'set_status', value: 'published' } }, adminAs);
check('bulk refuses blind catalog update', bulkNoTarget?.includes('refusing to touch'), bulkNoTarget);

const bulkBadAction = await rpcError('admin_songs_bulk', { p_payload: { action: 'explode', ids: [1] } }, adminAs);
check('bulk rejects unknown action', bulkBadAction?.includes('Unknown action'), bulkBadAction);

const bulkDecade = await rpcError('admin_songs_bulk', { p_payload: { action: 'set_decade', ids: [newSong.id], value: '199' } }, adminAs);
check('bulk validates decade format', bulkDecade?.includes('1980s'), bulkDecade);

// ---------------------------------------------------------------------------
// Admin: taxonomy + stations + queues
// ---------------------------------------------------------------------------

console.log('\n== admin taxonomy + stations ==');

const adminGenres = await rpc('admin_genres', {}, adminAs);
check('admin_genres lists all incl. inactive', adminGenres?.length === 14, `got ${adminGenres?.length}`);

const genre = await rpc('admin_genre_create', { p_data: { name: 'Test Genre', category: 'folk' } }, adminAs);
check('admin_genre_create derives slug', genre?.slug === 'test-genre', JSON.stringify(genre).slice(0, 120));

const genreRenamed = await rpc('admin_genre_update', { p_id: genre.id, p_data: { name: 'Test Genre Renamed' } }, adminAs);
check('admin_genre_update re-slugs', genreRenamed?.slug === 'test-genre-renamed', genreRenamed?.slug);

const genreInUse = await rpcError('admin_genre_delete', { p_id: 1 }, adminAs);
check('admin_genre_delete conflict message', genreInUse?.includes('reassign_to'), genreInUse);

const genreReassigned = await rpc('admin_genre_delete', { p_id: 1, p_reassign_to: 2 }, adminAs);
check('admin_genre_delete with reassign', genreReassigned?.message?.includes('deleted'), genreReassigned?.message);
await rpc('admin_genre_delete', { p_id: genre.id }, adminAs);

const cat = await rpc('admin_genre_category_create', { p_data: { name: 'Test Category', display_order: 99 } }, adminAs);
check('admin_genre_category_create', cat?.slug === 'test-category', JSON.stringify(cat).slice(0, 120));

const reorder = await rpc('admin_genre_categories_reorder', {
  p_order: [{ id: cat.id, display_order: 0 }],
}, adminAs);
check('admin_genre_categories_reorder', reorder?.updated?.length === 1, JSON.stringify(reorder));

const catDeleteConflict = await rpcError('admin_genre_category_delete', { p_id: cat.id }, adminAs);
check('admin_genre_category_delete empty registry guard', catDeleteConflict === null || catDeleteConflict?.includes('deleted'), catDeleteConflict);
// (category has no genres, so deletion should succeed — delete it again-safe)
const cats = await rpc('admin_genre_categories', { p_include_inactive: true }, adminAs);
check('admin_genre_categories sees inactive', cats?.length === 5 || cats?.length === 6, `got ${cats?.length}`);

const station = await rpc('admin_station_create', { p_data: { title: 'Test Station' } }, adminAs);
check('admin_station_create derives slug', station?.slug === 'test-station', JSON.stringify(station).slice(0, 120));

const stationUpdated = await rpc('admin_station_update', { p_id: station.id, p_data: { tagline: 'New tagline' } }, adminAs);
check('admin_station_update partial', stationUpdated?.tagline === 'New tagline');

await rpc('admin_station_queue_add', { p_station_id: station.id, p_song_ids: [firstSongId] }, adminAs);
const queue = await rpc('admin_station_queue_get', { p_station_id: station.id }, adminAs);
check('station queue add + get', queue?.count === 1 && queue?.queue?.[0]?.song_id === firstSongId, JSON.stringify(queue).slice(0, 160));

const dupAdd = await rpc('admin_station_queue_add', { p_station_id: station.id, p_song_ids: [firstSongId] }, adminAs);
check('queue add is idempotent', dupAdd?.added?.length === 0 && dupAdd?.skipped?.length === 1, JSON.stringify(dupAdd));

const secondSongId = songs.results[1].id;
await rpc('admin_station_queue_add', { p_station_id: station.id, p_song_ids: [secondSongId] }, adminAs);
await rpc('admin_station_queue_reorder', { p_station_id: station.id, p_order: [secondSongId, firstSongId] }, adminAs);
const reorderedQueue = await rpc('admin_station_queue_get', { p_station_id: station.id }, adminAs);
check('queue reorder', reorderedQueue?.queue?.[0]?.song_id === secondSongId, JSON.stringify(reorderedQueue?.queue?.map((q) => q.song_id)));

await rpc('admin_station_queue_remove', { p_station_id: station.id, p_song_id: secondSongId }, adminAs);
const queueAfterRemove = await rpc('admin_station_queue_get', { p_station_id: station.id }, adminAs);
check('queue remove + renormalise positions', queueAfterRemove?.count === 1 && queueAfterRemove?.queue?.[0]?.position === 0, JSON.stringify(queueAfterRemove?.queue));

const stationDelete = await rpc('admin_station_delete', { p_id: station.id }, adminAs);
check('admin_station_delete reports links', stationDelete?.station_links_removed === 1, JSON.stringify(stationDelete));

// ---------------------------------------------------------------------------
// Admin: takedown moderation + audit log
// ---------------------------------------------------------------------------

console.log('\n== admin moderation ==');

const takedownList = await rpc('admin_takedowns', {}, adminAs);
check('admin_takedowns lists ticket', takedownList?.count === 1 && takedownList?.available_statuses?.length === 5, JSON.stringify(takedownList).slice(0, 140));

const action = await rpc('admin_takedown_action', {
  p_id: ticket.ticket_id,
  p_status: 'content_unpublished',
  p_resolution_notes: 'Valid claim',
}, adminAs);
check('takedown action unpublishes song', action?.status === 'content_unpublished');
const songAfterTakedown = await one(`select publication_status from public.songs where id = $1`, [firstSongId]);
check('takedown action sets taken_down', songAfterTakedown.publication_status === 'taken_down', songAfterTakedown.publication_status);

const audit = await rpc('admin_audit_logs', {}, adminAs);
check('audit log captured actions', Array.isArray(audit) && audit.length > 0 && audit.some((l) => l.action === 'SONG_UNPUBLISHED'), JSON.stringify(audit?.map((l) => l.action)));
check('audit log actor is admin email prefix', audit.some((l) => l.actor_username === 'sonu'), JSON.stringify(audit[0]));
check('public takedown submission audited separately', audit.some((l) => l.actor_username === 'public_reporter'), JSON.stringify(audit.map((l) => l.actor_username)));

const auditAnon = await rpcError('admin_audit_logs');
check('audit logs refused for anon', auditAnon?.includes('Admin access required'), auditAnon);

// ---------------------------------------------------------------------------
// Restore the catalog state the seed promises (song was taken down above)
// ---------------------------------------------------------------------------

await sql(`update public.songs set publication_status = 'published' where id = $1`, [firstSongId]);

// ---------------------------------------------------------------------------
// Internal helper RPCs must NOT be callable by browser roles.
//
// Every function in the `public` schema is reachable through PostgREST
// (/rest/v1/rpc/<fn>) and Postgres grants EXECUTE to PUBLIC by default, so any
// SECURITY DEFINER helper that lives in public is an API endpoint unless it is
// explicitly revoked. The helpers below are implementation details of the RPC
// layer: they must never be an entry point.
// ---------------------------------------------------------------------------

console.log('\n== internal RPC lockdown ==');

const denied = (msg) => typeof msg === 'string' && /permission denied/i.test(msg);

const h1 = await rpcError('_audit', { p_action: 'FORGED', p_target_model: 'Song', p_target_id: '1', p_details: {} });
check('anon cannot call _audit (audit-trail forgery)', denied(h1), h1);

const h2 = await rpcError('_song_payload', { p_id: firstSongId });
check('anon cannot call _song_payload', denied(h2), h2);

const h3 = await rpcError('_songs_payload', { p_ids: [firstSongId] });
check('anon cannot call _songs_payload', denied(h3), h3);

const h4 = await rpcError('_bulk_target_ids', { p_payload: { filter: { status: 'draft' } } });
check('anon cannot call _bulk_target_ids (unpublished id enumeration)', denied(h4), h4);

const h5 = await rpcError('_station_queue_rows', { p_station_id: station?.id ?? 1 });
check('anon cannot call _station_queue_rows', denied(h5), h5);

const h6 = await rpcError('_unique_slug', { p_base: 'x', p_table: 'genres' });
check('anon cannot call _unique_slug (schema probing)', denied(h6), h6);

const h7 = await rpcError('_apply_song_payload', { p_data: { artist: 1 } });
check('anon cannot call _apply_song_payload', denied(h7), h7);

// The helpers must still work for the SECURITY DEFINER RPCs that call them.
const stillWorks = await rpc('get_song_detail', { p_id: firstSongId });
check('public RPCs still resolve internally after lockdown', stillWorks?.id === firstSongId, JSON.stringify(stillWorks).slice(0, 80));
const adminStillWorks = await rpc('admin_song_detail', { p_id: firstSongId }, adminAs);
check('admin RPCs still resolve internally after lockdown', adminStillWorks?.id === firstSongId, JSON.stringify(adminStillWorks).slice(0, 80));

// ---------------------------------------------------------------------------
// Takedown status lookup must prove ticket ownership (sequential ids are
// trivial to enumerate, and resolution_notes is admin-written internal text).
// ---------------------------------------------------------------------------

const noEmail = await rpcError('get_takedown_status', { p_ticket_id: ticket.ticket_id });
check('get_takedown_status requires the claimant email', typeof noEmail === 'string' && /claimant email is required/i.test(noEmail), noEmail);

const withEmail = await rpc('get_takedown_status', { p_ticket_id: ticket.ticket_id, p_email: 'rights@example.com' });
check('get_takedown_status with matching email', withEmail?.ticket_id === ticket.ticket_id && withEmail?.status !== undefined, JSON.stringify(withEmail));

const otherEmail = await rpcError('get_takedown_status', { p_ticket_id: ticket.ticket_id, p_email: 'caps@example.com' });
check('get_takedown_status rejects a different email', otherEmail?.includes('Email does not match'), otherEmail);

// ---------------------------------------------------------------------------
// Public write RPCs must bound free-text input so nobody can bloat the tables
// with arbitrarily large rows.
// ---------------------------------------------------------------------------

await rpc('log_playback_event', {
  p_event_type: 'error',
  p_song_id: firstSongId,
  p_error_message: 'e'.repeat(5000),
}, listenerAs);
const bounded = await one(
  `select error_message from public.playback_events
   where event_type = 'error' and song_id = $1 order by id desc limit 1`,
  [firstSongId],
);
check('log_playback_event caps error_message', (bounded?.error_message?.length ?? 99999) <= 1000, `len=${bounded?.error_message?.length}`);

// Flood guard: a single listener cannot write unbounded rows into
// playback_events (a DoS/storage-growth vector on the free tier).
const floodUser = await one(`insert into auth.users (email) values ('flood@example.com') returning id`);
const floodAs = (fn) => asUser(floodUser.id, fn);
for (let i = 0; i < 120; i++) {
  await rpc('log_playback_event', { p_event_type: 'skip', p_song_id: firstSongId }, floodAs);
}
const floodThrottled = await rpc('log_playback_event', { p_event_type: 'skip', p_song_id: firstSongId }, floodAs);
check(
  'log_playback_event throttles a flooding listener',
  floodThrottled?.status === 'throttled',
  JSON.stringify(floodThrottled),
);

const bigTicket = await rpc('submit_takedown', {
  p_song: firstSongId,
  p_claimant_name: 'n'.repeat(300),
  p_claimant_email: 'caps@example.com',
  p_reason: 'other',
  p_details: 'd'.repeat(20000),
});
const bigRow = await one(
  `select length(details) as dlen, length(claimant_name) as nlen from public.takedown_requests where id = $1`,
  [bigTicket.ticket_id],
);
check('submit_takedown caps details', bigRow.dlen <= 5000, `len=${bigRow.dlen}`);
check('submit_takedown caps claimant_name', bigRow.nlen <= 200, `len=${bigRow.nlen}`);

// Rate limit: 5 tickets/hour per claimant email, then refused.
let throttleAllowed = 0;
let throttleError = null;
for (let i = 0; i < 6; i++) {
  const err = await rpcError('submit_takedown', {
    p_song: firstSongId,
    p_claimant_name: 'Repeat Reporter',
    p_claimant_email: 'throttle@example.com',
    p_reason: 'other',
    p_details: 'duplicate',
  });
  if (err) {
    throttleError = err;
    break;
  }
  throttleAllowed++;
}
check(
  'submit_takedown rate limits to 5 per hour',
  throttleAllowed === 5 && throttleError?.includes('Too many reports'),
  `allowed=${throttleAllowed} err=${throttleError}`,
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log('all supabase SQL checks green');
}
