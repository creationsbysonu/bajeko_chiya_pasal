/**
 * Canonical URLs, titles, descriptions and structured data for every entity in
 * the catalog.
 *
 * Why this file is separate from `seo.ts`:
 *   - The browser app uses it to rewrite `<head>` when a listener opens a song,
 *     artist, station, genre, decade or festival page.
 *   - The build-time prerenderer (`scripts/prerender.ts`) imports it directly
 *     with Node's TypeScript support, so the HTML a crawler downloads and the
 *     HTML a visitor sees carry exactly the same metadata. Keep every runtime
 *     import out of this module (types are stripped at build time).
 *
 * Titles are written for search results first: the entity name, then the
 * qualifying context (artist / genre / place), then the brand. Descriptions are
 * clipped to ~158 characters so Google does not truncate the useful part.
 */

import type { Artist, FestivalCategory, Genre, Song, Station } from '../types/index.ts';

export type Locale = 'ne' | 'en';

/** Production origin — canonicals, sitemap, RSS and social cards all use it. */
export const SITE_URL = 'https://bajeko-chiya-pasal.vercel.app';
export const SITE_NAME = 'Bajeko Chiya Pasal';
export const SITE_NAME_NE = 'बजेको चिया पसल';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const SITE_DESCRIPTION =
  'Bajeko Chiya Pasal (बजेको चिया पसल) streams timeless Nepali music through themed radio worlds — tea shop classics, vintage Radio Nepal, highway bus songs, lok dohori, rock and festival playlists.';

/** Large image previews and long snippets are eligibility gates for rich results. */
export const INDEX_ROBOTS =
  'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
export const NOINDEX_ROBOTS = 'noindex,follow';

/** The minimum shape every list/JSON-LD builder needs from a song. */
export interface SongLite {
  id: number;
  title: string;
  title_ne?: string;
  romanized_title?: string;
}

export interface SeoMeta {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogType: string;
  ogImage?: string;
  ogImageAlt?: string;
}

/** URL-safe slug from Latin text; `''` when the string is entirely non-Latin. */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

/** `/songs/123/euta-manche-ko-mayale` — the id is the key, the slug is context. */
export function songPath(song: SongLite): string {
  const slug =
    slugify(song.romanized_title || song.title || '') ||
    slugify(song.title_ne || '') ||
    'song';
  return `/songs/${song.id}/${slug}`;
}

export function artistPath(artist: Pick<Artist, 'id' | 'display_name'>): string {
  return `/artists/${artist.id}/${slugify(artist.display_name) || 'artist'}`;
}

/** Artist path when only the id and name are known (e.g. inside a Song). */
export function artistPathById(id: number, name: string): string {
  return `/artists/${id}/${slugify(name) || 'artist'}`;
}

export function stationPath(station: Pick<Station, 'slug'>): string {
  return `/stations/${station.slug}`;
}

export function genrePath(genre: Pick<Genre, 'slug'>): string {
  return `/genres/${genre.slug}`;
}

export function decadePath(decade: string): string {
  return `/decades/${encodeURIComponent(decade)}`;
}

export function festivalPath(festival: Pick<FestivalCategory, 'slug'>): string {
  return `/festivals/${festival.slug}`;
}

export const HOME_PATH = '/';
export const STATIONS_PATH = '/stations';
export const CATALOG_PATH = '/catalog';
export const GENRES_PATH = '/genres';
export const ARTISTS_PATH = '/artists';
export const DECADES_PATH = '/decades';
export const FESTIVALS_PATH = '/festivals';
export const FAVORITES_PATH = '/favorites';

/** Only absolute http(s) image URLs are usable in og:image / JSON-LD. */
export function absoluteImage(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return SITE_URL + trimmed;
  return undefined;
}

/** Join only the non-empty fragments, e.g. for "Folk · 1970s · Nepali". */
function joinParts(parts: Array<string | undefined | null | false>): string {
  return parts.filter(Boolean).join(' · ');
}

