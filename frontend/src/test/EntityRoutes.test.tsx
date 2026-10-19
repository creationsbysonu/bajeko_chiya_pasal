import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';
import {
  isUnknownPath,
  parseRoute,
  pathToTab,
  routeTab,
} from '../utils/seo';
import {
  SITE_URL,
  genresSeo,
  artistPath,
  artistSeo,
  decadePath,
  decadeSeo,
  festivalPath,
  festivalSeo,
  genrePath,
  genreSeo,
  songJsonLd,
  songPath,
  songSeo,
  stationPath,
  stationSeo,
} from '../utils/pageMeta';
import type { Artist, FestivalCategory, Genre, Song, Station } from '../types';

const song: Song = {
  id: 123,
  title: 'Euta Manche Ko Mayale',
  title_ne: 'एउटा मान्छे को मायाले',
  romanized_title: 'Euta Manche Ko Mayale',
  artist: 11,
  artist_name: 'Narayan Gopal',
  artist_name_ne: 'नारायण गोपाल',
  composer: 'Narayan Gopal',
  lyricist: 'Kali Prasad Rijal',
  album: 'Classic Nepali Hits',
  film_or_source: '',
  release_year: 1970,
  language: 'Nepali',
  primary_genre: 3,
  primary_genre_name: 'Classic Pop',
  primary_genre_name_ne: 'क्लासिक पप',
  primary_genre_category: 'popular',
  secondary_genres: [],
  mood_tags: ['nostalgic'],
  decade: '1970s',
  duration_seconds: 245,
  artwork_url: 'https://img.youtube.com/vi/abcdefghijk/hqdefault.jpg',
  playback_provider: 'youtube',
  provider_video_id: 'abcdefghijk',
  provider_url: 'https://www.youtube.com/watch?v=abcdefghijk',
  attribution: 'Official YouTube embed',
  metadata_verification_status: 'verified',
  publication_status: 'published',
  play_count: 1200,
  created_at: '2026-10-01T00:00:00.000Z',
};

const artist: Artist = {
  id: 11,
  display_name: 'Narayan Gopal',
  display_name_ne: 'नारायण गोपाल',
  biography: 'The voice of Nepal.',
  profile_image: '',
  verification_status: 'verified',
  songs_count: 42,
  created_at: '2026-10-01T00:00:00.000Z',
};

const station: Station = {
  id: 2,
  slug: 'chiya-pasal',
  title: 'Chiya Pasal',
  title_ne: 'चिया पसल',
  tagline: 'Tea shop mornings',
  tagline_ne: 'चिया पसलको बिहान',
  description: 'Nepali classics for a slow morning.',
  description_ne: 'बिहानको चिया सँगै नेपाली क्लासिक।',
  cover_image: '',
  theme_color: '#B96B4A',
  ambient_type: 'teashop_rain',
  is_featured: true,
  is_active: true,
  display_order: 1,
  songs_count: 34,
};

const genre: Genre = {
  id: 3,
  name: 'Classic Pop',
  name_ne: 'क्लासिक पप',
  slug: 'classic-pop',
  category: 'popular',
  description: 'Golden-era Nepali pop.',
  is_active: true,
  songs_count: 20,
};

const festival: FestivalCategory = {
  id: 1,
  slug: 'dashain',
  name: 'Dashain',
  name_ne: 'दशैं',
  description: 'Festival songs for Dashain.',
  display_order: 1,
  is_active: true,
};

const mocks = vi.hoisted(() => ({
  getSongDetail: vi.fn(async () => song),
}));

vi.mock('../services/api', () => ({
  api: {
    getStations: async () => [station],
    getFeatured: async () => ({ stations: [], songs: [] }),
    getGenres: async () => [genre],
    getDecades: async () => [{ decade: '1970s', count: 1 }],
    getGenreCategories: async () => [],
    getSongs: async () => ({ count: 0, next: null, previous: null, results: [] }),
    getSongDetail: mocks.getSongDetail,
    getStationDetail: async () => ({ ...station, station_songs: [] }),
    getArtists: async () => [artist],
    getFestivalCategories: async () => [festival],
    getFestivalCalendar: async () => [
      {
        ...festival,
        song_count: 1,
        start_date: '2026-10-20',
        end_date: '2026-10-24',
        days_until_start: 1,
        days_until_end: 5,
        is_active_window: true,
        is_imminent: true,
        is_estimated: false,
      },
    ],
    getFestivalSongs: async () => ({ count: 0, dedicated_count: 0, results: [] }),
    getRecentSongRequests: async () => [],
    getFavorites: async () => [],
    logPlaybackEvent: async () => {},
  },
}));

vi.mock('../services/catalog', () => ({
  fetchAllSongs: async () => [song],
  fetchArtistSongs: async () => [song],
  fetchArtist: async () => artist,
  sortSongs: (songs: Song[]) => songs,
}));

