import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { I18nProvider } from '../context/I18nContext';
import { PlayerProvider, usePlayer } from '../context/PlayerContext';
import { Player } from '../components/Player';
import { Song, Station } from '../types';

const mockSong: Song = {
  id: 1,
  title: 'Kehi Mitho Baat Gara',
  title_ne: 'केही मीठो बात गर',
  romanized_title: 'Kehi Mitho Baat Gara',
  artist: 1,
  artist_name: 'Narayan Gopal',
  artist_name_ne: 'नारायण गोपाल',
  language: 'Nepali',
  mood_tags: ['nostalgic'],
  decade: '1980s',
  playback_provider: 'youtube',
  provider_video_id: '8Gq51d6aN5c',
  attribution: 'Music Nepal Official Archives',
  metadata_verification_status: 'verified',
  publication_status: 'published',
  play_count: 10,
  created_at: '2026-01-01T00:00:00Z',
};

const mockStation: Station = {
  id: 1,
  slug: 'purano-radio',
  title: 'Purano Radio',
  title_ne: 'पुरानो रेडियो',
  tagline: 'Classic golden era melodies',
  tagline_ne: 'रेडियो नेपालका कालजयी धुन',
  description: 'Golden era songs',
  description_ne: 'सुनौलो कालखण्डका धुन',
  cover_image: '',
  theme_color: '#C7A66A',
  ambient_type: 'vintage_crackle',
  is_featured: true,
  is_active: true,
  display_order: 0,
};

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <PlayerProvider>
        {children}
      </PlayerProvider>
    </I18nProvider>
  );
}

function PlayerTestComponent() {
  const { playSong } = usePlayer();
  return (
    <div>
      <button onClick={() => playSong(mockSong, mockStation)}>Load Track</button>
      <Player />
    </div>
  );
}

describe('Player Component', () => {
  it('mounts and displays track information in authentic Devanagari by default', async () => {
    render(
      <TestWrapper>
        <PlayerTestComponent />
      </TestWrapper>
    );

    const loadBtn = screen.getByText('Load Track');
    fireEvent.click(loadBtn);

    // Should display song in Devanagari Unicode
    expect(screen.getByText('केही मीठो बात गर')).toBeInTheDocument();
    expect(screen.getByText('नारायण गोपाल')).toBeInTheDocument();
  });

  it('provides accessible play/pause controls', async () => {
    render(
      <TestWrapper>
        <PlayerTestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Load Track'));
    // By default in Nepali, title or aria-label contains बजाउनुहोस् (Play)
    const playBtn = screen.getByTitle('बजाउनुहोस्');
    expect(playBtn).toBeInTheDocument();
  });
});