/** Trim to a whole word at or below `max` characters. */
function clip(value: string, max = 158): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return (space > 60 ? cut.slice(0, space) : cut).replace(/[,;:·-]+$/, '') + '…';
}

function yearLabel(year?: number | null): string {
  return year ? String(year) : '';
}

function genreLabel(song: Song, locale: Locale): string {
  if (locale === 'ne') return song.primary_genre_name_ne || song.primary_genre_name || '';
  return song.primary_genre_name || song.primary_genre_name_ne || '';
}

function artistLabel(song: Song, locale: Locale): string {
  if (locale === 'ne') return song.artist_name_ne || song.artist_name || '';
  return song.artist_name || song.artist_name_ne || '';
}

/** ISO-8601 duration for schema.org (`PT4M12S`). */
export function isoDuration(seconds?: number | null): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `PT${mins ? `${mins}M` : ''}${secs ? `${secs}S` : mins ? '' : '0S'}`;
}

// ---------------------------------------------------------------------------
// Song
// ---------------------------------------------------------------------------

export function songSeo(song: Song, locale: Locale = 'ne'): SeoMeta {
  const artist = artistLabel(song, locale) || song.artist_name || '';
  const title = song.title || song.title_ne || 'Nepali song';
  const genre = genreLabel(song, locale);
  const year = yearLabel(song.release_year);
  const canonical = `${SITE_URL}${songPath(song)}`;

  const alternateTitle =
    song.title_ne && song.title_ne !== title
      ? song.title_ne
      : song.romanized_title && song.romanized_title !== title
        ? song.romanized_title
        : '';

  const seoTitle =
    locale === 'ne'
      ? `${title}${alternateTitle ? ` (${alternateTitle})` : ''}${
          artist ? ` — ${artist}` : ''
        } | ${SITE_NAME}`
      : `${title}${alternateTitle ? ` (${alternateTitle})` : ''}${
          artist ? ` by ${artist}` : ''
        } — Nepali Song | ${SITE_NAME}`;

  const description =
    locale === 'ne'
      ? clip(
          `${song.title_ne && song.title_ne !== title ? `${song.title_ne} — ` : ''}${title}${
            year ? ` (${year})` : ''
          }${artist ? `, ${artist}` : ''}। ${joinParts([genre, song.decade])} — ${SITE_NAME} मा निःशुल्क सुन्नुहोस्।`
        )
      : clip(
          `Listen to “${title}”${year ? ` (${year})` : ''}${
            artist ? ` by ${artist}` : ''
          }${genre ? ` — ${genre}` : ''}. A Nepali classic streaming free on ${SITE_NAME}, Nepal's nostalgic music radio.`
        );

  return {
    title: seoTitle,
    description,
    canonical,
    robots: INDEX_ROBOTS,
    ogType: 'music.song',
    ogImage: absoluteImage(song.artwork_url) || DEFAULT_OG_IMAGE,
    ogImageAlt: `${title}${artist ? ` — ${artist}` : ''}`,
  };
}

