import React, { useState, useEffect } from 'react';
import { Song, Station } from '../types';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import {
  Play,
  Pause,
  Flame,
  Star,
  Music,
  Coffee,
  CalendarDays,
  ArrowRight,
  ChevronDown,
  History,
} from 'lucide-react';
import { FestiveSection } from './FestiveSection';
import { FESTIVAL_IMAGES } from '../utils/festivalImagery';

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

interface HomeShowcaseProps {
  stations: Station[];
  trendingSongs: Song[];
  newSongs: Song[];
  featuredSongs: Song[];
  onExploreCatalog: () => void;
}

const FALLBACK =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=80';

const formatCount = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(value);
};

const artworkFor = (song?: Song): string | null => {
  if (!song) return null;
  return (
    song.artwork_url ||
    (song.provider_video_id ? `https://img.youtube.com/vi/${song.provider_video_id}/hqdefault.jpg` : null)
  );
};

/** Compact, playable song row used inside an opened panel. */
const SongRow: React.FC<{ song: Song; rank?: number; showYear?: boolean }> = ({ song, rank, showYear }) => {
  const { locale } = useI18n();
  const { currentSong, status, playSong, togglePlayPause } = usePlayer();
  const ne = locale === 'ne';
  const isCurrent = currentSong?.id === song.id;
  const isPlaying = isCurrent && status === 'playing';
  const thumb = artworkFor(song);

  const handlePlay = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isCurrent) togglePlayPause();
    else playSong(song);
  };

  return (
    <button
      onClick={handlePlay}
      className={`group/row w-full text-left flex items-center gap-3 p-2.5 rounded-xl border transition-colors duration-200 ${
        isCurrent
          ? 'border-red-500/70 bg-red-600/15'
          : 'border-transparent hover:border-white/10 hover:bg-white/5'
      }`}
    >
      {rank !== undefined && (
        <span
          className={`w-6 text-center font-serif text-base font-black tabular-nums flex-shrink-0 ${
            rank <= 3 ? 'text-red-400' : 'text-neutral-500'
          }`}
        >
          {rank}
        </span>
      )}

      <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
        {thumb ? (
          <img src={thumb} alt={song.title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500">
            <Music className="w-4 h-4" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-white text-white" />
          ) : (
            <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-white truncate group-hover/row:text-red-300 transition-colors duration-150">
          {ne ? song.title_ne || song.title : song.title}
        </p>
        <p className="text-xs text-neutral-400 font-nepali truncate">
          {ne ? song.artist_name_ne || song.artist_name : song.artist_name}
        </p>
      </div>

      <span className="text-[11px] font-mono text-neutral-400 tabular-nums flex-shrink-0">
        {showYear ? song.release_year : formatCount(song.play_count)}
      </span>
    </button>
  );
};

interface Panel {
  key: string;
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  caption: string;
  countLabel: string;
  image: string;
  accentText: string;
  accentBg: string;
  glow: string;
  content: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

/**
 * Five home surfaces (The Tea Shop, Festival Calendar, Trending, New Releases,
 * Featured) laid out as a wall of windows. Hovering / focusing / tapping a
 * panel grows it open with a smooth eased transition and reveals its contents;
 * leaving collapses it back to the original state.
 *
 * Colours stay inside the app palette — crimson, gold and cream — and the
 * whole wall lives in a `pd-dark-zone` so the white copy stays legible on the
 * photographic backdrops in both the day and night themes.
 */
export const HomeShowcase: React.FC<HomeShowcaseProps> = ({
  stations,
  trendingSongs,
  newSongs,
  featuredSongs,
  onExploreCatalog,
}) => {
  const { locale, t } = useI18n();
  const ne = locale === 'ne';
  const [active, setActive] = useState<number | null>(null);
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

  // Tea shop songs - curated mix of classic, romantic, and nostalgic songs
  // These are timeless melodies perfect for a tea shop atmosphere
  const teaShopSongs = [
    ...featuredSongs.filter((s) =>
      ['popular', 'folk'].includes(s.primary_genre_category || '')
    ),
    ...trendingSongs.filter((s) =>
      ['popular', 'folk'].includes(s.primary_genre_category || '')
    ),
    ...newSongs.filter((s) =>
      ['popular', 'folk'].includes(s.primary_genre_category || '')
    ),
  ]
    .filter((song, index, self) => self.findIndex((s) => s.id === song.id) === index)
    .sort((a, b) => {
      // Prioritize featured songs
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      // Then by play count
      return (b.play_count || 0) - (a.play_count || 0);
    })
    .slice(0, 20);

  const panels: Panel[] = [
    {
      key: 'shop',
      icon: Coffee,
      eyebrow: ne ? 'चिया पसल' : 'THE TEA SHOP',
      title: ne ? 'बजेको चिया पसल' : 'Bajeko Chiya Pasal',
      caption: ne ? 'आजको विशेष चिया र चिया मेनु' : "Today's special and the tea menu",
      countLabel: `${teaShopSongs.length} ${ne ? 'गीत' : 'songs'}`,
      image: stations.find((s) => s.slug === 'chiya-pasal')?.cover_image || FALLBACK,
      accentText: 'text-red-400',
      accentBg: 'bg-red-600',
      glow: 'from-red-600/45',
      content: (
        <div className="space-y-1.5">
          {teaShopSongs.slice(0, 10).map((song) => (
            <SongRow key={song.id} song={song} />
          ))}
        </div>
      ),
    },
    {
      key: 'festival',
      icon: CalendarDays,
      eyebrow: ne ? 'चाडपर्व पात्रो' : 'FESTIVAL CALENDAR',
      title: ne ? t.festival.titleNe : t.festival.title,
      caption: ne ? 'आउँदो चाडका लागि मौसमी धुन' : 'Seasonal tunes for the festival ahead',
      countLabel: ne ? 'चाडपर्व' : 'Festivals',
      image: FESTIVAL_IMAGES.dashain?.url || FALLBACK,
      accentText: 'text-amber-300',
      accentBg: 'bg-amber-400',
      glow: 'from-amber-400/35',
      content: <FestiveSection embedded />,
    },
    {
      key: 'trending',
      icon: Flame,
      eyebrow: ne ? 'प्रत्यक्ष चार्ट' : 'LIVE CHART',
      title: ne ? 'हाल लोकप्रिय धुनहरू' : 'Currently Trending',
      caption: ne ? 'अहिले समुदायले सबैभन्दा धेरै सुनिरहेका गीत' : 'What the community is playing right now',
      countLabel: ne ? `${trendingSongs.length} गीत` : `${trendingSongs.length} tracks`,
      image: artworkFor(trendingSongs[0]) || FALLBACK,
      accentText: 'text-red-400',
      accentBg: 'bg-red-600',
      glow: 'from-red-600/45',
      content: (
        <div className="space-y-1">
          {trendingSongs.map((song, i) => (
            <SongRow key={song.id} song={song} rank={i + 1} />
          ))}
        </div>
      ),
      action: { label: ne ? 'सबै हेर्नुहोस्' : 'View all', onClick: onExploreCatalog },
    },
    {
      key: 'new',
      icon: Music,
      eyebrow: ne ? 'नयाँ आगमन' : 'FRESH ARRIVALS',
      title: ne ? 'नयाँ रिलिजहरू' : 'New Releases',
      caption: ne ? 'भर्खरै राखिएका ताजा धुनहरू' : 'The latest recordings added to the archive',
      countLabel: ne ? `${newSongs.length} गीत` : `${newSongs.length} tracks`,
      image: artworkFor(newSongs[0]) || FALLBACK,
      accentText: 'text-amber-400',
      accentBg: 'bg-amber-500',
      glow: 'from-amber-500/40',
      content: (
        <div className="space-y-1">
          {newSongs.map((song) => (
            <SongRow key={song.id} song={song} showYear />
          ))}
        </div>
      ),
      action: { label: ne ? 'सबै हेर्नुहोस्' : 'View all', onClick: onExploreCatalog },
    },
    {
      key: 'featured',
      icon: Star,
      eyebrow: ne ? 'क्युरेटेड' : 'CURATED',
      title: ne ? 'विशेष कालजयी धुनहरू' : 'Featured Masterpieces',
      caption: ne ? 'प्रमाणित अभिलेखसहित चुनिएका उत्कृष्ट धुनहरू' : 'Hand-picked classics with verified metadata',
      countLabel: ne ? `${featuredSongs.length} गीत` : `${featuredSongs.length} tracks`,
      image: artworkFor(featuredSongs[0]) || FALLBACK,
      accentText: 'text-red-300',
      accentBg: 'bg-red-400',
      glow: 'from-red-400/40',
      content: (
        <div className="space-y-1">
          {featuredSongs.map((song) => (
            <SongRow key={song.id} song={song} showYear />
          ))}
        </div>
      ),
      action: { label: ne ? 'सबै हेर्नुहोस्' : 'View all', onClick: onExploreCatalog },
    },
    {
      key: 'recent',
      icon: History,
      eyebrow: ne ? 'हालको इतिहास' : 'HISTORY',
      title: ne ? 'हाल सुनेका गीतहरू' : 'Recently Played',
      caption: ne ? 'तपाईंको श्रवण इतिहास' : 'Your listening history',
      countLabel: ne ? `${recentlyPlayed.length} गीत` : `${recentlyPlayed.length} tracks`,
      image: artworkFor(recentlyPlayed[0]) || FALLBACK,
      accentText: 'text-amber-300',
      accentBg: 'bg-amber-400',
      glow: 'from-amber-400/40',
      content: recentlyPlayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center py-8">
          <History className="w-10 h-10 text-neutral-600 mb-3" />
          <p className="text-sm text-neutral-400">
            {ne ? 'अहिलेसम्म कुनै गीत सुन्नुभएको छैन' : 'No songs played yet'}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {ne ? 'गीत सुन्नुहोस् र यहाँ देखिन्छ' : 'Play some songs and they will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {recentlyPlayed.slice(0, 10).map((song) => (
            <SongRow key={song.id} song={song} />
          ))}
        </div>
      ),
    },
  ];

  const clear = (i: number) => setActive((cur) => (cur === i ? null : cur));

  return (
    <section className="mt-4">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          {/* Shop identity that hosts the wall of worlds */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono uppercase tracking-[0.3em] text-red-400/90 mb-2">
            <Coffee className="w-3.5 h-3.5" />
            <span>{ne ? 'चिया पसल' : 'THE TEA SHOP'}</span>
            <span className="text-white/15">•</span>
            <span className={`tracking-[0.2em] normal-case text-neutral-400 ${ne ? 'font-nepali' : ''}`}>
              {ne ? 'बजेको चिया पसल' : 'Bajeko Chiya Pasal'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.3em] text-neutral-500 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>{ne ? 'अन्वेषण' : 'EXPLORE'}</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-black text-white drop-shadow-sm">
            {ne ? 'एउटै भित्तामा पाँच संसार' : 'Five Worlds, One Wall'}
          </h2>
          <p className="text-sm text-neutral-400 font-nepali mt-2">
            {ne
              ? 'खोल्न कुनै पनि प्यानलमा होभर गर्नुहोस् — फेरि छोड्दा आफै बन्द हुन्छ।'
              : 'Hover any panel to open it — let go and it folds back to where it was.'}
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono uppercase tracking-widest text-neutral-300">
          <ChevronDown className="w-3.5 h-3.5" />
          {ne ? 'खोल्न होभर' : 'Hover to open'}
        </span>
      </div>

      {/* The wall of windows. Each panel grows on hover and collapses on leave. */}
      <div className="flex flex-col lg:flex-row gap-2.5 h-[760px] lg:h-[620px]">
        {panels.map((panel, i) => {
          const isActive = active === i;
          const Icon = panel.icon;
          return (
            <div
              key={panel.key}
              role="button"
              tabIndex={0}
              aria-expanded={isActive}
              aria-label={panel.title}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => clear(i)}
              onFocus={() => setActive(i)}
              onBlur={() => clear(i)}
              style={{ flexGrow: isActive ? 5 : 1 }}
              className={`group/panel relative overflow-hidden rounded-3xl cursor-pointer outline-none select-none
                pd-dark-zone
                transition-[flex-grow,border-color,box-shadow] duration-700 ease-[cubic-bezier(.22,1,.36,1)]
                motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-red-500/70
                ${isActive ? 'border-white/25 shadow-2xl' : 'border-white/10 hover:border-white/20 shadow-panel'}
                bg-black/60`}
            >
              {/* Ambient backdrop — eases its zoom when the window opens */}
              <img
                src={panel.image}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1200ms] ease-out motion-reduce:transition-none ${
                  isActive ? 'scale-110 brightness-[0.24]' : 'scale-100 brightness-[0.34]'
                }`}
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t ${panel.glow} via-black/80 to-black/95 transition-opacity duration-700`}
              />
              <div className="absolute inset-0 bg-black/25" />

              {/* Active accent line sweeping across the top edge */}
              <span
                className={`absolute top-0 left-0 h-1 ${panel.accentBg} transition-all duration-700 ease-out ${
                  isActive ? 'w-full' : 'w-0'
                }`}
              />

              {/* Collapsed face: shown while the window is shut */}
              <div
                className={`absolute inset-0 z-10 transition-opacity duration-300 ${
                  isActive ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-150'
                }`}
              >
                {/* Mobile / stacked: horizontal header */}
                <div className="flex lg:hidden items-center gap-3 h-full px-5">
                  <span className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-6 h-6 ${panel.accentText}`} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-white truncate">{panel.title}</p>
                    <p className="text-xs text-neutral-400 font-mono">{panel.countLabel}</p>
                  </div>
                  <ChevronDown className="ml-auto w-5 h-5 text-neutral-400 flex-shrink-0" />
                </div>

                {/* Desktop: vertical spine */}
                <div className="hidden lg:flex flex-col items-center justify-center gap-6 h-full px-3">
                  <span className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon className={`w-7 h-7 ${panel.accentText}`} />
                  </span>
                  <span
                    style={{ writingMode: 'vertical-rl' }}
                    className="font-serif text-xl font-bold text-white tracking-wide whitespace-nowrap"
                  >
                    {panel.title}
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 whitespace-nowrap">
                    {panel.countLabel}
                  </span>
                </div>
              </div>

              {/* Opened window: contents fade and rise in */}
              <div
                className={`absolute inset-0 z-20 flex flex-col p-5 sm:p-6 transition-all duration-500 ease-out motion-reduce:transition-none ${
                  isActive ? 'opacity-100 translate-y-0 delay-100' : 'opacity-0 translate-y-3 pointer-events-none'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <div className={`flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest ${panel.accentText}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{panel.eyebrow}</span>
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl font-black text-white leading-tight mt-1">
                      {panel.title}
                    </h3>
                    <p className="text-xs text-neutral-300 font-nepali leading-snug mt-1">{panel.caption}</p>
                  </div>

                  {panel.action ? (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        panel.action?.onClick();
                      }}
                      className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-neutral-200 hover:text-white font-mono whitespace-nowrap transition-colors px-3 py-1.5 rounded-full bg-white/5 hover:bg-red-600 border border-white/10 hover:border-red-500"
                    >
                      {panel.action.label}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="hidden sm:block text-[11px] font-mono uppercase tracking-widest text-neutral-300 whitespace-nowrap px-3 py-1.5">
                      {panel.countLabel}
                    </span>
                  )}
                </div>

                <div className="relative flex-1 min-h-0">
                  <div className="h-full overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
                    {panel.content}
                  </div>
                  {/* Soft fade hinting there is more to scroll */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HomeShowcase;
