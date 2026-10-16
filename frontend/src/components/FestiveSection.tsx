import React, { useEffect, useMemo, useState } from 'react';
import { Reveal } from './motion/Reveal';
import { api } from '../services/api';
import { FestivalCategory, FestivalSong } from '../types';
import { useI18n } from '../context/I18nContext';
import { Play, Music } from 'lucide-react';

interface FestivalCardProps {
  festival: FestivalCategory;
  isActive: boolean;
  count: number;
  onSelect: (slug: string) => void;
}

const FestivalCard: React.FC<FestivalCardProps> = ({ festival, isActive, count, onSelect }) => {
  const { locale } = useI18n();
  return (
    <button
      onClick={() => onSelect(festival.slug)}
      className={`
        group relative flex flex-col items-start gap-2.5 p-5 rounded-2xl border
        transition-all duration-200 ease-out
        ${isActive
          ? 'border-red-500/60 bg-red-600/10 shadow-lg shadow-red-600/8 scale-[1.02]'
          : 'border-white/8 bg-white/3 hover:bg-white/6 hover:scale-[1.03]'
        }
        focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
      `}
      aria-pressed={isActive}
    >
      <div className={`flex items-center gap-2.5 text-2xl ${isActive ? 'text-red-500' : 'text-white/80 group-hover:text-white/90'}`}>
        <span className="text-xl">{festival.emoji}</span>
        <span className="font-serif text-lg font-black tracking-tight text-white truncate max-w-[140px]">
          {locale === 'ne' ? festival.name_ne : festival.name}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-white/40 font-nepali font-medium line-clamp-2">
        {locale === 'ne' ? festival.description : festival.description}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <Music className="w-3.5 h-3.5 text-red-500/70 group-hover:text-red-500/90 transition-colors" />
        <span className="text-[10px] font-mono text-white/40 tabular-nums">
          {count} tune{count !== 1 ? 's' : ''}
        </span>
      </div>
      <Play
        className={`absolute right-4 bottom-4 w-4 h-4 text-white/5 group-hover:text-white/30 transition-all ${isActive ? 'text-red-500/80' : ''}`}
        aria-hidden
      />
    </button>
  );
};

interface FestivalRowProps {
  songs: FestivalSong[];
  festivalName: string;
  festivalNameNe: string;
  locale: string;
}

const FestivalRow: React.FC<FestivalRowProps> = ({ songs, festivalName, festivalNameNe, locale }) => {
  return (
    <div className="pt-6 border-t border-white/8">
      <h3 className="font-serif text-xl font-black text-white mb-4">
        {locale === 'ne' ? festivalNameNe : festivalName}
      </h3>
      {songs.length === 0 ? (
        <div className="py-10 text-center text-white/30">
          <p>No festive songs found for this festival yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {songs.map((song) => (
            <div
              key={song.id}
              className="rounded-xl bg-white/3 border border-white/8 p-3 h-full group hover:bg-white/4 hover:border-white/12 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm transition-transform duration-200 group-hover:scale-110">
                  <Music className="w-4 h-4 text-red-500" />
                </div>
                <span className="font-serif text-xs font-bold text-white truncate flex-1">
                  {song.title_ne || song.title}
                </span>
              </div>
              <p className="text-[9px] text-white/30 font-mono font-bold leading-tight">
                {song.artist_name}
              </p>
              <p className="text-[9px] text-white/20 font-mono font-bold mt-0.5">
                {song.primary_genre_name ? `${song.primary_genre_name} · ${song.release_year ?? ''}` : 'Featured'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Compact song list inside a festival card for the Home page. */
interface FestivalNewListItemProps {
  song: FestivalSong;
}

const FestivalNewListItem: React.FC<FestivalNewListItemProps> = ({ song }) => {
  const { locale } = useI18n();
  return (
    <div className="rounded-xl bg-white/3 border border-white/8 p-3 h-full group hover:bg-white/4 hover:border-white/12 transition-all duration-200 cursor-pointer">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm transition-transform duration-200 group-hover:scale-110">
          <Music className="w-4 h-4 text-red-500" />
        </div>
        <span className="font-serif text-xs font-bold text-white truncate flex-1">
          {song.title_ne || song.title}
        </span>
      </div>
      <p className="text-[9px] text-white/30 font-mono font-bold leading-tight">
        {song.artist_name}
      </p>
      <p className="text-[9px] text-white/20 font-mono font-bold mt-0.5">
        {song.primary_genre_name ? `${song.primary_genre_name} · ${song.release_year ?? ''}` : 'Featured'}
      </p>
    </div>
  );
};


/** Interactive festival catalog section on the Home page */
export const FestiveSection: React.FC = () => {
  const { locale, t } = useI18n();
  const [categories, setCategories] = useState<FestivalCategory[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [songs, setSongs] = useState<FestivalSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getFestivalCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch songs for the selected festival
  useEffect(() => {
    if (!selectedSlug) {
      setSongs([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api.getFestivalSongs(selectedSlug, 18)
      .then((data) => {
        if (!cancelled) setSongs(data.results);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.slug === selectedSlug) ?? null,
    [categories, selectedSlug]
  );

  const handleSelect = (slug: string) => {
    setSelectedSlug((prev) => (prev === slug ? null : slug));
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      {/* Section header + intro */}
      <Reveal variant="up" className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mb-2">
          <span>🎉</span>
          <span>{t.festival.title}</span>
        </div>
        <h2 className="font-serif text-3xl font-black text-white">
          {locale === 'ne' ? t.festival.titleNe : t.festival.title}
        </h2>
        <p className="text-white/40 mt-3 max-w-xl mx-auto text-sm leading-relaxed font-nepali">
          {locale === 'ne'
            ? t.festival.subtitleNe
            : t.festival.subtitle}
        </p>
      </Reveal>

      {/* Festival chooser — horizontal scroll of category cards */}
      <Reveal variant="up" delay={60} className="flex gap-4 overflow-x-auto pb-4 px-1 py-4 -mx-4">
        {loading ? (
          <div className="flex gap-4 min-w-max">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-56 h-24 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-white/30">No festivals configured yet.</div>
        ) : (
          categories.map((cat) => (
            <FestivalCard
              key={cat.slug}
              festival={cat}
              isActive={selectedSlug === cat.slug}
              count={songs.length}
              onSelect={handleSelect}
            />
          ))
        )}
      </Reveal>

      {/* Songs row for the selected festival */}
      {!loading && selectedCategory && (
        <Reveal variant="up" delay={100} className="mt-8">
          <FestivalRow
            songs={songs}
            festivalName={selectedCategory.name}
            festivalNameNe={selectedCategory.name_ne}
            locale={locale}
          />
        </Reveal>
      )}

      {!loading && (selectedSlug === null || (songs.length === 0 && selectedCategory)) && (
        <div className="mt-8 text-center text-sm text-white/20">
          {t.festival.noSongs}
        </div>
      )}
    </section>
  );
};

export default FestiveSection;
