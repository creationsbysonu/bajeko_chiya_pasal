import React from 'react';
import { Song } from '../types';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { Reveal } from './motion/Reveal';
import { Play, Pause, Flame, TrendingUp, Music } from 'lucide-react';

interface TrendingSongsProps {
  songs: Song[];
}

const formatCount = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(value);
};

/**
 * Ranked chart of the most-played songs. Each row plays the song directly and
 * highlights the current track, mirroring the rest of the player surfaces.
 */
export const TrendingSongs: React.FC<TrendingSongsProps> = ({ songs }) => {
  const { locale } = useI18n();
  const { currentSong, status, playSong, togglePlayPause } = usePlayer();

  if (!songs.length) return null;

  return (
    <section className="mt-10">
      <Reveal variant="up">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>CURRENTLY TRENDING</span>
            </div>
            <h2 className="font-serif text-3xl font-black text-white drop-shadow-sm">
              {locale === 'ne' ? 'हाल लोकप्रिय धुनहरू' : 'Currently Trending'}
            </h2>
            <p className="text-xs text-neutral-500 font-nepali mt-1">
              {locale === 'ne'
                ? 'अहिले पुरानो धुनमा सबैभन्दा धेरै सुनिएका गीतहरू'
                : 'What the Purano Dhun community is playing right now'}
            </p>
          </div>
          <TrendingUp className="hidden sm:block w-8 h-8 text-red-500/40 flex-shrink-0" />
        </div>
      </Reveal>

      <Reveal variant="up" delay={80}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {songs.map((song, index) => {
            const isCurrent = currentSong?.id === song.id;
            const isPlaying = isCurrent && status === 'playing';
            const thumbnail =
              song.artwork_url ||
              (song.provider_video_id
                ? `https://img.youtube.com/vi/${song.provider_video_id}/mqdefault.jpg`
                : null);

            return (
              <button
                key={song.id}
                onClick={() => (isCurrent ? togglePlayPause() : playSong(song))}
                className={`group w-full text-left flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 ease-out hover:-translate-y-0.5 ${
                  isCurrent
                    ? 'border-red-500 bg-red-600/10 shadow-glow-red'
                    : 'border-white/10 bg-black/60 backdrop-blur-md hover:border-white/25 hover:bg-white/[0.03]'
                }`}
              >
                {/* Rank */}
                <span
                  className={`w-7 text-center font-serif text-lg font-black tabular-nums flex-shrink-0 ${
                    index < 3 ? 'text-red-500' : 'text-neutral-600'
                  }`}
                >
                  {index + 1}
                </span>

                {/* Artwork + hover play affordance */}
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-800 pd-dark-zone">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={song.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                      <Music className="w-5 h-5" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-white text-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
                    )}
                  </div>
                </div>

                {/* Title / artist */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition-colors duration-150">
                    {locale === 'ne' ? song.title_ne || song.title : song.title}
                  </h4>
                  <p className="text-xs text-neutral-500 font-nepali truncate mt-0.5">
                    {locale === 'ne' ? song.artist_name_ne || song.artist_name : song.artist_name}
                  </p>
                </div>

                {/* Play count */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-mono font-bold text-red-400 tabular-nums">
                    {formatCount(song.play_count)}
                  </p>
                  <p className="text-[11px] font-mono text-neutral-600 uppercase tracking-wider mt-0.5">
                    {locale === 'ne' ? 'प्ले' : 'plays'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
};

export default TrendingSongs;
