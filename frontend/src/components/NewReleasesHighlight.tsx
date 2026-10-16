import React from 'react';
import { Song } from '../types';
import { SongCard } from './SongCard';
import { useI18n } from '../context/I18nContext';
import { Reveal } from './motion/Reveal';
import { Sparkles } from 'lucide-react';

interface NewReleasesHighlightProps {
  songs: Song[];
  onViewAll?: () => void;
}

/**
 * Slim, full-width band that sits directly below the navigation bar and
 * surfaces the most recently uploaded songs in a horizontally scrollable rail.
 */
export const NewReleasesHighlight: React.FC<NewReleasesHighlightProps> = ({ songs, onViewAll }) => {
  const { locale } = useI18n();

  if (!songs.length) return null;

  return (
    <section className="relative overflow-hidden border-b border-white/5">
      {/* Ambient crimson / amber glow that echoes the hero lighting */}
      <div className="absolute -top-24 left-1/4 w-[460px] h-[220px] bg-red-600/12 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[320px] h-[180px] bg-amber-500/6 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Reveal variant="up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold uppercase tracking-[0.25em] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {locale === 'ne' ? 'नयाँ अपलोड' : 'Freshly Uploaded'}
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-black text-white drop-shadow-sm flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-red-500" />
                {locale === 'ne' ? 'नयाँ गीतहरू' : 'New Releases'}
              </h2>
              <p className="text-xs text-neutral-500 font-nepali mt-1">
                {locale === 'ne'
                  ? 'भर्खरै थपिएका ताजा धुनहरू — सबैभन्दा पहिले तपाईंको लागि'
                  : 'The latest additions to the Purano Dhun archive, fresh off the shelf'}
              </p>
            </div>

            {onViewAll && (
              <button
                onClick={onViewAll}
                className="text-xs font-bold text-red-400 hover:text-red-300 underline font-mono flex items-center gap-1.5 flex-shrink-0"
              >
                <span>{locale === 'ne' ? 'सबै हेर्नुहोस्' : 'View All'}</span>
                <span>→</span>
              </button>
            )}
          </div>
        </Reveal>

        <Reveal variant="up" delay={80}>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
            {songs.map((song) => (
              <div key={song.id} className="flex flex-shrink-0 w-[240px] sm:w-[264px] snap-start [&>div]:w-full">
                <SongCard song={song} />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default NewReleasesHighlight;
