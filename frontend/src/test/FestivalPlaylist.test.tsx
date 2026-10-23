import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { I18nProvider } from '../context/I18nContext';
import { PlayerProvider, usePlayer } from '../context/PlayerContext';
import { FestiveSection } from '../components/FestiveSection';
import { FestivalPage } from '../pages/FestivalPage';
import type { FestivalCalendarEntry, FestivalSong } from '../types';

// Fixtures live inside the factory: vi.mock is hoisted above the module body,
// so it cannot close over top-level constants.
vi.mock('../services/api', () => {
  const song = (id: number, title: string): FestivalSong => ({
    id,
    title,
    title_ne: '',
    artist_name: 'Test Artist',
    mood_tags: [],
    play_count: 0,
    provider_video_id: `video${id}00`,
  });

  const playlists: Record<string, FestivalSong[]> = {
    dashain: [song(1, 'Dashain One'), song(2, 'Dashain Two'), song(3, 'Dashain Three')],
    tihar: [song(11, 'Tihar One'), song(12, 'Tihar Two')],
  };

  const calendarEntry = (slug: string, name: string): FestivalCalendarEntry => ({
    id: slug === 'dashain' ? 1 : 2,
    slug,
    name,
    name_ne: name,
    description: '',
    display_order: 0,
    is_active: true,
    song_count: playlists[slug].length,
    start_date: '2026-10-20',
    end_date: '2026-10-24',
    days_until_start: 0,
    days_until_end: 4,
    is_active_window: true,
    is_imminent: true,
    is_estimated: false,
  });

  return {
    api: {
      getFestivalCalendar: async () => [
        calendarEntry('dashain', 'Dashain'),
        calendarEntry('tihar', 'Tihar'),
      ],
      getFestivalCategories: async () => [
        calendarEntry('dashain', 'Dashain'),
        calendarEntry('tihar', 'Tihar'),
      ],
      getFestivalSongs: async (slug: string) => {
        const results = playlists[slug] ?? [];
        return { count: results.length, dedicated_count: results.length, results };
      },
    },
  };
});

function QueueProbe() {
  const { currentSong, queue } = usePlayer();
  return (
    <p data-testid="queue">
      {currentSong ? currentSong.id : 'none'}:{queue.map((item) => item.id).join(',')}
    </p>
  );
}

function renderWithPlayer(ui: React.ReactNode) {
  return render(
    <I18nProvider>
      <PlayerProvider>
        {ui}
        <QueueProbe />
      </PlayerProvider>
    </I18nProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('bajeko_chiya_pasal_locale', 'en');
});

describe('festival playback queue', () => {
  it('queues the rest of the selected festival when a row is tapped', async () => {
    renderWithPlayer(<FestiveSection />);

    const row = await screen.findByRole('button', { name: 'Dashain Two' });
    fireEvent.click(row);

    await waitFor(() => expect(screen.getByTestId('queue')).toHaveTextContent('2:3'));
  });

  it('starts the festival mix with only that festival’s songs queued', async () => {
    renderWithPlayer(<FestiveSection />);

    // The mix button is disabled until the playlist request resolves, so wait
    // for a row (the list is loaded) before pressing it.
    await screen.findByRole('button', { name: 'Dashain One' });
    fireEvent.click(screen.getByRole('button', { name: /Listen to the mix/i }));

    await waitFor(() => expect(screen.getByTestId('queue')).toHaveTextContent('1:2,3'));
  });

  it('switches to the newly chosen festival instead of the previous queue', async () => {
    renderWithPlayer(<FestiveSection />);

    fireEvent.click(await screen.findByRole('button', { name: 'Dashain Two' }));
    await waitFor(() => expect(screen.getByTestId('queue')).toHaveTextContent('2:3'));

    fireEvent.click(screen.getByRole('button', { name: /Tihar/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Tihar One' }));

    await waitFor(() => expect(screen.getByTestId('queue')).toHaveTextContent('11:12'));
  });

  it('queues the festival playlist from the festival page play button', async () => {
    renderWithPlayer(<FestivalPage slug="dashain" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Play song: Dashain Two' }));

    await waitFor(() => expect(screen.getByTestId('queue')).toHaveTextContent('2:3'));
  });
});