describe('entity route parsing', () => {
  it('maps every crawlable entity path', () => {
    expect(parseRoute('/')).toEqual({ name: 'home' });
    expect(parseRoute('/genres')).toEqual({ name: 'genres' });
    expect(parseRoute('/artists')).toEqual({ name: 'artists' });
    expect(parseRoute('/decades')).toEqual({ name: 'decades' });
    expect(parseRoute('/festivals')).toEqual({ name: 'festivals' });
    expect(parseRoute('/stations/chiya-pasal')).toEqual({ name: 'station', slug: 'chiya-pasal' });
    expect(parseRoute('/songs/123/euta-manche-ko-mayale')).toEqual({ name: 'song', id: 123 });
    expect(parseRoute('/songs/123')).toEqual({ name: 'song', id: 123 });
    expect(parseRoute('/artists/11/narayan-gopal')).toEqual({ name: 'artist', id: 11 });
    expect(parseRoute('/genres/lok-dohori')).toEqual({ name: 'genre', slug: 'lok-dohori' });
    expect(parseRoute('/decades/1980s')).toEqual({ name: 'decade', decade: '1980s' });
    expect(parseRoute('/festivals/dashain')).toEqual({ name: 'festival', slug: 'dashain' });
  });

  it('rejects paths the app does not own so they collapse to home', () => {
    expect(parseRoute('/nope/at/all/here')).toBeNull();
    expect(parseRoute('/songs/not-a-number/x')).toBeNull();
    expect(isUnknownPath('/totally-made-up')).toBe(true);
    expect(isUnknownPath('/songs/123/euta-manche-ko-mayale')).toBe(false);
  });

  it('keeps navigation highlighting sensible on entity pages', () => {
    expect(pathToTab('/songs/123/euta-manche-ko-mayale')).toBe('catalog');
    expect(routeTab({ name: 'station', slug: 'chiya-pasal' })).toBe('stations');
    expect(routeTab({ name: 'genres' })).toBe('catalog');
    expect(routeTab({ name: 'artists' })).toBe('catalog');
    expect(pathToTab('/festivals')).toBe('catalog');
  });
});

describe('entity URLs and metadata', () => {
  it('builds stable, keyword-bearing URLs', () => {
    expect(songPath(song)).toBe('/songs/123/euta-manche-ko-mayale');
    expect(artistPath(artist)).toBe('/artists/11/narayan-gopal');
    expect(stationPath(station)).toBe('/stations/chiya-pasal');
    expect(genrePath(genre)).toBe('/genres/classic-pop');
    expect(decadePath('1980s')).toBe('/decades/1980s');
    expect(festivalPath(festival)).toBe('/festivals/dashain');
  });

  it('gives every entity a unique title, description and canonical', () => {
    const metas = [
      songSeo(song, 'ne'),
      artistSeo(artist, 'ne'),
      stationSeo(station, 'ne'),
      genreSeo(genre, 20, 'ne'),
      decadeSeo('1970s', 21, 'ne'),
      festivalSeo(festival, 12, 'ne'),
    ];

    for (const meta of metas) {
      expect(meta.title.length).toBeGreaterThan(10);
      expect(meta.description.length).toBeGreaterThan(40);
      expect(meta.canonical.startsWith(SITE_URL)).toBe(true);
      expect(meta.robots).toContain('index');
    }

    expect(new Set(metas.map((meta) => meta.canonical)).size).toBe(metas.length);
    expect(songSeo(song, 'ne').canonical).toBe(`${SITE_URL}/songs/123/euta-manche-ko-mayale`);
    expect(songSeo(song, 'ne').ogImage).toBe(song.artwork_url);
  });

  it('emits MusicRecording + VideoObject structured data for a song', () => {
    const data = songJsonLd(song, 'ne') as { '@graph': Record<string, unknown>[] };
    const recording = data['@graph'][0];

    expect(recording['@type']).toBe('MusicRecording');
    expect(recording.name).toBe(song.title);
    expect(recording.url).toBe(`${SITE_URL}${songPath(song)}`);
    expect(recording.duration).toBe('PT4M5S');
    expect((recording.video as Record<string, unknown>).embedUrl).toContain(
      'youtube.com/embed/abcdefghijk'
    );
  });
});

describe('other entity routes', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bajeko_chiya_pasal_locale', 'ne');
    document.title = '';
  });

  it.each([
    ['/stations/chiya-pasal', 'चिया पसल'],
    ['/artists/11/narayan-gopal', 'नारायण गोपाल'],
    ['/genres/classic-pop', 'क्लासिक पप'],
    ['/decades/1970s', '1970s'],
    ['/festivals/dashain', 'दशैं'],
    ['/artists', 'कलाकार'],
    ['/festivals', 'चाडपर्व'],
    ['/decades', 'दशक'],
  ])('renders %s without crashing', async (path, expected) => {
    window.history.replaceState(null, '', path);
    render(<App />);
    await waitFor(() =>
      expect(document.querySelector('h1')?.textContent).toContain(expected)
    );
  });
});

describe('genre hub route', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bajeko_chiya_pasal_locale', 'ne');
    window.history.replaceState(null, '', '/genres');
    document.title = '';
  });

  it('keeps its own metadata instead of the generic catalog fallback', async () => {
    render(<App />);

    await waitFor(() => expect(document.title).toBe(genresSeo('ne').title));
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE_URL}/genres`
    );
    expect(document.querySelector('h1')?.textContent).toContain('विधा');
  });
});

describe('song page route', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bajeko_chiya_pasal_locale', 'ne');
    window.history.replaceState(null, '', '/songs/123/euta-manche-ko-mayale');
    document.title = '';
    mocks.getSongDetail.mockClear();
  });

  it('renders the song, upgrades the head tags and emits JSON-LD', async () => {
    render(<App />);

    await waitFor(() =>
      expect(document.querySelector('h1')?.textContent).toContain(song.title)
    );

    expect(mocks.getSongDetail).toHaveBeenCalledWith(123);
    expect(document.title).toBe(songSeo(song, 'ne').title);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE_URL}${songPath(song)}`
    );
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      songSeo(song, 'ne').description
    );

    const jsonLd = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    ).map((node) => node.textContent ?? '');
    expect(jsonLd.some((text) => text.includes('"MusicRecording"'))).toBe(true);
  });
});
