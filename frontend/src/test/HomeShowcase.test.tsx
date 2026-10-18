import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { I18nProvider } from '../context/I18nContext';
import { PlayerProvider } from '../context/PlayerContext';
import { HomeShowcase } from '../components/HomeShowcase';
import type { Song } from '../types';

const song = (id: number, title: string, titleNe: string, videoId: string): Song => ({
  id,
  title,
  title_ne: titleNe,
  romanized_title: title,
  artist: 1,
  artist_name: 'Test Artist',
  artist_name_ne: 'परीक्षण कलाकार',
  language: 'Nepali',
  mood_tags: ['tea-shop'],
  decade: '1980s',
  playback_provider: 'youtube',
  provider_video_id: videoId,
  attribution: 'Test',
  metadata_verification_status: 'verified',
  publication_status: 'published',
  play_count: 0,
  created_at: '2026-10-18T00:00:00Z',
});

const renderWall = (teaShopSongs?: Song[]) =>
  render(
    <I18nProvider>
      <PlayerProvider>
        <HomeShowcase
          stations={[]}
          trendingSongs={[]}
          newSongs={[]}
          featuredSongs={[]}
          teaShopSongs={teaShopSongs}
          onExploreCatalog={() => {}}
        />
      </PlayerProvider>
    </I18nProvider>
  );

describe('HomeShowcase tea-shop card', () => {
  it('lists the curated chiya-pasal queue in the tea-shop panel', () => {
    const playlist = [
      song(1, 'Gajalu Ti Thula Thula', 'गजलु ती ठूला ठूला', 'ftEzdVJWdDA'),
      song(2, 'Yo Samjhine Man Chha', 'यो सम्झिने मन छ', 'CAv5Ii8V5AU'),
      song(3, 'Malai Nasodha', 'मलाई नसोध', 'Pkj6YFJFI8U'),
    ];

    renderWall(playlist);

    playlist.forEach((entry) => {
      expect(screen.getAllByText(entry.title_ne!).length).toBeGreaterThan(0);
    });
    // The card's count chip must reflect the curated queue, not the empty
    // featured/trending/new pools.
    expect(screen.getAllByText('3 गीत').length).toBeGreaterThan(0);
  });

  it('falls back to the genre mix when the curated queue is unavailable', () => {
    const featured = [song(9, 'Fallback Classic', 'फलब्याक गीत', 'ftEzdVJWdDA')];

    render(
      <I18nProvider>
        <PlayerProvider>
          <HomeShowcase
            stations={[]}
            trendingSongs={[]}
            newSongs={[]}
            featuredSongs={[{ ...featured[0], is_featured: true, primary_genre_category: 'popular' }]}
            onExploreCatalog={() => {}}
          />
        </PlayerProvider>
      </I18nProvider>
    );

    expect(screen.getAllByText('फलब्याक गीत').length).toBeGreaterThan(0);
  });
});