export function songJsonLd(song: Song, locale: Locale = 'ne'): Record<string, unknown> {
  const artist = song.artist_name || '';
  const artistNe = song.artist_name_ne || '';
  const canonical = `${SITE_URL}${songPath(song)}`;
  const videoId = song.provider_video_id || '';
  const genre = genreLabel(song, locale);

  const recording: Record<string, unknown> = {
    '@type': 'MusicRecording',
    '@id': `${canonical}#recording`,
    name: song.title,
    url: canonical,
    inLanguage: song.language === 'Nepali' ? 'ne' : song.language || 'ne',
    byArtist: {
      '@type': 'Person',
      name: artist,
      ...(artistNe && artistNe !== artist ? { alternateName: artistNe } : {}),
      ...(song.artist
        ? { url: `${SITE_URL}${artistPathById(song.artist, artist || artistNe || 'artist')}` }
        : {}),
    },
    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
  };

  if (song.title_ne && song.title_ne !== song.title) recording.alternateName = song.title_ne;
  if (genre) recording.genre = genre;
  if (song.release_year) recording.datePublished = String(song.release_year);
  if (song.album) recording.inAlbum = { '@type': 'MusicAlbum', name: song.album };
  if (song.duration_seconds) {
    const iso = isoDuration(song.duration_seconds);
    if (iso) recording.duration = iso;
  }
  if (song.composer) {
    recording.composer = { '@type': 'Person', name: song.composer };
  }
  if (song.lyricist) {
    recording.lyricist = { '@type': 'Person', name: song.lyricist };
  }
  if (song.featured_artists) {
    recording.contributor = song.featured_artists
      .split(',')
      .map((name) => ({ '@type': 'Person', name: name.trim() }))
      .filter((person) => person.name);
  }
  if (song.film_or_source) {
    recording.description = `${song.title} — from ${song.film_or_source}.`;
  }
  if (videoId) {
    const image = absoluteImage(song.artwork_url);
    recording.video = {
      '@type': 'VideoObject',
      name: `${song.title}${artist ? ` — ${artist}` : ''}`,
      description:
        song.film_or_source
          ? `${song.title} from ${song.film_or_source}. Official YouTube embed.`
          : `${song.title} by ${artist || 'Nepali artist'}. Official YouTube embed.`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      ...(image ? { thumbnailUrl: image } : {}),
      ...(song.provider_url ? { contentUrl: song.provider_url } : {}),
      ...(artist ? { creator: { '@type': 'Person', name: artist } } : {}),
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      recording,
      breadcrumbJsonLd([
        { name: 'Home', path: HOME_PATH },
        { name: 'Song Catalog', path: CATALOG_PATH },
        { name: song.title, path: songPath(song) },
      ]),
    ],
  };
}

// ---------------------------------------------------------------------------
// Artist
// ---------------------------------------------------------------------------

export function artistSeo(artist: Artist, locale: Locale = 'ne'): SeoMeta {
  const name = artist.display_name || 'Nepali artist';
  const nameNe = artist.display_name_ne || '';
  const count = artist.songs_count || 0;
  const canonical = `${SITE_URL}${artistPath(artist)}`;

  const seoTitle =
    locale === 'ne'
      ? `${nameNe || name}${nameNe && nameNe !== name ? ` (${name})` : ''} — नेपाली कलाकार${
          count ? `, ${count} गीत` : ''
        } | ${SITE_NAME}`
      : `${name}${nameNe && nameNe !== name ? ` (${nameNe})` : ''} — Nepali Songs, Albums & Biography | ${SITE_NAME}`;

  const description =
    locale === 'ne'
      ? clip(
          `${nameNe || name} का ${count ? `${count} ` : ''}नेपाली गीतहरू एकै ठाउँमा सुन्नुहोस्। कालजयी धुन, जीवनी र सम्पूर्ण गीतसूची — ${SITE_NAME} मा।`
        )
      : clip(
          `Listen to ${count ? `${count} ` : ''}Nepali songs by ${name}, with biography and complete discography on ${SITE_NAME}.`
        );

  return {
    title: seoTitle,
    description,
    canonical,
    robots: INDEX_ROBOTS,
    ogType: 'profile',
    ogImage: absoluteImage(artist.profile_image) || DEFAULT_OG_IMAGE,
    ogImageAlt: name,
  };
}

