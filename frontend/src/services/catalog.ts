import { api } from './api';
import type { Artist, Song } from '../types';

/**
 * Entity pages need "all songs in this collection", while the RPC paginates at
 * 100 rows. These helpers walk the pages, stop on a short page, and de-duplicate
 * defensively so a page boundary bug cannot render the same song twice.
 */

function dedupe(songs: Song[]): Song[] {
  const seen = new Set<number>();
  return songs.filter((song) => {
    if (seen.has(song.id)) return false;
    seen.add(song.id);
    return true;
  });
}

export async function fetchAllSongs(
  params: { search?: string; genre?: string; decade?: string; language?: string; ordering?: string },
  maxPages = 20
): Promise<Song[]> {
  const collected: Song[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (page <= maxPages) {
    const result = await api.getSongs({ ...params, page, pageSize: 100 });
    collected.push(...result.results);
    total = result.count;
    if (!result.next || result.results.length === 0 || collected.length >= total) break;
    page += 1;
  }

  return dedupe(collected);
}

/**
 * Songs credited to one artist. `get_songs` can only search by text, so we search
 * the artist's name and then keep rows whose `artist` id matches — this avoids
 * pulling in a different artist whose name merely contains these words.
 */
export async function fetchArtistSongs(
  artist: Pick<Artist, 'id' | 'display_name'>
): Promise<Song[]> {
  const songs = await fetchAllSongs({ search: artist.display_name, ordering: '-release_year' });
  return songs.filter((song) => song.artist === artist.id);
}

/** Look up one artist from the public artist list (the RPC has no by-id form). */
export async function fetchArtist(id: number): Promise<Artist | null> {
  const artists = await api.getArtists();
  return artists.find((artist) => artist.id === id) ?? null;
}

/** Newest first, then alphabetical — stable and pleasant to scan. */
export function sortSongs(songs: Song[]): Song[] {
  return [...songs].sort((a, b) => {
    const yearA = a.release_year ?? 0;
    const yearB = b.release_year ?? 0;
    if (yearA !== yearB) return yearB - yearA;
    return a.title.localeCompare(b.title);
  });
}
