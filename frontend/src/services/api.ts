import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  Artist, Genre, GenreCategory, Song, Station, FavoriteItem,
  AdminStats, AdminInsights, TakedownTicket, TakedownListResponse, StationQueueItem, AuditLogItem, AuthUser,
  FestivalCategory, FestivalCalendarEntry, FestivalPlaylist,
  SongRequestSummary, SongRequestListResponse
} from '../types';

// Supabase is both the database and the backend: every read/write goes through
// SECURITY DEFINER RPCs (see supabase/migrations) that reproduce the response
// shapes of the old Django REST API, so this module keeps the exact same
// interface the rest of the app consumes.
const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || 'local-anon-key';

// A build deployed without the env vars silently targets localhost, so every
// request fails with a generic "Request failed" and nothing explains why.
// Fail loudly in the console instead (the UI shows its own load-error state).
if (import.meta.env.PROD && !import.meta.env.VITE_SUPABASE_URL) {
  console.error(
    '[bajeko-chiya-pasal] VITE_SUPABASE_URL is not set in this build — ' +
      'falling back to http://127.0.0.1:54321, so every request will fail.'
  );
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Listener identity: anonymous Supabase Auth sessions replace the old
// X-Session-Key header. Favorites and playback telemetry bind to auth.uid().
let sessionPromise: Promise<void> | null = null;

export async function ensureListenerSession(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return;

  if (!sessionPromise) {
    sessionPromise = supabase.auth
      .signInAnonymously()
      .then(() => undefined)
      .catch(() => undefined) // anonymous sign-ins may be disabled; catalog still works
      .finally(() => {
        sessionPromise = null;
      });
  }
  return sessionPromise;
}

// Supabase `raise exception` messages arrive on PostgrestError.message; pass
// them through so the admin UI keeps showing the exact server-side wording.
function rpcError(error: { message?: string } | null): Error {
  return new Error(error?.message || 'Request failed');
}

async function rpc<T>(
  fn: string,
  args: Record<string, unknown> = {},
  opts: { listener?: boolean } = {},
): Promise<T> {
  if (opts.listener) {
    await ensureListenerSession();
  }
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw rpcError(error);
  return data as T;
}

// Drop undefined/empty args so RPC parameters keep their declared defaults.
// Note `'all'` is intentionally NOT treated as a sentinel here: a listener can
// legitimately search for the word "all", and discarding it silently returned
// unfiltered results while the UI still showed the query. Dropdown "All"
// options are normalised at the call site instead (see `unlessAll`).
function args(map: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  Object.entries(map).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      out[key] = value;
    }
  });
  return out;
}

/** Turns a filter dropdown's "All" option into "no filter". */
function unlessAll(value: string | undefined | null): string | undefined {
  return value && value !== 'all' ? value : undefined;
}

