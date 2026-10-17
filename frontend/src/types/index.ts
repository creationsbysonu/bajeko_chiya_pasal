export interface Artist {
  id: number;
  display_name: string;
  display_name_ne: string;
  biography: string;
  biography_ne?: string;
  profile_image: string;
  verification_status: 'unverified' | 'verified' | 'official';
  songs_count?: number;
  created_at: string;
}

export interface GenreCategory {
  id: number;
  slug: string;
  name: string;
  name_ne: string;
  description: string;
  display_order: number;
  is_active: boolean;
  genres_count: number;
  songs_count: number;
  created_at: string;
}

export interface Genre {
  id: number;
  name: string;
  name_ne: string;
  slug: string;
  category: string;
  description: string;
  is_active: boolean;
  songs_count?: number;
}

export interface Song {
  id: number;
  title: string;
  title_ne: string;
  romanized_title: string;
  artist: number;
  artist_name: string;
  artist_name_ne?: string;
  featured_artists?: string;
  composer?: string;
  lyricist?: string;
  album?: string;
  film_or_source?: string;
  release_year?: number;
  language: string;
  primary_genre?: number;
  primary_genre_name?: string;
  primary_genre_name_ne?: string;
  primary_genre_category?: string;
  secondary_genres?: number[];
  secondary_genre_names?: string[];
  mood_tags: string[];
  decade: string;
  duration_seconds?: number;
  artwork_url?: string;
  playback_provider: string;
  provider_video_id: string;
  provider_url?: string;
  source_url?: string;
  attribution: string;
  metadata_verification_status: 'verified' | 'community_submitted' | 'demo';
  publication_status: 'published' | 'draft' | 'disputed' | 'taken_down';
  play_count: number;
  is_featured?: boolean;
  featured_order?: number;
  created_at: string;
}

export interface StationSong {
  id: number;
  position: number;
  song: Song;
}

export interface Station {
  id: number;
  slug: string;
  title: string;
  title_ne: string;
  tagline: string;
  tagline_ne: string;
  description: string;
  description_ne: string;
  cover_image: string;
  theme_color: string;
  ambient_type: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  songs_count?: number;
  station_songs?: StationSong[];
}

export interface FavoriteItem {
  id: number;
  session_key: string;
  song: Song;
  created_at: string;
}

export type PlaybackStatus = 'unstarted' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';
export type RepeatMode = 'off' | 'one' | 'all';

export interface AdminStats {
  total_songs: number;
  published_songs: number;
  verified_songs: number;
  pending_takedowns: number;
  total_artists: number;
  total_stations: number;
  total_genres?: number;
  total_genre_categories?: number;
  status_breakdown?: Record<string, number>;
  language_breakdown?: Record<string, number>;
  category_breakdown?: Record<string, number>;
  takedown_breakdown?: Record<string, number>;
}

export interface TakedownTicket {
  id: number;
  song: number;
  song_title: string;
  artist_name: string;
  claimant_name: string;
  claimant_email: string;
  reason: string;
  details: string;
  status: string;
  resolution_notes: string;
  created_at: string;
  resolved_at?: string | null;
}

export interface TakedownListResponse {
  count: number;
  results: TakedownTicket[];
  available_statuses: string[];
}

export interface StationQueueItem {
  position: number;
  song_id: number;
  title: string;
  title_ne: string;
  artist_name: string | null;
  publication_status: string;
  artwork_url: string;
}

export interface AdminInsights {
  window_days: number;
  total_events: number;
  event_breakdown: Record<string, number>;
  starts: number;
  completes: number;
  skips: number;
  errors: number;
  completion_rate: number;
  unique_sessions: number;
  total_favorites: number;
  top_songs: { song_id: number; title: string; artist_name: string | null; events: number }[];
  most_played: { song_id: number; title: string; artist_name: string | null; play_count: number }[];
  most_favorited: { song_id: number; title: string; artist_name: string | null; favorites: number }[];
  top_stations: { station_id: number; title: string; events: number }[];
  error_events: { id: number; song_id: number | null; song_title: string | null; message: string; timestamp: string }[];
}


export interface AuditLogItem {
  id: number;
  actor_username: string;
  action: string;
  target_model: string;
  target_id: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface FestivalCategory {
  id: number;
  slug: string;
  name: string;
  name_ne: string;
  description: string;
  display_order: number;
  is_active: boolean;
  mood_tags?: string[];
}

export interface FestivalSong {
  id: number;
  title: string;
  title_ne: string;
  artist_name: string;
  artist_name_ne?: string;
  primary_genre_name?: string;
  primary_genre_category?: string;
  mood_tags: string[];
  release_year?: number;
  duration_seconds?: number;
  artwork_url?: string;
  play_count: number;
  is_featured?: boolean;
  featured_order?: number;
  playback_provider?: string;
  provider_video_id?: string;
  provider_url?: string;
  /** Where the song came from: dedicated to the festival, vibe-matched, or a trending festive track. */
  source?: 'festival' | 'vibe' | 'trending';
}

export interface Festival {
  festival: FestivalCategory;
  songs: FestivalSong[];
}

/** A festival plus its next occurrence window, for the calendar-aware section. */
export interface FestivalCalendarEntry extends FestivalCategory {
  song_count: number;
  start_date: string;
  end_date: string;
  /** Days from today until the festival starts (negative once it is underway). */
  days_until_start: number;
  /** Days from today until the festival ends. */
  days_until_end: number;
  is_active_window: boolean;
  /** Starts within 20 days — the "get in the mood" window. */
  is_imminent: boolean;
  /** True when the date was rolled forward a year because next year's gazette is not seeded yet. */
  is_estimated: boolean;
}

export interface FestivalPlaylist {
  count: number;
  dedicated_count: number;
  results: FestivalSong[];
}

export interface SongRequestSummary {
  id: number;
  title: string;
  artist: string;
  festival_name?: string | null;
  festival_name_ne?: string | null;
  festival_slug?: string | null;
  status: string;
  created_at: string;
}

export interface SongRequestTicket {
  id: number;
  title: string;
  artist: string;
  youtube_url: string;
  festival?: number | null;
  festival_name?: string | null;
  festival_slug?: string | null;
  genre?: number | null;
  note: string;
  requester_name: string;
  requester_email: string;
  status: string;
  admin_notes: string;
  created_at: string;
  resolved_at?: string | null;
}

export interface SongRequestListResponse {
  count: number;
  results: SongRequestTicket[];
  available_statuses: string[];
}

export interface AuthPermissionSet {
  can_manage_catalog: boolean;
  can_review_takedowns: boolean;
  can_view_audit_logs: boolean;
  can_change_password: boolean;
}

export interface AuthUser {
  authenticated: boolean;
  username?: string;
  full_name?: string;
  email?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  date_joined?: string;
  last_login?: string | null;
  permissions?: AuthPermissionSet;
}
