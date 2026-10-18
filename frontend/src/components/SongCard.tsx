import React, { useEffect, useRef, useState } from 'react';
import { Song } from '../types';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Heart, ShieldCheck, Calendar, Music } from 'lucide-react';
import { api } from '../services/api';
import { songArtwork, hideBrokenImage } from '../utils/urlSafety';

interface SongCardProps {
  song: Song;
  isFavorited?: boolean;
  onFavoriteChange?: (songId: number, isFav: boolean) => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isFavorited = false,
  onFavoriteChange,
}) => {
  const { locale } = useI18n();
  const { currentSong, status, playSong, togglePlayPause } = usePlayer();
  const [favorited, setFavorited] = useState(isFavorited);
  const [favLoading, setFavLoading] = useState(false);
  const [favError, setFavError] = useState(false);
  const favErrorTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(favErrorTimer.current), []);

  const isCurrent = currentSong?.id === song.id;
  const isPlaying = isCurrent && status === 'playing';

  // Validated: rejects unsafe schemes in artwork_url and implausible ids.
  const thumbnail = songArtwork(song);

  const handlePlayClick = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playSong(song);
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);

    // Optimistic flip so the heart responds instantly, rolled back on failure.
    // Without the visible error the tap did nothing at all when the RPC
    // refused (offline, anonymous sign-in disabled, expired session) — the
    // listener had no way to know it never saved.
    const next = !favorited;
    setFavorited(next);
    setFavError(false);
    try {
      if (next) {
        await api.addFavorite(song.id);
        onFavoriteChange?.(song.id, true);
      } else {
        await api.removeFavorite(song.id);
        onFavoriteChange?.(song.id, false);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
      setFavorited(!next);
      setFavError(true);
      window.clearTimeout(favErrorTimer.current);
      favErrorTimer.current = window.setTimeout(() => setFavError(false), 4000);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div
      className={`group relative rounded-2xl bg-black/60 backdrop-blur-md border overflow-hidden transition-all duration-300 ease-out flex flex-col justify-between hover:-translate-y-1 ${
        isCurrent
          ? 'border-red-500 shadow-glow-red ring-1 ring-red-500 bg-black/80'
          : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
      }`}
    >
      <div>
        {/* 1. Real Music Video Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden bg-black/90 pd-dark-zone">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={song.title}
              loading="lazy"
              onError={hideBrokenImage}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.9] group-hover:brightness-100"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500">
              <Music className="w-8 h-8" />
            </div>
          )}

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />

          {/* Top Left: Badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
            {song.metadata_verification_status === 'verified' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/70 text-red-400 border border-red-500/40 text-[11px] font-bold font-mono backdrop-blur-md">
                <ShieldCheck className="w-3 h-3 text-red-400" />
                <span>Verified</span>
              </span>
            )}
            {song.primary_genre_name && (
              <span className="px-2.5 py-0.5 rounded-full bg-black/70 text-neutral-400 border border-white/10 text-[11px] font-nepali font-semibold backdrop-blur-md">
                {locale === 'ne' && song.primary_genre_name_ne ? song.primary_genre_name_ne : song.primary_genre_name}
              </span>
            )}
          </div>

          {/* Top Right: Favorite Button */}
          <button
            onClick={handleFavoriteToggle}
            className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md border transition-all duration-300 ease-out hover:scale-110 active:scale-95 z-10 ${
              favorited
                ? 'bg-red-600/30 border-red-500 text-red-500'
                : 'bg-black/60 border-white/10 text-white/60 hover:text-red-500 hover:border-red-500/40'
            }`}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
          {favError && (
            <p
              role="alert"
              className="absolute top-11 right-2 z-20 whitespace-nowrap rounded-lg border border-red-500/40 bg-black/95 px-2 py-1 text-[10px] font-medium text-red-200 shadow-lg"
            >
              सेभ गर्न सकिएन · Could not save
            </p>
          )}

          {/* Center Play Button Overlay on Hover or Playing */}
          <button
            onClick={handlePlayClick}
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              isPlaying ? 'opacity-100 bg-black/40' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 bg-black/30'
            }`}
            aria-label={isPlaying ? 'Pause song' : 'Play song'}
          >
            <div className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-glow-red hover:scale-110 active:scale-95 transition-all duration-200">
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white translate-x-0.5" />
              )}
            </div>
          </button>
        </div>

        {/* 2. Metadata Section */}
        <div className="p-4">
          <h4 className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors duration-150 line-clamp-1">
            {locale === 'ne' ? song.title_ne || song.title : song.title}
          </h4>
          <p className="text-xs text-neutral-500 font-nepali line-clamp-1 mt-0.5">
            {locale === 'ne' ? song.title : song.title_ne}
          </p>

          <p className="text-xs text-white/70 font-medium font-nepali mt-2 line-clamp-1">
            {locale === 'ne' ? song.artist_name_ne || song.artist_name : song.artist_name}
          </p>

          {song.featured_artists && (
            <p className="text-xs text-neutral-500 font-nepali truncate mt-0.5" title={`ft. ${song.featured_artists}`}>
              ft. {song.featured_artists}
            </p>
          )}

          <div className="flex items-center gap-2.5 text-xs text-white/50 font-mono mt-3">
            {song.release_year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5 text-neutral-500" />
                <span>{song.release_year}</span>
              </span>
            )}
            {song.decade && (
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-500 font-bold">
                {song.decade}
              </span>
            )}
            {song.film_or_source && (
              <span className="truncate max-w-[110px]">
                {song.film_or_source}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Card Footer */}
      <div className="px-4 pb-3.5 pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-white/40 truncate max-w-[130px] font-mono" title={song.attribution}>
          {song.attribution || 'Official Public Audio'}
        </span>

        <button
          onClick={handlePlayClick}
          className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${
            isPlaying
              ? 'bg-red-600 text-white shadow-glow-red border border-red-400 font-bold'
              : 'bg-white/5 hover:bg-red-600 text-white/80 hover:text-white border border-white/10 hover:border-red-500'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3 fill-current" />
              <span>Playing</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>Play</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
