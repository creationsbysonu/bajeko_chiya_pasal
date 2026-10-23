import type { FestivalSong, Song } from '../types';
import { isPlayableVideoId } from './urlSafety';

/**
 * Festival songs come from a lighter RPC payload than catalog songs; widen them
 * to the `Song` shape the player expects (only playback-critical fields matter).
 */
export const toPlayableSong = (song: FestivalSong): Song => ({
  id: song.id,
  title: song.title,
  title_ne: song.title_ne,
  romanized_title: song.title,
  artist: 0,
  artist_name: song.artist_name,
  artist_name_ne: song.artist_name_ne,
  primary_genre_name: song.primary_genre_name,
  primary_genre_category: song.primary_genre_category,
  mood_tags: song.mood_tags ?? [],
  decade: '',
  duration_seconds: song.duration_seconds,
  artwork_url: song.artwork_url,
  playback_provider: song.playback_provider ?? 'youtube',
  provider_video_id: song.provider_video_id ?? '',
  provider_url: song.provider_url,
  language: '',
  attribution: '',
  metadata_verification_status: 'verified',
  publication_status: 'published',
  play_count: song.play_count ?? 0,
  release_year: song.release_year,
  created_at: '',
});

/** Playable festival tracks, in playlist order. */
export const playableFestivalSongs = (songs: FestivalSong[]): Song[] =>
  songs.filter((song) => isPlayableVideoId(song.provider_video_id)).map(toPlayableSong);

export interface FestivalPlayback {
  song: Song;
  /** The rest of *this* festival's playlist, in order. */
  queue: Song[];
}

/**
 * Build a festival-only playback request.
 *
 * Every way into a festival song (the mix button, a row tap, the festival page)
 * must pass this queue to `playSong`: without it the player keeps the previous
 * queue — usually the default station tuned at startup — and the festival
 * silently turns into that other playlist after the first track.
 *
 * Starts at `startSongId` when given (a tapped row), otherwise at the top of
 * the list. Returns null when the playlist has no playable track, or when the
 * requested song itself cannot be played.
 */
export function festivalPlayback(
  songs: FestivalSong[],
  startSongId?: number
): FestivalPlayback | null {
  const playable = playableFestivalSongs(songs);
  if (playable.length === 0) return null;

  const index = startSongId === undefined ? 0 : playable.findIndex((s) => s.id === startSongId);
  if (index < 0) return null;

  return { song: playable[index], queue: playable.slice(index + 1) };
}
