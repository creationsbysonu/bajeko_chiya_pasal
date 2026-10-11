import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { I18nProvider } from '../context/I18nContext';
import { PlayerProvider } from '../context/PlayerContext';
import { Catalog } from '../pages/Catalog';

// Mock API calls
vi.mock('../services/api', () => ({
  api: {
    getGenres: vi.fn().mockResolvedValue([
      { id: 1, name: 'Nepali Lok Geet', name_ne: 'नेपाली लोक गीत', slug: 'nepali-lok-geet', category: 'folk', description: '', is_active: true }
    ]),
    getLanguages: vi.fn().mockResolvedValue([
      { language: 'Nepali', count: 1 },
      { language: 'Tamang', count: 1 },
      { language: 'Newari', count: 1 },
    ]),
    getSongs: vi.fn().mockResolvedValue({
      count: 1,
      results: [
        {
          id: 1,
          title: 'Chhekyo Chhekyo',
          title_ne: 'छेकेर छेकेन',
          romanized_title: 'Chhekyo Chhekyo',
          artist: 1,
          artist_name: 'Nepathya',
          artist_name_ne: 'नेपथ्य',
          language: 'Nepali',
          mood_tags: ['travel'],
          decade: '1990s',
          playback_provider: 'youtube',
          provider_video_id: 'ZJ7J_86j3_c',
          attribution: 'Nepathya Official',
          metadata_verification_status: 'verified',
          publication_status: 'published',
          play_count: 5,
          created_at: '2026-01-01T00:00:00Z',
        }
      ]
    }),
  }
}));

describe('Catalog Component', () => {
  it('renders search input and responds to queries', async () => {
    render(
      <I18nProvider>
        <PlayerProvider>
          <Catalog />
        </PlayerProvider>
      </I18nProvider>
    );

    const input = screen.getByPlaceholderText(/गीत, गायक, रचनाकार वा नेपाली युनिकोडमा खोज्नुहोस्.../i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Chhekyo' } });
    expect((input as HTMLInputElement).value).toBe('Chhekyo');
  });
});
