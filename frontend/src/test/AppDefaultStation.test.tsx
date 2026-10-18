import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';
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
    getStations: async () => [
      station(1, 'purano-radio', 'Purano Radio'),
      station(2, 'chiya-pasal', 'Chiya Pasal'),
    ],
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

describe('App default station', () => {
  beforeEach(() => {
    localStorage.setItem('bajeko_chiya_pasal_locale', 'en');
    mocks.getStationDetail.mockClear();
  });

  it('tunes into Bajeko Chiya Pasal on first load', async () => {
    render(<App />);

    await waitFor(() =>
      expect(mocks.getStationDetail).toHaveBeenCalledWith('chiya-pasal')
    );
  });
});
