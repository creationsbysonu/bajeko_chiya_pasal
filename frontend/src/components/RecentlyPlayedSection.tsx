import React, { useState, useEffect } from 'react';
import { Song } from '../types';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Music, History, Clock } from 'lucide-react';
import { Reveal } from './motion/Reveal';

const RECENTLY_PLAYED_KEY = 'bajeko_chiya_pasal_recently_played';
const MAX_RECENT_SONGS = 20;

/** Load recently played songs from localStorage */
const loadRecentlyPlayed = (): Song[] => {
  try {
    const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/** Save a song to recently played (most recent first, deduplicated) */
const saveToRecentlyPlayed = (song: Song): void => {
  try {
    const recent = loadRecentlyPlayed();
    const filtered = recent.filter((s) => s.id !== song.id);
    const updated = [song, ...filtered].slice(0, MAX_RECENT_SONGS);
    localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
  } catch {
    // localStorage might be full or unavailable
  }
};

/** Compact song row for recently played list */
const RecentSongRow: React.FC<{ song: Song }> = ({ song }) => {
  const { locale } = useI18n();
  const { currentSong, status, playSong, togglePlayPause } = usePlayer();
  const ne = locale === 'ne';
  const isCurrent = currentSong?.id === song.id;
  const isPlaying = isCurrent && status === 'playing';

  const thumbnail = song.artwork_url || (song.provider_video_id ? `https://img.youtube.com/vi/${song.provider_video_id}/hqdefault.jpg` : null);

  const handlePlay = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playSong(song);
    }
  };

  return (
    <button
      onClick={handlePlay}
      className={`group w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${
        isCurrent
          ? 'border-red-500/50 bg-red-600/10'
          : 'border-white/5 hover:border-white/15 hover:bg-white/5'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={song.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600">
            <Music className="w-5 h-5" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </div>
      </div>

      {/* Song info */}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-red-400' : 'text-white'}`}>
          {ne ? song.title_ne || song.title : song.title}
        </p>
        <p className="text-xs text-neutral-500 truncate">
          {ne ? song.artist_name_ne || song.artist_name : song.artist_name}
        </p>
      </div>

      {/* Duration */}
      {song.duration_seconds && (
        <span className="text-xs text-neutral-500 font-mono flex-shrink-0">
          {Math.floor(song.duration_seconds / 60)}:{(song.duration_seconds % 60).toString().padStart(2, '0')}
        </span>
      )}
    </button>
  );
};

export const RecentlyPlayedSection: React.FC = () => {
  const { locale } = useI18n();
  const ne = locale === 'ne';
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const { currentSong } = usePlayer();

  // Load recently played on mount
  useEffect(() => {
    setRecentlyPlayed(loadRecentlyPlayed());
  }, []);

  // Save current song to recently played when it changes
  useEffect(() => {
    if (currentSong) {
      saveToRecentlyPlayed(currentSong);
      setRecentlyPlayed(loadRecentlyPlayed());
    }
  }, [currentSong]);

  // Don't render if no history
  if (recentlyPlayed.length === 0) {
    return null;
  }

  return (
    <Reveal variant="up">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center">
              <History className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-black text-cream-100">
                {ne ? 'हाल सुनेका गीतहरू' : 'Recently Played'}
              </h2>
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {ne ? 'तपाईंको श्रवण इतिहास' : 'Your listening history'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-neutral-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            {recentlyPlayed.length} {ne ? 'गीत' : 'tracks'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {recentlyPlayed.slice(0, 8).map((song) => (
            <RecentSongRow key={song.id} song={song} />
          ))}
        </div>

        {recentlyPlayed.length > 8 && (
          <p className="text-center text-xs text-neutral-500 pt-2">
            + {recentlyPlayed.length - 8} {ne ? 'अरू गीतहरू' : 'more tracks'}
          </p>
        )}
      </section>
    </Reveal>
  );
};