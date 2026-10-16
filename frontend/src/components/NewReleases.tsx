import React from 'react';
import { Song } from '../types';
import { SongCard } from './SongCard';
import { useI18n } from '../context/I18nContext';
import { Sparkles } from 'lucide-react';

interface NewReleasesProps {
  songs: Song[];
  onViewAll?: () => void;
}

/**
 * Full-width "New Releases" grid section. Complements the slim top rail
 * (NewReleasesHighlight) with a standard catalog grid, sitting below the Hero
 * ("Purano Dhun, Timeless Memories").
 */
export const NewReleases: React.FC<NewReleasesProps> = ({ songs, onViewAll }) => {
  const { locale } = useI18n();

  if (!songs.length) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>{locale === 'ne' ? 'नयाँ अपलोड' : 'NEW RELEASES'}</span>
          </div>
          <h2 className="font-serif text-3xl font-black text-white drop-shadow-sm">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </section>
  );
};

export default NewReleases;