export const api = {
  // Stations
  async getStations(): Promise<Station[]> {
    return rpc<Station[]>('get_stations', args({}));
  },

  async getStationDetail(slug: string): Promise<Station> {
    try {
      return await rpc<Station>('get_station_detail', { p_slug: slug });
    } catch {
      throw new Error(`Failed to fetch station: ${slug}`);
    }
  },

  // Songs Catalog & Search
  async getSongs(params: {
    search?: string;
    genre?: string;
    decade?: string;
    language?: string;
    verification?: string;
    ordering?: string;
    page?: number;
  } = {}): Promise<{ count: number; next: string | null; previous: string | null; results: Song[] }> {
    try {
      return await rpc('get_songs', args({
        p_search: params.search,
        p_genre: params.genre,
        p_decade: params.decade,
        p_language: params.language,
        p_verification: params.verification,
        p_ordering: params.ordering,
        p_page: params.page,
      }));
    } catch {
      throw new Error('Failed to fetch catalog songs');
    }
  },

  async getSongDetail(id: number): Promise<Song> {
    try {
      return await rpc<Song>('get_song_detail', { p_id: id });
    } catch {
      throw new Error('Failed to fetch song details');
    }
  },

  // Metadata taxonomies
  async getGenres(): Promise<Genre[]> {
    try {
      return await rpc<Genre[]>('get_genres');
    } catch {
      throw new Error('Failed to fetch genres');
    }
  },

  async getGenreCategories(): Promise<GenreCategory[]> {
    try {
      return await rpc<GenreCategory[]>('get_genre_categories');
    } catch {
      throw new Error('Failed to fetch genre categories');
    }
  },

  async getArtists(): Promise<Artist[]> {
    try {
      return await rpc<Artist[]>('get_artists', args({ p_search: undefined }));
    } catch {
      throw new Error('Failed to fetch artists');
    }
  },

  async getDecades(): Promise<{ decade: string; count: number }[]> {
    try {
      return await rpc('get_decades');
    } catch {
      throw new Error('Failed to fetch decades');
    }
  },

  async getLanguages(): Promise<{ language: string; count: number }[]> {
    try {
      return await rpc('get_languages');
    } catch {
      throw new Error('Failed to fetch languages');
    }
  },

  async getFeatured(): Promise<{ stations: Station[]; songs: Song[] }> {
    try {
      return await rpc('get_featured');
    } catch {
      throw new Error('Failed to fetch featured content');
    }
  },

  // Favorites
  async getFavorites(): Promise<FavoriteItem[]> {
    // Rethrow so the page can tell "the listener has no favorites" apart from
    // "this failed" — returning [] for both rendered an offline user as simply
    // having an empty list, with no retry offered.
    return rpc<FavoriteItem[]>('get_favorites', args({}), { listener: true });
  },

  async addFavorite(songId: number): Promise<FavoriteItem> {
    try {
      return await rpc<FavoriteItem>('add_favorite', { p_song_id: songId }, { listener: true });
    } catch {
      throw new Error('Failed to save favorite');
    }
  },

  async removeFavorite(songId: number): Promise<void> {
    try {
      await rpc('remove_favorite', { p_song_id: songId }, { listener: true });
    } catch {
      throw new Error('Failed to remove favorite');
    }
  },

  // Playback Event Logging
  async logPlaybackEvent(event: {
    event_type: 'start' | 'complete' | 'skip' | 'error';
    song?: number;
    station?: number;
    error_message?: string;
  }): Promise<void> {
    try {
      await rpc('log_playback_event', args({
        p_event_type: event.event_type,
        p_song_id: event.song,
        p_station_id: event.station,
        p_error_message: event.error_message,
      }), { listener: true });
    } catch {
      // Non-blocking telemetry
    }
  },

  // Takedown / Copyright notice
  async submitTakedown(data: {
    song: number;
    claimant_name: string;
    claimant_email: string;
    reason: string;
    details: string;
  }): Promise<{ message: string; ticket_id: number }> {
    try {
      return await rpc('submit_takedown', {
        p_song: data.song,
        p_claimant_name: data.claimant_name,
        p_claimant_email: data.claimant_email,
        p_reason: data.reason,
        p_details: data.details,
      }, { listener: true });
    } catch (error) {
      // The server-side rate limit is worth surfacing verbatim so a genuine
      // reporter knows why they were refused; schema/validation failures keep
      // the generic wording the tests and UI expect.
      const message = error instanceof Error ? error.message : '';
      if (message.includes('Too many reports')) throw new Error(message);
      throw new Error('Failed to submit notice');
    }
  },

  // Song recommendations ("Recommend a song")
  async submitSongRequest(data: {
    title: string;
    artist?: string;
    youtube_url?: string;
    festival_slug?: string;
    genre_id?: number;
    note?: string;
    requester_name: string;
    requester_email?: string;
  }): Promise<{ message: string; request_id: number }> {
    try {
      return await rpc('submit_song_request', {
        p_title: data.title,
        p_artist: data.artist ?? '',
        p_youtube_url: data.youtube_url ?? '',
        p_festival_slug: data.festival_slug ?? '',
        p_genre_id: data.genre_id ?? null,
        p_note: data.note ?? '',
        p_requester_name: data.requester_name,
        p_requester_email: data.requester_email ?? '',
      }, { listener: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('Too many suggestions')) throw new Error(message);
      if (message.includes(': ')) throw new Error(message);
      throw new Error('Failed to submit suggestion');
    }
  },

  async getRecentSongRequests(limit = 6): Promise<SongRequestSummary[]> {
    try {
      return await rpc('get_song_requests_recent', { p_limit: limit });
    } catch {
      return [];
    }
  },

  async getAdminSongRequests(params: { status?: string; search?: string } = {}): Promise<SongRequestListResponse> {
    try {
      return await rpc('admin_song_requests', {
        ...args({ p_status: unlessAll(params.status), p_search: params.search }),
      });
    } catch {
      throw new Error('Failed to load suggestions');
    }
  },

  async handleSongRequestAction(id: number, status: string, notes: string): Promise<{ id: number; status: string; admin_notes: string }> {
    try {
      return await rpc('admin_song_request_action', { p_id: id, p_status: status, p_admin_notes: notes });
    } catch {
      throw new Error('Failed to update suggestion');
    }
  },

  // Admin APIs
  async getAdminStats(): Promise<AdminStats> {
    try {
      return await rpc<AdminStats>('admin_stats');
    } catch {
      throw new Error('Admin authentication required');
    }
  },

  async getAdminInsights(days = 30): Promise<AdminInsights> {
    try {
      return await rpc<AdminInsights>('admin_insights', { p_days: days });
    } catch {
      throw new Error('Failed to load insights');
    }
  },

  async getAdminTakedowns(params: { status?: string; reason?: string; search?: string } = {}): Promise<TakedownListResponse> {
    try {
      return await rpc<TakedownListResponse>('admin_takedowns', args({
        p_status: unlessAll(params.status),
        p_reason: unlessAll(params.reason),
        p_search: params.search,
      }));
    } catch {
      throw new Error('Admin access required');
    }
  },

  async handleTakedownAction(id: number, status: string, notes: string): Promise<TakedownTicket> {
    try {
      return await rpc<TakedownTicket>('admin_takedown_action', {
        p_id: id,
        p_status: status,
        p_resolution_notes: notes,
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to apply moderation action');
    }
  },

  async getAdminAuditLogs(): Promise<AuditLogItem[]> {
    try {
      return await rpc<AuditLogItem[]>('admin_audit_logs');
    } catch {
      throw new Error('Admin access required');
    }
  },

  async getAdminSongs(params: {
    search?: string;
    status?: string;
    genre?: string;
    category?: string;
    artist?: string;
    language?: string;
    decade?: string;
    verification?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<{ count: number; page: number; page_size: number; results: Song[] }> {
    try {
      return await rpc('admin_songs', args({
        p_search: params.search,
        p_status: unlessAll(params.status),
        p_genre: params.genre,
        p_category: unlessAll(params.category),
        p_artist: params.artist,
        p_language: unlessAll(params.language),
        p_decade: params.decade,
        p_verification: params.verification,
        p_ordering: params.ordering,
        p_page: params.page,
        p_page_size: params.page_size,
      }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch admin songs');
    }
  },

  // Bulk song operations: delete, move genre/category, set status/language/decade,
  // assign artist, station add/remove, play-count reset. Supports preview mode.
  async bulkAdminSongs(payload: {
    action: string;
    ids?: number[];
    filter?: Record<string, string | number>;
    preview?: boolean;
    value?: string | number;
    genre_id?: number;
    artist_id?: number;
    station_id?: number;
    source_category?: string;
    target_category?: string;
    mapping?: Record<string, number>;
  }): Promise<{ affected: number; preview?: boolean; [key: string]: unknown }> {
    try {
      return await rpc('admin_songs_bulk', { p_payload: payload });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Bulk action failed');
    }
  },

  // Genre management
  async getAdminGenres(): Promise<Genre[]> {
    try {
      return await rpc<Genre[]>('admin_genres');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch genres');
    }
  },

  async createAdminGenre(data: {
    name: string;
    name_ne?: string;
    category: string;
    description?: string;
    is_active?: boolean;
  }): Promise<Genre> {
    try {
      return await rpc<Genre>('admin_genre_create', { p_data: data });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create genre');
    }
  },

  async updateAdminGenre(id: number, data: Record<string, unknown>): Promise<Genre> {
    try {
      return await rpc<Genre>('admin_genre_update', { p_id: id, p_data: data });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update genre');
    }
  },

  async deleteAdminGenre(id: number, reassignTo?: number): Promise<{ message: string }> {
    try {
      return await rpc('admin_genre_delete', { p_id: id, p_reassign_to: reassignTo ?? null });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete genre');
    }
  },

  async updateAdminArtist(id: number, data: Record<string, unknown>): Promise<Artist> {
    try {
      return await rpc<Artist>('admin_artist_update', { p_id: id, p_data: data });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update artist');
    }
  },

  async deleteAdminArtist(id: number, reassignTo?: number): Promise<{ message: string }> {
    try {
      return await rpc('admin_artist_delete', { p_id: id, p_reassign_to: reassignTo ?? null });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete artist');
    }
  },

  async createAdminSong(data: Record<string, unknown>): Promise<Song> {
    try {
      return await rpc<Song>('admin_song_create', { p_data: data });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create song');
    }
  },

  async updateAdminSong(id: number, data: Record<string, unknown>): Promise<Song> {
    try {
      return await rpc<Song>('admin_song_update', { p_id: id, p_data: data });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update song');
    }
  },

  async deleteAdminSong(id: number): Promise<void> {
    try {
      await rpc('admin_song_unpublish', { p_id: id });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to unpublish song');
    }
  },

  async getAdminArtists(): Promise<Artist[]> {
    try {
      return await rpc<Artist[]>('admin_artists');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch artists');
    }
  },

  async createAdminArtist(data: Record<string, unknown>): Promise<Artist> {
    try {
      return await rpc<Artist>('admin_artist_create', { p_data: data });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create artist');
    }
  },

  async getAdminStations(): Promise<Station[]> {
    try {
      return await rpc<Station[]>('admin_stations');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch stations');
    }
  },

  async updateAdminStation(id: number, data: Record<string, unknown>): Promise<Station> {
    try {
      return await rpc<Station>('admin_station_update', { p_id: id, p_data: data });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update station');
    }
  },

  async createAdminStation(data: Record<string, unknown>): Promise<Station> {
    try {
      return await rpc<Station>('admin_station_create', { p_data: data });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create station');
    }
  },

  async deleteAdminStation(id: number): Promise<{ message: string; station_links_removed: number }> {
    try {
      return await rpc('admin_station_delete', { p_id: id });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete station');
    }
  },

  // ---- Genre categories (dynamic registry) ----

  async getAdminGenreCategories(): Promise<GenreCategory[]> {
    try {
      return await rpc<GenreCategory[]>('admin_genre_categories');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch genre categories');
    }
  },

  async createAdminGenreCategory(data: {
    name: string;
    name_ne?: string;
    description?: string;
    display_order?: number;
    is_active?: boolean;
  }): Promise<GenreCategory> {
    try {
      return await rpc<GenreCategory>('admin_genre_category_create', { p_data: data });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create category');
    }
  },

  async updateAdminGenreCategory(id: number, data: Partial<GenreCategory>): Promise<GenreCategory> {
    try {
      return await rpc<GenreCategory>('admin_genre_category_update', { p_id: id, p_data: data });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update category');
    }
  },

  async deleteAdminGenreCategory(id: number, reassignTo?: string): Promise<{ message: string; genres_moved: number; available_targets?: string[] }> {
    try {
      return await rpc('admin_genre_category_delete', args({
        p_id: id,
        p_reassign_to: reassignTo,
      }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  },

  async reorderAdminGenreCategories(order: { id: number; display_order: number }[]): Promise<{ message: string }> {
    try {
      return await rpc('admin_genre_categories_reorder', { p_order: order });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to reorder categories');
    }
  },

  // ---- Station song queue ----

  async getStationQueue(stationId: number): Promise<{ station_id: number; station_title: string; count: number; queue: StationQueueItem[] }> {
    try {
      return await rpc('admin_station_queue_get', { p_station_id: stationId });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch station queue');
    }
  },

  async addToStationQueue(stationId: number, songIds: number[]): Promise<{ message: string; added: number[]; skipped: number[] }> {
    try {
      return await rpc('admin_station_queue_add', { p_station_id: stationId, p_song_ids: songIds });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add songs to station');
    }
  },

  async reorderStationQueue(stationId: number, order: number[]): Promise<{ message: string }> {
    try {
      return await rpc('admin_station_queue_reorder', { p_station_id: stationId, p_order: order });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to reorder station queue');
    }
  },

  async removeFromStationQueue(stationId: number, songId: number): Promise<{ message: string }> {
    try {
      return await rpc('admin_station_queue_remove', { p_station_id: stationId, p_song_id: songId });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to remove song from station');
    }
  },

  // -----------------------------------------------------------------------
  // Festival catalog
  // -----------------------------------------------------------------------
  async getFestivalCategories(): Promise<FestivalCategory[]> {
    return rpc<FestivalCategory[]>('get_festival_categories', args({}));
  },

  async getFestivalCalendar(): Promise<FestivalCalendarEntry[]> {
    return rpc<FestivalCalendarEntry[]>('get_festival_calendar', args({}));
  },

  async getFestivalSongs(slug: string, limit = 24): Promise<FestivalPlaylist> {
    return rpc<FestivalPlaylist>('get_festival_songs', args({ p_festival_slug: slug, p_limit: limit }));
  },

  // Auth (Supabase Auth; admins are the public.admins allowlist)

  async login(email: string, password: string): Promise<AuthUser> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message || 'Invalid credentials');
    }

    const user = await this.getCurrentUser();
    if (!user.authenticated) {
      await supabase.auth.signOut();
      throw new Error('Admin access requires a staff account.');
    }
    return user;
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getCurrentUser(): Promise<AuthUser> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { authenticated: false };

    const { data, error } = await supabase.rpc('admin_current_user');
    if (error || !data?.authenticated) return { authenticated: false };
    return data as AuthUser;
  },

  async changeAdminPassword(data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ message: string; user: AuthUser }> {
    if (data.new_password !== data.confirm_password) {
      throw new Error('New password confirmation does not match');
    }
    if (data.new_password.length < 10) {
      throw new Error('Password does not meet security requirements: too short (min 10 characters).');
    }

    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email;
    if (!email) {
      throw new Error('Admin authentication required');
    }

    // Supabase cannot verify the current password during updateUser, so
    // re-authenticate with it first.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: data.current_password,
    });
    if (reauthError) {
      throw new Error('Current password is incorrect');
    }

    const { error } = await supabase.auth.updateUser({ password: data.new_password });
    if (error) {
      throw new Error(error.message || 'Failed to change password');
    }

    return {
      message: 'Password updated successfully',
      user: await this.getCurrentUser(),
    };
  },
};
