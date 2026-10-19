/**
 * Build-time prerenderer.
 *
 * The app is a Vite SPA: without this step Vercel serves the same empty shell
 * for every URL and search engines only ever see three pages. This script runs
 * after `vite build`, reads the catalog from the same public Supabase RPCs the
 * browser uses, and writes one complete HTML file per entity:
 *
 *   dist/stations/<slug>.html
 *   dist/songs/<id>/<slug>.html
 *   dist/artists/<id>/<slug>.html
 *   dist/genres/<slug>.html
 *   dist/decades/<decade>.html
 *   dist/festivals/<slug>.html
 *   dist/stations.html, dist/catalog.html, dist/genres.html
 *
 * Each file is the built index.html (so it references the hashed JS/CSS) with
 * a page-specific <head> and a crawlable static body inside #root. React takes
 * over on load, so visitors still get the full player; crawlers and no-JS
 * readers get the content immediately.
 *
 * It also rewrites dist/sitemap.xml and dist/feed.xml from the live catalog.
 *
 * If Supabase credentials are absent (a contributor's local build), the step is
 * skipped with a warning and the base sitemap copied from public/ is kept.
 *
 * Run directly with: `node --experimental-strip-types scripts/prerender.ts`
 * (Node 22.6+ / 24 both accept the flag).
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { loadEnv } from 'vite';
import type {
  Artist,
  FestivalCategory,
  FestivalSong,
  Genre,
  GenreCategory,
  Song,
  Station,
} from '../src/types/index.ts';
import { ROUTES } from '../src/utils/seo.ts';
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_NAME_NE,
  SITE_URL,
  artistJsonLd,
  artistPath,
  artistSeo,
  artistsSeo,
  catalogSeo,
  collectionJsonLd,
  decadePath,
  decadeSeo,
  decadesSeo,
  festivalPath,
  festivalSeo,
  festivalsSeo,
  genrePath,
  genreSeo,
  genresSeo,
  itemListJsonLd,
  songJsonLd,
  songPath,
  songSeo,
  stationJsonLd,
  stationPath,
  stationSeo,
  stationsSeo,
  type SeoMeta,
} from '../src/utils/pageMeta.ts';

const DIST = join(process.cwd(), 'dist');
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const SUPABASE_URL = (env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || '';

// ---------------------------------------------------------------------------
// Supabase RPC (same public surface the frontend uses)
// ---------------------------------------------------------------------------

async function rpc<T>(fn: string, body: Record<string, unknown> = {}): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) {
        throw new Error(`${fn} → HTTP ${response.status} ${(await response.text()).slice(0, 200)}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

async function fetchAllSongs(): Promise<Song[]> {
  const first = await rpc<{ count: number; results: Song[] }>('get_songs', {
    p_page_size: 100,
    p_page: 1,
    p_ordering: '-release_year',
  });
  const songs = [...first.results];
  const pages = Math.ceil(first.count / 100);
  for (let page = 2; page <= pages; page += 1) {
    const next = await rpc<{ results: Song[] }>('get_songs', {
      p_page_size: 100,
      p_page: page,
      p_ordering: '-release_year',
    });
    songs.push(...next.results);
  }
  return songs;
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function esc(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function jsonLdBlock(data: Record<string, unknown>): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function setMeta(
  html: string,
  attribute: 'name' | 'property',
  key: string,
  content: string
): string {
  const tag = `<meta ${attribute}="${key}" content="${esc(content)}">`;
  const pattern = new RegExp(`<meta ${attribute}="${escapeRegExp(key)}"[^>]*>`);
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function removeMeta(html: string, attribute: 'name' | 'property', key: string): string {
  return html.replace(
    new RegExp(`\\s*<meta ${attribute}="${escapeRegExp(key)}"[^>]*>`, 'g'),
    ''
  );
}

function setCanonical(html: string, href: string): string {
  const tag = `<link rel="canonical" href="${esc(href)}">`;
  if (/<link rel="canonical"[^>]*>/.test(html)) {
    return html.replace(/<link rel="canonical"[^>]*>/, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function buildPage(base: string, meta: SeoMeta, body: string, jsonLd: Record<string, unknown>): string {
  let html = base;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`);
  html = setMeta(html, 'name', 'description', meta.description);
  html = setMeta(html, 'name', 'robots', meta.robots);
  html = setCanonical(html, meta.canonical);

  html = setMeta(html, 'property', 'og:title', meta.title);
  html = setMeta(html, 'property', 'og:description', meta.description);
  html = setMeta(html, 'property', 'og:url', meta.canonical);
  html = setMeta(html, 'property', 'og:type', meta.ogType);
  html = setMeta(html, 'name', 'twitter:title', meta.title);
  html = setMeta(html, 'name', 'twitter:description', meta.description);

  if (meta.ogImage) {
    html = setMeta(html, 'property', 'og:image', meta.ogImage);
    html = setMeta(html, 'name', 'twitter:image', meta.ogImage);
    if (meta.ogImage === DEFAULT_OG_IMAGE) {
      html = setMeta(html, 'property', 'og:image:width', '1200');
      html = setMeta(html, 'property', 'og:image:height', '630');
    } else {
      html = removeMeta(html, 'property', 'og:image:width');
      html = removeMeta(html, 'property', 'og:image:height');
    }
  }
  if (meta.ogImageAlt) {
    html = setMeta(html, 'property', 'og:image:alt', meta.ogImageAlt);
    html = setMeta(html, 'name', 'twitter:image:alt', meta.ogImageAlt);
  }

  html = html.replace('</head>', `    ${jsonLdBlock(jsonLd)}\n  </head>`);
  // The prerendered body is already readable without JavaScript, so the
  // generic "enable JS" fallback would only duplicate it.
  html = html.replace(/\s*<noscript>[\s\S]*?<\/noscript>/, '');
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${body}</div>`
  );

  return html;
}

// ---------------------------------------------------------------------------
// Static body rendering
// ---------------------------------------------------------------------------

interface Crumb {
  name: string;
  path: string;
}

function link(path: string, label: string, className = ''): string {
  return `<a href="${esc(path)}"${className ? ` class="${className}"` : ''}>${esc(label)}</a>`;
}

function breadcrumbs(items: Crumb[]): string {
  return `<nav class="seo-crumbs" aria-label="Breadcrumb">${items
    .map((item, index) =>
      index === items.length - 1
        ? `<span aria-current="page">${esc(item.name)}</span>`
        : link(item.path, item.name)
    )
    .join('<span class="seo-sep" aria-hidden="true">/</span>')}</nav>`;
}

function layout(options: {
  kicker: string;
  title: string;
  alternate?: string | null;
  intro?: string;
  crumbs: Crumb[];
  body: string;
}): string {
  const alternate = options.alternate
    ? `<p class="seo-alternate">${esc(options.alternate)}</p>`
    : '';

  return `<div class="seo-page">
  <header class="seo-top">
    <a class="seo-brand" href="/">${esc(SITE_NAME)}<small>${esc(SITE_NAME_NE)} · नेपाली संगीत रेडियो</small></a>
    <nav class="seo-nav" aria-label="Primary">
      ${link('/', 'Home')}
      ${link('/stations', 'Radio Worlds')}
      ${link('/catalog', 'All Songs')}
      ${link('/genres', 'Genres')}
    </nav>
  </header>
  ${breadcrumbs(options.crumbs)}
  <main class="seo-main">
    <p class="seo-kicker">${esc(options.kicker)}</p>
    <h1 class="seo-title">${esc(options.title)}</h1>
    ${alternate}
    ${options.intro ? `<p class="seo-lede">${esc(options.intro)}</p>` : ''}
    ${options.body}
  </main>
  <footer class="seo-foot">
    <p>${esc(SITE_NAME)} — ${esc(SITE_NAME_NE)} · ${link('/stations', 'Radio Worlds')} · ${link('/catalog', 'Song Catalog')} · ${link('/genres', 'Genres')} · ${link('/feed.xml', 'RSS')}</p>
    <p>All playback is an official YouTube embed. No audio files are hosted.</p>
  </footer>
</div>`;
}

function artworkFor(song: Pick<Song, 'artwork_url' | 'provider_video_id' | 'title'>): string | null {
  if (song.artwork_url && /^https?:\/\//i.test(song.artwork_url)) return song.artwork_url;
  if (song.provider_video_id && /^[A-Za-z0-9_-]{6,20}$/.test(song.provider_video_id)) {
    return `https://img.youtube.com/vi/${song.provider_video_id}/hqdefault.jpg`;
  }
  return null;
}

function songCards(songs: Song[], locale: 'ne' | 'en' = 'ne'): string {
  if (songs.length === 0) return '';
  const cards = songs
    .map((song) => {
      const image = artworkFor(song);
      const title = locale === 'ne' ? song.title_ne || song.title : song.title;
      const sub = [song.artist_name, song.release_year].filter(Boolean).join(' · ');
      return `<li class="seo-card">
  <a href="${esc(songPath(song))}">
    ${image ? `<img src="${esc(image)}" alt="${esc(song.title)}" loading="lazy" width="240" height="135">` : '<span class="seo-card-placeholder"></span>'}
    <span class="seo-card-title">${esc(title)}</span>
    <span class="seo-card-sub">${esc(sub)}</span>
  </a>
</li>`;
    })
    .join('\n');
  return `<ul class="seo-grid">${cards}</ul>`;
}

// ---------------------------------------------------------------------------
// Page bodies
// ---------------------------------------------------------------------------

function songBody(song: Song, artistSongs: Song[], related: Song[]): string {
  const image = artworkFor(song);
  const facts = [
    song.artist_name ? `Artist: ${song.artist_name}` : '',
    song.release_year ? `Year: ${song.release_year}` : '',
    song.decade ? `Decade: ${song.decade}` : '',
    song.primary_genre_name ? `Genre: ${song.primary_genre_name}` : '',
    song.album ? `Album: ${song.album}` : '',
    song.film_or_source ? `Film/source: ${song.film_or_source}` : '',
    song.composer ? `Composer: ${song.composer}` : '',
    song.lyricist ? `Lyricist: ${song.lyricist}` : '',
    song.language ? `Language: ${song.language}` : '',
  ].filter(Boolean);

  const artistLink = song.artist_name
    ? link(artistPath({ id: song.artist, display_name: song.artist_name }), song.artist_name)
    : '';

  return layout({
    kicker: 'Nepali song · बजेको चिया पसल',
    title: song.title,
    alternate: song.title_ne && song.title_ne !== song.title ? song.title_ne : null,
    intro: `${song.title}${song.release_year ? ` (${song.release_year})` : ''} — a Nepali ${
      song.primary_genre_name || 'classic'
    } song${song.artist_name ? ` by ${song.artist_name}` : ''}, streaming free through the official YouTube embed on ${SITE_NAME}.`,
    crumbs: [
      { name: 'Home', path: '/' },
      { name: 'Song Catalog', path: '/catalog' },
      { name: song.title, path: songPath(song) },
    ],
    body: `<div class="seo-detail">
  ${image ? `<img class="seo-cover" src="${esc(image)}" alt="${esc(song.title)}" width="480" height="360">` : ''}
  <div>
    <p class="seo-meta">${artistLink}${song.release_year ? ` · ${esc(song.release_year)}` : ''}${song.duration_seconds ? ` · ${Math.floor(song.duration_seconds / 60)}:${String(song.duration_seconds % 60).padStart(2, '0')}` : ''}</p>
    <ul class="seo-facts">${facts.map((fact) => `<li>${esc(fact)}</li>`).join('')}</ul>
    <p>${link(songPath(song), 'Play this song in the radio')}</p>
    ${song.provider_url ? `<p>${link(song.provider_url, 'Watch the official video on YouTube')}</p>` : ''}
  </div>
</div>
${artistSongs.length ? `<section><h2>More songs by ${esc(song.artist_name || 'this artist')}</h2>${songCards(artistSongs)}</section>` : ''}
${related.length ? `<section><h2>Related Nepali songs</h2>${songCards(related)}</section>` : ''}`,
  });
}

function artistBody(artist: Artist, songs: Song[]): string {
  const image = artist.profile_image && /^https?:\/\//i.test(artist.profile_image)
    ? `<img class="seo-avatar" src="${esc(artist.profile_image)}" alt="${esc(artist.display_name)}" width="160" height="160">`
    : '';

  return layout({
    kicker: 'Nepali artist · कलाकार',
    title: artist.display_name,
    alternate: artist.display_name_ne && artist.display_name_ne !== artist.display_name
      ? artist.display_name_ne
      : null,
    intro:
      artist.biography ||
      `Listen to ${songs.length || artist.songs_count || 0} Nepali songs by ${artist.display_name}, with a complete discography on ${SITE_NAME}.`,
    crumbs: [
      { name: 'Home', path: '/' },
      { name: 'Artists', path: '/artists' },
      { name: artist.display_name, path: artistPath(artist) },
    ],
    body: `${image ? `<div class="seo-avatar-wrap">${image}</div>` : ''}
<p class="seo-meta">${songs.length || artist.songs_count || 0} songs · ${esc(artist.verification_status)}</p>
<section><h2>Songs by ${esc(artist.display_name)}</h2>${songCards(songs)}</section>`,
  });
}

function stationBody(station: Station, songs: Song[]): string {
  const title = station.title_ne || station.title;
  const description = station.description || station.tagline;
  const image = station.cover_image && /^https?:\/\//i.test(station.cover_image)
    ? `<img class="seo-cover" src="${esc(station.cover_image)}" alt="${esc(title)}" width="640" height="400">`
    : '';

  return layout({
    kicker: 'Nepali radio station · रेडियो संसार',
    title,
    alternate: station.title !== title ? station.title : null,
    intro: [station.tagline, description].filter(Boolean).join(' '),
    crumbs: [
      { name: 'Home', path: '/' },
      { name: 'Radio Worlds', path: '/stations' },
      { name: title, path: stationPath(station) },
    ],
    body: `${image}
<section><h2>Songs on this station</h2>${songCards(songs)}</section>
<p>${link('/stations', 'Browse all ten radio worlds')} · ${link('/catalog', 'Search the full song catalog')}</p>`,
  });
}

function genreBody(genre: Genre, songs: Song[]): string {
  return layout({
    kicker: 'Nepali music genre · विधा',
    title: `${genre.name_ne || genre.name} गीतहरू`,
    alternate: genre.name_ne ? `${genre.name} songs` : null,
    intro:
      genre.description ||
      `Listen to ${songs.length} Nepali ${genre.name} songs on ${SITE_NAME}.`,
    crumbs: [
      { name: 'Home', path: '/' },
      { name: 'Genres', path: '/genres' },
      { name: genre.name, path: genrePath(genre) },
    ],
    body: `<section><h2>${esc(genre.name_ne || genre.name)} गीतहरू · ${esc(genre.name)} songs</h2>${songCards(songs)}</section>
<p>${link('/genres', 'Browse every genre')} · ${link('/catalog', 'Search the full catalog')}</p>`,
  });
}

function decadeBody(decade: string, songs: Song[]): string {
  return layout({
    kicker: 'Nepali music decade · दशक',
    title: `${decade} का नेपाली गीतहरू`,
    alternate: `${decade} Nepali songs`,
    intro: `Nepali songs from the ${decade} — Radio Nepal memories, vintage cassettes and timeless melodies.`,
    crumbs: [
      { name: 'Home', path: '/' },
      { name: 'Decades', path: '/decades' },
      { name: decade, path: decadePath(decade) },
    ],
    body: `<section><h2>${esc(decade)} का गीतहरू · songs from the ${esc(decade)}</h2>${songCards(songs)}</section>
<p>${link('/catalog', 'Search the full catalog')} · ${link('/stations', 'Browse radio worlds')}</p>`,
  });
}

// Shared with the FAQPage block in the home JSON-LD so the markup quoted in
// search results is exactly the copy a reader sees on the page.
const HOME_FAQS = [
  {
    q: 'बजेको चिया पसल के हो र यो कसरी काम गर्दछ?',
    a: 'बजेको चिया पसल एक मौलिक नेपाली संगीत रेडियो प्लेटफर्म हो। चिया पसल, पुरानो रेडियो, बस यात्रा जस्ता विषयगत संसार छानेर कालजयी नेपाली गीतहरू निरन्तर सुन्न सकिन्छ। सम्पूर्ण प्लेब्याक आधिकारिक युट्युब इम्बेड मार्फत हुन्छ।',
  },
  {
    q: 'के गीत सुन्न खाता खोल्नु अनिवार्य छ?',
    a: 'छैन। अतिथि प्रयोगकर्ताको रूपमा जो कोहीले पनि बिना दर्ता जुनसुकै स्टेसन वा गीत सुन्न र मनपर्ने सूचीमा थप्न सक्नुहुन्छ।',
  },
  {
    q: 'कुनै भिडियो नबजेमा वा प्रतिलिपि अधिकार सम्बन्धी उजुरी भएमा के गर्ने?',
    a: 'साइटको प्रतिलिपि अधिकार तथा उजुरी फारम मार्फत जानकारी गराउन सक्नुहुन्छ। हाम्रो टोलीले समीक्षा गरी आवश्यक परेमा सामग्री हटाउनेछ।',
  },
  {
    q: 'के अफलाइन हुँदा गीत बज्छ?',
    a: 'इन्टरफेस र क्याटलग अफलाइन सुरक्षित हुन्छ, तर युट्युबको आधिकारिक इम्बेड अडियो सुन्न सक्रिय इन्टरनेट जडान चाहिन्छ।',
  },
];

function homeBody(
  stations: Station[],
  songs: Song[],
  genres: Genre[],
  decades: Array<{ decade: string; count: number }>,
  festivals: FestivalCategory[]
): string {
  const faqs = HOME_FAQS;
  const topSongs = [...songs].sort((a, b) => b.play_count - a.play_count).slice(0, 12);

  return layout({
    kicker: 'Nepali music radio · बजेको चिया पसल',
    title: 'बजेको चिया पसल — नेपाली संगीत, पुराना सम्झना',
    alternate: 'Bajeko Chiya Pasal — Nepali Music Radio & Timeless Memories',
    intro:
      'Stream timeless Nepali music through ten themed radio worlds — tea shop classics, vintage Radio Nepal, highway bus songs, lok dohori, rock and festival playlists. 300+ songs, every one an official YouTube embed.',
    crumbs: [{ name: 'Home', path: '/' }],
    body: `<section><h2>Ten themed Nepali radio worlds</h2><ul class="seo-grid">${stations
      .map(
        (station) => `<li class="seo-card"><a href="${esc(stationPath(station))}">
  ${station.cover_image ? `<img src="${esc(station.cover_image)}" alt="${esc(station.title)}" loading="lazy" width="320" height="200">` : ''}
  <span class="seo-card-title">${esc(station.title_ne || station.title)}</span>
  <span class="seo-card-sub">${esc(station.tagline_ne || station.tagline)}</span>
</a></li>`
      )
      .join('')}</ul></section>
<section><h2>Most played Nepali songs</h2>${songCards(topSongs)}</section>
<section><h2>Browse by genre</h2><p>${genres
      .map((genre) => link(genrePath(genre), `${genre.name_ne || genre.name} (${genre.songs_count ?? 0})`))
      .join(' · ')}</p></section>
<section><h2>Browse by decade</h2><p>${decades
      .map((entry) => link(decadePath(entry.decade), `${entry.decade} (${entry.count})`))
      .join(' · ')}</p></section>
<section><h2>Festival playlists</h2><p>${festivals
      .map((festival) => link(festivalPath(festival), festival.name_ne || festival.name))
      .join(' · ')}</p></section>
<section><h2>Browse the collection</h2><p>${link('/artists', 'All Nepali artists')} · ${link('/decades', 'Songs by decade')} · ${link('/festivals', 'All festival playlists')} · ${link('/genres', 'All genres')} · ${link('/stations', 'All radio worlds')} · ${link('/catalog', 'The full song catalog')}</p></section>
<section><h2>Frequently asked questions</h2>${faqs
      .map((faq) => `<h3>${esc(faq.q)}</h3><p>${esc(faq.a)}</p>`)
      .join('')}</section>`,
  });
}

function festivalBody(
  festival: FestivalCategory,
  songs: FestivalSong[],
  songIndex: Map<number, Song>
): string {
  const rows = songs
    .map((song, index) => {
      const full = songIndex.get(song.id);
      const href = full
        ? songPath(full)
        : songPath({ id: song.id, title: song.title, title_ne: song.title_ne || undefined });
      return `<li><span class="seo-index">${index + 1}</span>${link(href, song.title)}${
        song.artist_name ? `<span>${esc(song.artist_name)}</span>` : ''
      }</li>`;
    })
    .join('');

  return layout({
    kicker: 'Nepali festival songs · चाडपर्व',
    title: `${festival.name_ne || festival.name} का गीतहरू`,
    alternate: `${festival.name} songs`,
    intro:
      festival.description ||
      `${festival.name} songs — festive Nepali music for family gatherings and celebration.`,
    crumbs: [
      { name: 'Home', path: '/' },
      { name: 'Festivals', path: '/festivals' },
      { name: festival.name, path: festivalPath(festival) },
    ],
    body: `<section><h2>${esc(festival.name_ne || festival.name)} प्लेलिस्ट · ${esc(festival.name)} songs</h2><ol class="seo-list">${rows}</ol></section>
<p>${link('/catalog', 'Search the full catalog')} · ${link('/stations', 'Browse radio worlds')}</p>`,
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(
      '[prerender] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — ' +
        'skipping catalog prerender. The base SPA and public/sitemap.xml are still deployed.'
    );
    return;
  }

  const base = await readFile(join(DIST, 'index.html'), 'utf8');
  console.log('[prerender] loading catalog…');

  const [stations, songs, artists, genres, categories, decades, festivals] = await Promise.all([
    rpc<Station[]>('get_stations', {}),
    fetchAllSongs(),
    rpc<Artist[]>('get_artists', { p_search: '' }),
    rpc<Genre[]>('get_genres', {}),
    rpc<GenreCategory[]>('get_genre_categories', {}),
    rpc<{ decade: string; count: number }[]>('get_decades', {}),
    rpc<FestivalCategory[]>('get_festival_categories', {}),
  ]);

  const stationDetails = await Promise.all(
    stations.map((station) => rpc<Station>('get_station_detail', { p_slug: station.slug }))
  );
  const festivalPlaylists = await Promise.all(
    festivals.map(async (festival) => ({
      slug: festival.slug,
      playlist: await rpc<{ results: FestivalSong[] }>('get_festival_songs', {
        p_festival_slug: festival.slug,
        p_limit: 100,
      }),
    }))
  );

  const songIndex = new Map(songs.map((song) => [song.id, song]));
  const genreById = new Map(genres.map((genre) => [genre.id, genre]));
  const songsByArtist = new Map<number, Song[]>();
  const songsByGenre = new Map<string, Song[]>();
  const songsByDecade = new Map<string, Song[]>();
  const playlistByFestival = new Map(festivalPlaylists.map((entry) => [entry.slug, entry.playlist.results]));

  for (const song of songs) {
    if (!songsByArtist.has(song.artist)) songsByArtist.set(song.artist, []);
    songsByArtist.get(song.artist)!.push(song);

    if (!songsByDecade.has(song.decade)) songsByDecade.set(song.decade, []);
    songsByDecade.get(song.decade)!.push(song);

    const genreIds = new Set<number>();
    if (song.primary_genre) genreIds.add(song.primary_genre);
    for (const id of song.secondary_genres ?? []) genreIds.add(id);
    for (const id of genreIds) {
      const genre = genreById.get(id);
      if (!genre) continue;
      if (!songsByGenre.has(genre.slug)) songsByGenre.set(genre.slug, []);
      songsByGenre.get(genre.slug)!.push(song);
    }
  }

  let written = 0;
  async function emit(path: string, html: string): Promise<void> {
    // `/songs/1/x` → dist/songs/1/x.html (cleanUrls serves it at the clean path)
    const target = join(DIST, `${path.replace(/^\//, '')}.html`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html, 'utf8');
    written += 1;
  }

  // --- home ----------------------------------------------------------------
  // The home page is the strongest crawl entry point, so it gets a real body
  // too instead of the empty SPA shell. React still replaces it on load.
  const homeSeo = {
    title: ROUTES.home.title.ne,
    description: ROUTES.home.description.ne,
    canonical: `${SITE_URL}/`,
    robots: ROUTES.home.robots,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: `${SITE_NAME} — Nepali music radio`,
  };
  const homeHtml = buildPage(
    base,
    homeSeo,
    homeBody(
      stations,
      songs,
      genres,
      decades,
      festivals
    ),
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: SITE_NAME,
          url: `${SITE_URL}/`,
          inLanguage: 'ne-NP',
          isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: stations.length,
            itemListElement: stations.map((station, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'RadioStation',
                name: station.title_ne || station.title,
                url: `${SITE_URL}${stationPath(station)}`,
              },
            })),
          },
        },
        {
          '@type': 'FAQPage',
          inLanguage: 'ne-NP',
          mainEntity: HOME_FAQS.map((faq) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a },
          })),
        },
      ],
    }
  );
  await writeFile(join(DIST, 'index.html'), homeHtml, 'utf8');
  written += 1;

  // --- stations ------------------------------------------------------------
  const stationsMeta = stationsSeo('ne');
  await emit(
    '/stations',
    buildPage(
      base,
      { ...stationsMeta, title: ROUTES.stations.title.ne, description: ROUTES.stations.description.ne },
      layout({
        kicker: 'Ten themed radio worlds',
        title: 'विषयगत नेपाली रेडियो संसार',
        intro:
          'Tea shop, vintage radio, highway bus, lok dohori, love songs, biraha, Nepali rock and festival worlds — ten themed stations, always on.',
        crumbs: [
          { name: 'Home', path: '/' },
          { name: 'Radio Worlds', path: '/stations' },
        ],
        body: `<ul class="seo-grid">${stations
          .map(
            (station) => `<li class="seo-card"><a href="${esc(stationPath(station))}">
  ${station.cover_image ? `<img src="${esc(station.cover_image)}" alt="${esc(station.title)}" loading="lazy" width="320" height="200">` : ''}
  <span class="seo-card-title">${esc(station.title_ne || station.title)}</span>
  <span class="seo-card-sub">${esc(station.tagline)}</span>
</a></li>`
          )
          .join('')}</ul>`,
      }),
      collectionJsonLd({
        name: 'Radio Worlds',
        description: 'Ten themed Nepali radio stations',
        path: '/stations',
      })
    )
  );

  for (const station of stationDetails) {
    const stationSongs = (station.station_songs ?? [])
      .map((entry) => entry.song)
      .filter((song) => song?.publication_status === 'published');
    await emit(
      stationPath(station),
      buildPage(
        base,
        stationSeo(station, 'ne'),
        stationBody(station, stationSongs),
        stationJsonLd(station, 'ne', stationSongs)
      )
    );
  }

  // --- genres --------------------------------------------------------------
  const genreGroups = categories
    .map((category) => ({
      category,
      genres: genres.filter((genre) => genre.category === category.slug),
    }))
    .filter((group) => group.genres.length > 0);

  await emit(
    '/genres',
    buildPage(
      base,
      genresSeo('ne'),
      layout({
        kicker: 'Nepali music genres',
        title: 'नेपाली संगीतका विधाहरू',
        intro:
          'From classical and folk traditions to modern pop, rock and festival songs — pick a genre and stream its full collection.',
        crumbs: [
          { name: 'Home', path: '/' },
          { name: 'Genres', path: '/genres' },
        ],
        body: genreGroups
          .map(
            (group) => `<section><h2>${esc(group.category.name)}</h2><ul class="seo-grid">${group.genres
              .map(
                (genre) => `<li class="seo-card"><a href="${esc(genrePath(genre))}">
  <span class="seo-card-title">${esc(genre.name_ne || genre.name)}</span>
  <span class="seo-card-sub">${esc(genre.name)} · ${genre.songs_count ?? 0} songs</span>
</a></li>`
              )
              .join('')}</ul></section>`
          )
          .join(''),
      }),
      collectionJsonLd({
        name: 'Nepali music genres',
        description: 'Every Nepali music genre on Bajeko Chiya Pasal',
        path: '/genres',
      })
    )
  );

  for (const genre of genres) {
    const genreSongs = songsByGenre.get(genre.slug) ?? [];
    if (genreSongs.length === 0) continue;
    await emit(
      genrePath(genre),
      buildPage(
        base,
        genreSeo(genre, genreSongs.length, 'ne'),
        genreBody(genre, genreSongs),
        collectionJsonLd({
          name: `${genre.name} songs`,
          description: genre.description || `Nepali ${genre.name} songs`,
          path: genrePath(genre),
          songs: genreSongs,
          parent: { name: 'Genres', path: '/genres' },
        })
      )
    );
  }

  // --- artist / decade / festival hubs ------------------------------------
  await emit(
    '/artists',
    buildPage(
      base,
      artistsSeo('ne'),
      layout({
        kicker: 'Nepali artists',
        title: 'नेपाली कलाकारहरू',
        alternate: 'Nepali Artists',
        intro:
          'Biographies and complete discographies — from Narayan Gopal and Tara Devi to today’s new voices.',
        crumbs: [
          { name: 'Home', path: '/' },
          { name: 'Artists', path: '/artists' },
        ],
        body: `<ul class="seo-list">${[...artists]
          .filter((artist) => (songsByArtist.get(artist.id)?.length ?? 0) > 0)
          .sort((a, b) => a.display_name.localeCompare(b.display_name))
          .map(
            (artist) =>
              `<li>${link(artistPath(artist), artist.display_name)}<span>${artist.songs_count ?? 0} songs</span></li>`
          )
          .join('')}</ul>`,
      }),
      itemListJsonLd({
        name: 'Nepali artists',
        description: 'Nepali singers, bands and composers',
        path: '/artists',
        items: artists
          .filter((artist) => (songsByArtist.get(artist.id)?.length ?? 0) > 0)
          .map((artist) => ({
            name: artist.display_name,
            url: artistPath(artist),
            type: 'Person',
          })),
      })
    )
  );

  await emit(
    '/decades',
    buildPage(
      base,
      decadesSeo('ne'),
      layout({
        kicker: 'Nepali songs by decade',
        title: 'दशक अनुसार नेपाली गीतहरू',
        alternate: 'Nepali Songs by Decade',
        intro: 'From the 1960s to the 2020s — a separate collection of timeless Nepali songs for every decade.',
        crumbs: [
          { name: 'Home', path: '/' },
          { name: 'Decades', path: '/decades' },
        ],
        body: `<ul class="seo-grid">${decades
          .map(
            (entry) => `<li class="seo-card"><a href="${esc(decadePath(entry.decade))}">
  <span class="seo-card-title">${esc(entry.decade)}</span>
  <span class="seo-card-sub">${entry.count} Nepali songs</span>
</a></li>`
          )
          .join('')}</ul>`,
      }),
      itemListJsonLd({
        name: 'Nepali songs by decade',
        description: 'Golden Nepali songs from the 1960s to the 2020s',
        path: '/decades',
        items: decades.map((entry) => ({
          name: `${entry.decade} Nepali songs`,
          url: decadePath(entry.decade),
          type: 'MusicPlaylist',
        })),
      })
    )
  );

  await emit(
    '/festivals',
    buildPage(
      base,
      festivalsSeo('ne'),
      layout({
        kicker: 'Nepali festival songs',
        title: 'नेपाली चाडपर्वका गीतहरू',
        alternate: 'Nepali Festival Songs',
        intro:
          'Dashain, Tihar, Chhath, Teej, Holi and Buddha Jayanti — a dedicated Nepali playlist for every celebration.',
        crumbs: [
          { name: 'Home', path: '/' },
          { name: 'Festivals', path: '/festivals' },
        ],
        body: `<ul class="seo-grid">${festivals
          .map(
            (festival) => `<li class="seo-card"><a href="${esc(festivalPath(festival))}">
  <span class="seo-card-title">${esc(festival.name_ne || festival.name)}</span>
  <span class="seo-card-sub">${esc(festival.name)} · ${playlistByFestival.get(festival.slug)?.length ?? 0} songs</span>
</a></li>`
          )
          .join('')}</ul>`,
      }),
      itemListJsonLd({
        name: 'Nepali festival songs',
        description: 'Festival playlists for Dashain, Tihar, Chhath, Teej and more',
        path: '/festivals',
        items: festivals.map((festival) => ({
          name: `${festival.name} songs`,
          url: festivalPath(festival),
          type: 'MusicPlaylist',
        })),
      })
    )
  );

  // --- catalog -------------------------------------------------------------
  await emit(
    '/catalog',
    buildPage(
      base,
      { ...catalogSeo('ne'), title: ROUTES.catalog.title.ne, description: ROUTES.catalog.description.ne },
      layout({
        kicker: 'Nepali song catalog',
        title: 'सम्पूर्ण नेपाली गीत संग्रह',
        intro:
          'Browse 300+ timeless Nepali songs by artist, genre, decade or language. Every entry streams through an official YouTube embed.',
        crumbs: [
          { name: 'Home', path: '/' },
          { name: 'Song Catalog', path: '/catalog' },
        ],
        body: `<section><h2>Browse by genre</h2><p>${genres
          .map((genre) => link(genrePath(genre), `${genre.name} (${songsByGenre.get(genre.slug)?.length ?? 0})`))
          .join(' · ')}</p></section>
<section><h2>Browse by decade</h2><p>${decades
          .map((entry) => link(decadePath(entry.decade), `${entry.decade} (${entry.count})`))
          .join(' · ')}</p></section>
<section><h2>Most played songs</h2>${songCards([...songs].sort((a, b) => b.play_count - a.play_count).slice(0, 60))}</section>`,
      }),
      collectionJsonLd({
        name: 'Nepali Song Catalog',
        description: 'Every song on Bajeko Chiya Pasal',
        path: '/catalog',
        songs,
      })
    )
  );

  // --- songs ---------------------------------------------------------------
  for (const song of songs) {
    const byArtist = (songsByArtist.get(song.artist) ?? [])
      .filter((item) => item.id !== song.id)
      .slice(0, 8);
    const genre = song.primary_genre ? genreById.get(song.primary_genre) : undefined;
    const related = (genre ? songsByGenre.get(genre.slug) ?? [] : [])
      .filter((item) => item.id !== song.id)
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 8);

    await emit(
      songPath(song),
      buildPage(
        base,
        songSeo(song, 'ne'),
        songBody(song, byArtist, related),
        songJsonLd(song, 'ne')
      )
    );
  }

  // --- decades -------------------------------------------------------------
  for (const entry of decades) {
    const decadeSongs = songsByDecade.get(entry.decade) ?? [];
    if (decadeSongs.length === 0) continue;
    await emit(
      decadePath(entry.decade),
      buildPage(
        base,
        decadeSeo(entry.decade, decadeSongs.length, 'ne'),
        decadeBody(entry.decade, decadeSongs),
        collectionJsonLd({
          name: `${entry.decade} Nepali songs`,
          description: `Nepali songs from the ${entry.decade}`,
          path: decadePath(entry.decade),
          songs: decadeSongs,
          parent: { name: 'Decades', path: '/decades' },
        })
      )
    );
  }

  // --- artists -------------------------------------------------------------
  for (const artist of artists) {
    const artistSongs = songsByArtist.get(artist.id) ?? [];
    if (artistSongs.length === 0) continue;
    await emit(
      artistPath(artist),
      buildPage(
        base,
        artistSeo(artist, 'ne'),
        artistBody(artist, artistSongs),
        artistJsonLd(artist, artistSongs, 'ne')
      )
    );
  }

  // --- festivals -----------------------------------------------------------
  for (const festival of festivals) {
    const playlist = playlistByFestival.get(festival.slug) ?? [];
    if (playlist.length === 0) continue;
    await emit(
      festivalPath(festival),
      buildPage(
        base,
        festivalSeo(festival, playlist.length, 'ne'),
        festivalBody(festival, playlist, songIndex),
        collectionJsonLd({
          name: `${festival.name} songs`,
          description: festival.description || `${festival.name} Nepali songs`,
          path: festivalPath(festival),
          songs: playlist.map((song) => ({
            id: song.id,
            title: song.title,
            title_ne: song.title_ne || undefined,
          })),
          parent: { name: 'Festivals', path: '/festivals' },
        })
      )
    );
  }

  // --- sitemap -------------------------------------------------------------
  const urls: Array<{ path: string; priority: string; changefreq: string }> = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/stations', priority: '0.9', changefreq: 'weekly' },
    { path: '/catalog', priority: '0.9', changefreq: 'daily' },
    { path: '/genres', priority: '0.8', changefreq: 'weekly' },
    { path: '/artists', priority: '0.8', changefreq: 'weekly' },
    { path: '/decades', priority: '0.8', changefreq: 'weekly' },
    { path: '/festivals', priority: '0.8', changefreq: 'weekly' },
    ...stationDetails.map((station) => ({
      path: stationPath(station),
      priority: '0.8',
      changefreq: 'weekly',
    })),
    ...genres
      .filter((genre) => (songsByGenre.get(genre.slug)?.length ?? 0) > 0)
      .map((genre) => ({ path: genrePath(genre), priority: '0.8', changefreq: 'weekly' })),
    ...decades.map((entry) => ({
      path: decadePath(entry.decade),
      priority: '0.8',
      changefreq: 'monthly',
    })),
    ...festivals
      .filter((festival) => (playlistByFestival.get(festival.slug)?.length ?? 0) > 0)
      .map((festival) => ({
        path: festivalPath(festival),
        priority: '0.7',
        changefreq: 'weekly',
      })),
    ...artists
      .filter((artist) => (songsByArtist.get(artist.id)?.length ?? 0) > 0)
      .map((artist) => ({ path: artistPath(artist), priority: '0.7', changefreq: 'monthly' })),
    ...songs.map((song) => ({ path: songPath(song), priority: '0.7', changefreq: 'monthly' })),
  ];

  // De-duplicate (an entity can legitimately appear through two labels).
  const seen = new Set<string>();
  const uniqueUrls = urls.filter((entry) => {
    if (seen.has(entry.path)) return false;
    seen.add(entry.path);
    return true;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls
  .map(
    (entry) => `  <url>
    <loc>${SITE_URL}${entry.path}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
  await writeFile(join(DIST, 'sitemap.xml'), sitemap, 'utf8');

  // --- RSS -----------------------------------------------------------------
  const latest = [...songs]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 50);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)} — नेपाली संगीत, पुराना सम्झना</title>
    <link>${SITE_URL}/</link>
    <description>Timeless Nepali music across themed radio worlds — tea shop classics, vintage Radio Nepal, highway bus songs, lok dohori and festival playlists.</description>
    <language>ne</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${latest
  .map(
    (song) => `    <item>
      <title>${esc(song.title)}</title>
      <link>${SITE_URL}${songPath(song)}</link>
      <guid isPermaLink="true">${SITE_URL}${songPath(song)}</guid>
      <description>${esc(
        `${song.title}${song.release_year ? ` (${song.release_year})` : ''}${
          song.artist_name ? ` by ${song.artist_name}` : ''
        }${song.primary_genre_name ? ` — ${song.primary_genre_name}` : ''}`
      )}</description>
      ${song.created_at ? `<pubDate>${new Date(song.created_at).toUTCString()}</pubDate>` : ''}
    </item>`
  )
  .join('\n')}
  </channel>
</rss>
`;
  await writeFile(join(DIST, 'feed.xml'), rss, 'utf8');

  console.log(
    `[prerender] wrote ${written} pages, ${uniqueUrls.length} sitemap URLs and feed.xml ` +
      `(${songs.length} songs, ${artists.length} artists, ${genres.length} genres, ` +
      `${stationDetails.length} stations, ${festivals.length} festivals).`
  );
}

main().catch((error) => {
  console.error('[prerender] failed:', error);
  process.exit(1);
});