export function artistJsonLd(
  artist: Artist,
  songs: Song[] = [],
  locale: Locale = 'ne'
): Record<string, unknown> {
  const name = artist.display_name || '';
  const canonical = `${SITE_URL}${artistPath(artist)}`;
  const person: Record<string, unknown> = {
    '@type': 'Person',
    '@id': `${canonical}#artist`,
    name,
    url: canonical,
    mainEntityOfPage: canonical,
    ...(artist.display_name_ne && artist.display_name_ne !== name
      ? { alternateName: artist.display_name_ne }
      : {}),
  };

  const bio = locale === 'ne' ? artist.biography_ne || artist.biography : artist.biography;
  if (bio) person.description = bio;
  const image = absoluteImage(artist.profile_image);
  if (image) person.image = image;
  if (songs.length) {
    person.subjectOf = {
      '@type': 'ItemList',
      name: `${name} songs`,
      numberOfItems: songs.length,
      itemListElement: songs.slice(0, 50).map((song, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'MusicRecording',
          name: song.title,
          url: `${SITE_URL}${songPath(song)}`,
        },
      })),
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      person,
      breadcrumbJsonLd([
        { name: 'Home', path: HOME_PATH },
        { name: 'Artists', path: ARTISTS_PATH },
        { name, path: artistPath(artist) },
      ]),
    ],
  };
}

// ---------------------------------------------------------------------------
// Station
// ---------------------------------------------------------------------------

export function stationSeo(station: Station, locale: Locale = 'ne'): SeoMeta {
  const title = locale === 'ne' ? station.title_ne || station.title : station.title;
  const tagline = locale === 'ne' ? station.tagline_ne || station.tagline : station.tagline;
  const canonical = `${SITE_URL}${stationPath(station)}`;

  return {
    title: `${title}${station.title !== title ? ` (${station.title})` : ''} — ${
      locale === 'ne' ? 'नेपाली रेडियो स्टेसन' : 'Online Nepali Radio'
    } | ${SITE_NAME}`,
    description: clip(
      `${tagline ? `${tagline} ` : ''}${
        (locale === 'ne' ? station.description_ne : station.description) || station.description || ''
      }`.trim() ||
        `${title} — a themed Nepali music radio station on ${SITE_NAME}.`
    ),
    canonical,
    robots: INDEX_ROBOTS,
    ogType: 'music.radio_station',
    ogImage: absoluteImage(station.cover_image) || DEFAULT_OG_IMAGE,
    ogImageAlt: title,
  };
}

export function stationJsonLd(
  station: Station,
  locale: Locale = 'ne',
  songs: Song[] = []
): Record<string, unknown> {
  const title = locale === 'ne' ? station.title_ne || station.title : station.title;
  const tagline = locale === 'ne' ? station.tagline_ne || station.tagline : station.tagline;
  const canonical = `${SITE_URL}${stationPath(station)}`;
  const description = (locale === 'ne' ? station.description_ne : station.description) ||
    station.description ||
    tagline;

  const node: Record<string, unknown> = {
    '@type': 'RadioStation',
    '@id': `${canonical}#station`,
    name: title,
    url: canonical,
    description,
    ...(station.title !== title ? { alternateName: station.title } : {}),
    ...(tagline ? { slogan: tagline } : {}),
  };
  const image = absoluteImage(station.cover_image);
  if (image) node.image = image;

  // The playlist is an ItemList rather than a `track` property: `track` is
  // defined for MusicPlaylist, not RadioStation, and unknown properties make
  // the Rich Results test noisy.
  const playlist = songs.length
    ? {
        '@type': 'ItemList',
        name: `${title} playlist`,
        numberOfItems: songs.length,
        itemListElement: songs.slice(0, 50).map((song, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'MusicRecording',
            name: song.title,
            url: `${SITE_URL}${songPath(song)}`,
          },
        })),
      }
    : null;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      node,
      ...(playlist ? [playlist] : []),
      breadcrumbJsonLd([
        { name: 'Home', path: HOME_PATH },
        { name: 'Radio Worlds', path: STATIONS_PATH },
        { name: title, path: stationPath(station) },
      ]),
    ],
  };
}

// ---------------------------------------------------------------------------
// Collections (genre / decade / festival / station index / genre index)
// ---------------------------------------------------------------------------

