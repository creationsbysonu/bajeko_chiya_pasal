// Purano Dhun — verifies the generated festive upgrade actually brings a
// pre-festival database up to date.
//
//   node supabase/tools/verify_upgrade.mjs
//
// Simulates the live database (migrations 0001-0006 + the base catalog only),
// then applies supabase/deploy/upgrade_festive.sql and asserts the festival
// feature and songs appear.

import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const supa = join(here, '..');

let passed = 0;
const failures = [];
const check = (name, ok, detail) => {
  if (ok) passed += 1;
  else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

const db = new PGlite();
const q = async (sql, params) => (await db.query(sql, params)).rows;

await db.exec(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
  end $$;
`);
await db.exec(`
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    last_sign_in_at timestamptz
  );
  create or replace function auth.uid() returns uuid language sql stable as $fn$
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

// 1. Live DB state: migrations 0001-0006 only, then the base catalog.
for (const f of readdirSync(join(supa, 'migrations'))
  .filter((f) => f.endsWith('.sql') && f < '0007')
  .sort()) {
  await db.exec(readFileSync(join(supa, 'migrations', f), 'utf8'));
}
await db.exec(readFileSync(join(here, 'base_seed_only.sql'), 'utf8'));

const baseSongs = await q('select count(*)::int as n from public.songs');
check('pre-upgrade catalog is the base 66', baseSongs[0].n === 66, `got ${baseSongs[0].n}`);
const baseArtists = await q('select count(*)::int as n from public.artists');
check('pre-upgrade artist count is 27', baseArtists[0].n === 27, `got ${baseArtists[0].n}`);
let festivalMissing = false;
try {
  await q('select public.get_festival_categories()');
} catch {
  festivalMissing = true;
}
check('pre-upgrade DB has no festival RPC', festivalMissing);

// 2. Apply the generated upgrade.
try {
  await db.exec(readFileSync(join(supa, 'deploy', 'upgrade_festive.sql'), 'utf8'));
} catch (err) {
  console.error('upgrade failed:', err.message);
  process.exit(1);
}

const songs = await q('select count(*)::int as n from public.songs');
check('upgrade yields 286 songs', songs[0].n === 286, `got ${songs[0].n}`);
const artists = await q('select count(*)::int as n from public.artists');
check('upgrade yields 163 artists', artists[0].n === 163, `got ${artists[0].n}`);

const festivals = (await q('select public.get_festival_categories() as f'))[0].f;
check('upgrade ships 23 festivals', Array.isArray(festivals) && festivals.length === 23, `got ${festivals?.length}`);

const calendar = (await q('select public.get_festival_calendar() as c'))[0].c;
check('calendar returns 23 entries', Array.isArray(calendar) && calendar.length === 23, `got ${calendar?.length}`);

const chhath = (await q("select public.get_festival_songs('chhath', 24) as x"))[0].x;
const ids = (chhath?.results ?? []).map((s) => s.id);
check('chhath has its dedicated songs', ids.includes(1030) && ids.includes(1031), ids.slice(0, 6).join(','));
const sources = new Set((chhath?.results ?? []).map((s) => s.source));
check('chhath mix blends trending festive tracks', sources.has('festival') && sources.has('trending'), [...sources].join(','));

const sample = (chhath?.results ?? [])[0];
check('playlist songs are playable', Boolean(sample?.provider_video_id), JSON.stringify(sample).slice(0, 120));

const suggestion = (await q("select public.submit_song_request('Test Song', 'Someone', '', '', null, '', 'Tester', 'tester@example.com') as x"))[0].x;
check('upgrade adds the song request workflow', typeof suggestion?.request_id === 'number', JSON.stringify(suggestion));

// 3. Idempotency: re-running the upgrade must be a no-op, not an error.
await db.exec(readFileSync(join(supa, 'deploy', 'upgrade_festive.sql'), 'utf8'));
const songs2 = await q('select count(*)::int as n from public.songs');
check('upgrade is idempotent', songs2[0].n === 286, `got ${songs2[0].n}`);

await db.close();

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
console.log('festive upgrade verified');
