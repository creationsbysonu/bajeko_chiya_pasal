import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { I18nProvider } from '../context/I18nContext';
import { PlayerProvider } from '../context/PlayerContext';
import { RadioWorlds } from '../components/RadioWorlds';
import type { Station } from '../types';

const getStationDetail = vi.fn(async (slug: string) => ({
  slug,
  station_songs: [],
}));

vi.mock('../services/api', () => ({
  api: {
    getStationDetail: (slug: string) => getStationDetail(slug),
    logPlaybackEvent: vi.fn(),
  },
}));

const station = (id: number, slug: string, title: string, titleNe: string): Station => ({
  id,
  slug,
  title,
  title_ne: titleNe,
  tagline: `${title} tagline`,
  tagline_ne: `${titleNe} ट्यागलाइन`,
  description: '',
  description_ne: '',
  cover_image: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`,
  theme_color: '#B96B4A',
  ambient_type: 'teashop_rain',
  is_featured: true,
  is_active: true,
  display_order: id,
  songs_count: 3,
});

const STATIONS = [
  station(1, 'purano-radio', 'Purano Radio', 'पुरानो रेडियो'),
  station(2, 'chiya-pasal', 'Chiya Pasal', 'चिया पसल'),
  station(3, 'bus-yatra', 'Bus Yatra', 'बस यात्रा'),
];

const renderWorlds = () =>
  render(
    <I18nProvider>
      <PlayerProvider>
        <RadioWorlds stations={STATIONS} />
      </PlayerProvider>
    </I18nProvider>
  );

describe('Radio worlds wall', () => {
  beforeEach(() => {
    localStorage.setItem('bajeko_chiya_pasal_locale', 'en');
    getStationDetail.mockClear();
  });

  it('offers every radio world as a playable option', () => {
    renderWorlds();

    STATIONS.forEach((entry) => {
      expect(
        screen.getByRole('button', { name: new RegExp(entry.title) })
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Choose your vibe')).toBeInTheDocument();
  });

  it('marks Bajeko Chiya Pasal as the house default', () => {
    renderWorlds();
    expect(screen.getByText('House default')).toBeInTheDocument();
  });

  it('tunes the chosen vibe', async () => {
    renderWorlds();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Bus Yatra/ }));
    });
    expect(getStationDetail).toHaveBeenCalledWith('bus-yatra');
  });

  it('paints the tuned card with its own station colour', async () => {
    renderWorlds();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Bus Yatra/ }));
    });

    const tuned = screen.getByRole('button', { name: /Bus Yatra/ });
    expect(tuned).toHaveAttribute('aria-pressed', 'true');
    // glow uses the station's theme color from the catalog
    expect(tuned.getAttribute('style')).toContain('#B96B4A');
    expect(screen.getByText('TUNED')).toBeInTheDocument();
    // every card keeps its tagline visible for hover/readability
    STATIONS.forEach((entry) => {
      const card = screen.getByRole('button', { name: new RegExp(entry.title) });
      expect(card.getAttribute('title')).toContain(entry.title);
    });
  });

  it('keeps the photo cards legible in the day theme', () => {
    const { container } = renderWorlds();

    const cards = container.querySelectorAll('button[aria-pressed]');
    expect(cards).toHaveLength(STATIONS.length);
    cards.forEach((card) => {
      // photographic panels opt out of the day palette (white copy on a
      // dark scrim) and keep a literal dark surface under the photo
      expect(card.className).toContain('pd-dark-zone');
      expect(card.className).toContain('bg-black');
      expect(card.className).not.toContain('bg-white');
      // the boxes are sized so the photograph reads as the subject
      expect(card.className).toContain('min-h-[184px]');
    });
  });

  it('shows each world\u2019s cover art behind the words, and bright', () => {
    const { container } = renderWorlds();

    const covers = container.querySelectorAll('button[aria-pressed] img');
    expect(covers).toHaveLength(STATIONS.length);
    covers.forEach((cover) => {
      expect(cover).toHaveAttribute('alt', '');
      expect(cover).toHaveAttribute('aria-hidden', 'true');
      expect(cover.getAttribute('src')).toContain('images.unsplash.com');
      // covers are the subject of the box, not a dim backdrop
      expect(cover.className).toMatch(/opacity-70|opacity-85/);
    });
  });
});