export function collectionJsonLd(options: {
  name: string;
  description?: string;
  path: string;
  songs?: SongLite[];
  /** Label for the parent crumb, e.g. "Genres". Omit for top-level pages. */
  parent?: { name: string; path: string };
  inLanguage?: string;
}): Record<string, unknown> {
  const { name, description, path, songs = [], parent, inLanguage = 'ne' } = options;
  const canonical = `${SITE_URL}${path}`;

  const page: Record<string, unknown> = {
    '@type': 'CollectionPage',
    '@id': `${canonical}#page`,
    name,
    url: canonical,
    inLanguage,
    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
  };
  if (description) page.description = description;
  if (songs.length) {
    page.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: songs.length,
      itemListElement: songs.slice(0, 100).map((song, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'MusicRecording',
          name: song.title,
          url: `${SITE_URL}${songPath(song)}`,
        },
      })),
    };
  }

  const crumbs = [{ name: 'Home', path: HOME_PATH }];
  if (parent) crumbs.push(parent);
  crumbs.push({ name, path });

  return {
    '@context': 'https://schema.org',
    '@graph': [page, breadcrumbJsonLd(crumbs)],
  };
}

export function genreSeo(genre: Genre, count = 0, locale: Locale = 'ne'): SeoMeta {
  const name = locale === 'ne' ? genre.name_ne || genre.name : genre.name;
  const category = genre.category.replace(/_/g, ' ');
  // Some genre names already end in "गीत" (Adhunik Geet) or "संगीत"
  // (Nepali Classical); appending another "गीत" reads like a machine
  // translation and wastes title space.
  const neName = genre.name_ne || genre.name;
  const neSuffix = /(गीत|संगीत)$/.test(neName) ? '' : ' गीत';
  return {
    title:
      locale === 'ne'
        ? `${neName}${genre.name_ne && genre.name_ne !== genre.name ? ` (${genre.name})` : ''}${neSuffix} — नेपाली संगीत | ${SITE_NAME}`
        : `${genre.name}${genre.name_ne && genre.name_ne !== genre.name ? ` (${genre.name_ne})` : ''} Songs — Nepali Music | ${SITE_NAME}`,
    description: clip(
      locale === 'ne'
        ? `${name} विधाका ${count || 'कैयौं'} नेपाली गीतहरू निःशुल्क सुन्नुहोस्। ${genre.description || `${category} संगीतको संग्रह`} — ${SITE_NAME}।`
        : `Listen to ${count || 'the best'} ${genre.name} songs from Nepal${category ? ` (${category})` : ''}. ${genre.description || 'A curated Nepali music collection.'} Free on ${SITE_NAME}.`
    ),
    canonical: `${SITE_URL}${genrePath(genre)}`,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: `${name} — Nepali music`,
  };
}

export function decadeSeo(decade: string, count = 0, locale: Locale = 'ne'): SeoMeta {
  return {
    title:
      locale === 'ne'
        ? `${decade} का नेपाली गीत — पुराना कालजयी धुन | ${SITE_NAME}`
        : `${decade} Nepali Songs — Classic Hits & Golden Oldies | ${SITE_NAME}`,
    description: clip(
      locale === 'ne'
        ? `${decade} दशकका ${count || 'उत्कृष्ट'} नेपाली गीतहरू एकै ठाउँमा — रेडियो नेपालका सम्झना र कालजयी धुनहरू। ${SITE_NAME} मा निःशुल्क सुन्नुहोस्।`
        : `Stream ${count || 'the best'} Nepali songs from the ${decade}${count ? ` — ${count} tracks` : ''}. Golden oldies, Radio Nepal memories and timeless melodies on ${SITE_NAME}.`
    ),
    canonical: `${SITE_URL}${decadePath(decade)}`,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: `${decade} Nepali songs`,
  };
}

