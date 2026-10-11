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
