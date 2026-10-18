import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import App from '../App';
import { ROUTES, SITE_URL, pathToTab, isUnknownPath, tabToPath, RouteTab } from '../utils/seo';
import type { Station } from '../types';

const mocks = vi.hoisted(() => ({
  getStationDetail: vi.fn(async (slug: string) => ({ slug, station_songs: [] })),
}));

const station = (id: number, slug: string, title: string): Station => ({
  id,
  slug,
  title,
  title_ne: title,
  tagline: '',
  tagline_ne: '',
  description: '',
  description_ne: '',
  cover_image: '',
  theme_color: '#B96B4A',
  ambient_type: 'teashop_rain',
  is_featured: true,
  is_active: true,
  display_order: id,
  songs_count: 0,
});

vi.mock('../services/api', () => ({
  api: {
    getStations: async () => [station(1, 'purano-radio', 'Purano Radio'), station(2, 'chiya-pasal', 'Chiya Pasal')],
    getFeatured: async () => ({ stations: [], songs: [] }),
    getGenres: async () => [],
    getDecades: async () => [],
    getGenreCategories: async () => [],
    getSongs: async () => ({ count: 0, next: null, previous: null, results: [] }),
    getStationDetail: mocks.getStationDetail,
    getRecentSongRequests: async () => [],
    getFestivalCategories: async () => [],
    getFestivalCalendar: async () => [],
    getFestivalSongs: async () => ({ count: 0, dedicated_count: 0, results: [] }),
    getFavorites: async () => [],
    logPlaybackEvent: async () => {},
  },
}));

const clickNav = (href: string) => {
  const link = document.querySelector<HTMLAnchorElement>(`a[href="${href}"]`);
  expect(link).not.toBeNull();
  fireEvent.click(link as HTMLAnchorElement);
};

describe('route helpers', () => {
  it('maps known paths to their tab, tolerating trailing slashes', () => {
    expect(pathToTab('/')).toBe('home');
    expect(pathToTab('/catalog/')).toBe('catalog');
    expect(pathToTab('/stations')).toBe('stations');
    expect(pathToTab('/favorites')).toBe('favorites');
  });

  it('falls back to home and flags unknown paths', () => {
    expect(pathToTab('/totally-made-up')).toBe('home');
    expect(isUnknownPath('/totally-made-up')).toBe(true);
    expect(isUnknownPath('/catalog')).toBe(false);
    expect(tabToPath('catalog')).toBe('/catalog');
  });

  it('publishes every indexable route in the sitemap and hides favorites', () => {
    const sitemap = readFileSync(resolve(process.cwd(), 'public/sitemap.xml'), 'utf8');
    const robots = readFileSync(resolve(process.cwd(), 'public/robots.txt'), 'utf8');

    const indexable: RouteTab[] = ['home', 'stations', 'catalog'];
    for (const tab of indexable) {
      expect(sitemap).toContain(SITE_URL + ROUTES[tab].path);
    }
    // Personal screen: never offered to crawlers by either signal.
    expect(sitemap).not.toContain(ROUTES.favorites.path);
    expect(robots).toContain('Disallow: /favorites');
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });
});

describe('crawlable routes', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bajeko_chiya_pasal_locale', 'ne');
    window.history.replaceState(null, '', '/');
    document.title = '';
  });

  it('reaches the catalog through a real link and points its canonical there', async () => {
    render(<App />);

    clickNav('/catalog');

    await waitFor(() => expect(window.location.pathname).toBe('/catalog'));
    expect(document.title).toBe(ROUTES.catalog.title.ne);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE_URL}/catalog`
    );
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      ROUTES.catalog.description.ne
    );
  });

  it('noindexes the personal favorites screen', async () => {
    render(<App />);

    clickNav('/favorites');

    await waitFor(() => expect(window.location.pathname).toBe('/favorites'));
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain(
      'noindex'
    );
  });

  it('follows back/forward navigation via popstate', async () => {
    render(<App />);

    clickNav('/stations');
    await waitFor(() => expect(document.title).toBe(ROUTES.stations.title.ne));

    // Browser back: the URL changes first, then popstate fires.
    window.history.replaceState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));

    await waitFor(() => expect(document.title).toBe(ROUTES.home.title.ne));
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE_URL}/`
    );
  });
});