export function festivalSeo(
  festival: FestivalCategory,
  count = 0,
  locale: Locale = 'ne'
): SeoMeta {
  const name = locale === 'ne' ? festival.name_ne || festival.name : festival.name;
  return {
    title:
      locale === 'ne'
        ? `${name}${festival.name_ne && festival.name_ne !== festival.name ? ` (${festival.name})` : ''} गीत — नेपाली चाडपर्व संगीत | ${SITE_NAME}`
        : `${festival.name}${festival.name_ne && festival.name_ne !== festival.name ? ` (${festival.name_ne})` : ''} Songs — Nepali Festival Playlist | ${SITE_NAME}`,
    description: clip(
      locale === 'ne'
        ? `${name} का ${count || 'मन छुने'} नेपाली गीतहरू — चाडपर्वको रौनक र पारिवारिक सम्झना। ${SITE_NAME} मा प्लेलिस्ट सुन्नुहोस्।`
        : `${festival.name} songs${count ? ` (${count} tracks)` : ''} — festive Nepali music for family gatherings and celebration. ${festival.description || `Stream the ${festival.name} playlist on ${SITE_NAME}.`}`
    ),
    canonical: `${SITE_URL}${festivalPath(festival)}`,
    robots: INDEX_ROBOTS,
    ogType: 'music.playlist',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: `${name} songs`,
  };
}

export function catalogSeo(locale: Locale = 'ne'): SeoMeta {
  return {
    title:
      locale === 'ne'
        ? 'नेपाली गीतसूची — गायक, विधा र दशक अनुसार खोज्नुहोस् | Bajeko Chiya Pasal'
        : 'Nepali Song Catalog — Search by Artist, Genre & Decade | Bajeko Chiya Pasal',
    description: clip(
      locale === 'ne'
        ? '३००+ कालजयी नेपाली गीतहरू — नारायण गोपाल, तारा देवी, नेपथ्य, लोक दोहोरी, आधुनिक र चाडपर्वका गीत। गायक, विधा, दशक वा भाषा अनुसार खोज्नुहोस्।'
        : 'Browse 300+ timeless Nepali songs — Narayan Gopal, Tara Devi, Nepathya, lok dohori, modern hits and festival tracks. Search by artist, genre, decade or language.'
    ),
    canonical: `${SITE_URL}${CATALOG_PATH}`,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'Nepali song catalog',
  };
}

export function genresSeo(locale: Locale = 'ne'): SeoMeta {
  return {
    title:
      locale === 'ne'
        ? 'नेपाली संगीतका विधाहरू — लोक, दोहोरी, रक, गजल | Bajeko Chiya Pasal'
        : 'Nepali Music Genres — Folk, Dohori, Rock, Ghazal & More | Bajeko Chiya Pasal',
    description: clip(
      locale === 'ne'
        ? 'नेपाली संगीतका सबै विधाहरू — शास्त्रीय, लोक, दोहोरी, पप, रक, गजल र चाडपर्वका गीत। विधा छान्नुहोस् र पूरा सङ्ग्रह सुन्नुहोस्।'
        : 'Explore every Nepali music genre — classical, folk, dohori, pop, rock, ghazal and festive songs. Pick a genre and stream the full collection.'
    ),
    canonical: `${SITE_URL}${GENRES_PATH}`,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'Nepali music genres',
  };
}

export function artistsSeo(locale: Locale = 'ne'): SeoMeta {
  return {
    title:
      locale === 'ne'
        ? 'नेपाली कलाकारहरू — गायक, संगीतकार र ब्यान्डहरू | Bajeko Chiya Pasal'
        : 'Nepali Artists — Singers, Bands & Composers | Bajeko Chiya Pasal',
    description: clip(
      locale === 'ne'
        ? 'नेपाली संगीतका कलाकारहरू — नारायण गोपाल, तारा देवी, नेपथ्य, १९७४ एडी र सयौं गायक। जीवनी र सम्पूर्ण गीतसूची हेर्नुहोस्।'
        : 'Browse Nepali singers, bands and composers — Narayan Gopal, Tara Devi, Nepathya, 1974 AD and more. Read biographies and stream complete discographies.'
    ),
    canonical: `${SITE_URL}${ARTISTS_PATH}`,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'Nepali artists and singers',
  };
}

export function festivalsSeo(locale: Locale = 'ne'): SeoMeta {
  return {
    title:
      locale === 'ne'
        ? 'नेपाली चाडपर्वका गीत — दशैं, तिहार, छठ, तीज | Bajeko Chiya Pasal'
        : 'Nepali Festival Songs — Dashain, Tihar, Chhath, Teej Playlists | Bajeko Chiya Pasal',
    description: clip(
      locale === 'ne'
        ? 'दशैं, तिहार, छठ, तीज, होली र बुद्ध जयन्तीका नेपाली गीतहरू — हरेक चाडपर्वको प्लेलिस्ट एकै ठाउँमा।'
        : 'Dashain, Tihar, Chhath, Teej, Holi and Buddha Jayanti playlists — festive Nepali songs for every celebration, all in one place.'
    ),
    canonical: `${SITE_URL}${FESTIVALS_PATH}`,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'Nepali festival songs',
  };
}

export function decadesSeo(locale: Locale = 'ne'): SeoMeta {
  return {
    title:
      locale === 'ne'
        ? 'दशक अनुसार नेपाली गीत — १९६० देखि २०२० सम्म | Bajeko Chiya Pasal'
        : 'Nepali Songs by Decade — 1960s to 2020s | Bajeko Chiya Pasal',
    description: clip(
      locale === 'ne'
        ? '१९६० को दशकदेखि २०२० सम्मका कालजयी नेपाली गीतहरू — हरेक दशकको छुट्टै सङ्ग्रह, रेडियो नेपालका सम्झनासहित।'
        : 'Golden Nepali songs from the 1960s to the 2020s — a separate collection for every decade, from Radio Nepal classics to modern hits.'
    ),
    canonical: `${SITE_URL}${DECADES_PATH}`,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'Nepali songs by decade',
  };
}

export function stationsSeo(locale: Locale = 'ne'): SeoMeta {
  return {
    title:
      locale === 'ne'
        ? '१० रेडियो संसार — विषयगत नेपाली रेडियो | Bajeko Chiya Pasal'
        : '10 Nepali Radio Worlds — Themed Online Radio | Bajeko Chiya Pasal',
    description: clip(
      locale === 'ne'
        ? 'चिया पसल, पुरानो रेडियो, बस यात्रा, लोक दोहोरी, प्रेम गीत, बिरहा, नेपाली रक र चाडपर्व — १० विषयगत नेपाली रेडियो संसार।'
        : 'Tea shop, vintage radio, highway bus, lok dohori, love songs, biraha, Nepali rock and festival worlds — ten themed Nepali radio stations, always on.'
    ),
    canonical: `${SITE_URL}${STATIONS_PATH}`,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'Ten Nepali radio worlds',
  };
}

// ---------------------------------------------------------------------------
// Shared structured data
// ---------------------------------------------------------------------------

export function itemListJsonLd(options: {
  name: string;
  description?: string;
  path: string;
  items: Array<{ name: string; url: string; type?: string }>;
  parent?: { name: string; path: string };
  inLanguage?: string;
}): Record<string, unknown> {
  const { name, description, path, items, parent, inLanguage = 'ne' } = options;
  const canonical = `${SITE_URL}${path}`;
  const page: Record<string, unknown> = {
    '@type': 'CollectionPage',
    '@id': `${canonical}#page`,
    name,
    url: canonical,
    inLanguage,
    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': item.type || 'Thing',
          name: item.name,
          url: `${SITE_URL}${item.url}`,
        },
      })),
    },
  };
  if (description) page.description = description;

  const crumbs = [{ name: 'Home', path: HOME_PATH }];
  if (parent) crumbs.push(parent);
  crumbs.push({ name, path });

  return {
    '@context': 'https://schema.org',
    '@graph': [page, breadcrumbJsonLd(crumbs)],
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
