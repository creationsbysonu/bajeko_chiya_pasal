import React, { useState } from 'react';
import { Song, Station } from '../types';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import {
  Play,
  Pause,
  Flame,
  Sparkles,
  Radio,
  Star,
  Music,
  Volume2,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

interface HomeShowcaseProps {
  stations: Station[];
  trendingSongs: Song[];
  newSongs: Song[];
  featuredSongs: Song[];
  onExploreCatalog: () => void;
}

const FALLBACK =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80';

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
      className={`group/row w-full text-left flex items-center gap-2.5 p-2 rounded-xl border transition-colors duration-200 ${
        isCurrent
          ? 'border-red-500/60 bg-red-600/10'
          : 'border-transparent hover:border-white/10 hover:bg-white/5'
      }`}
    >
      {rank !== undefined && (
        <span
          className={`w-5 text-center font-serif text-sm font-black tabular-nums flex-shrink-0 ${
            rank <= 3 ? 'text-red-500' : 'text-neutral-600'
          }`}
        >
          {rank}
        </span>
      )}

      <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800 pd-dark-zone">
        {thumb ? (
          <img src={thumb} alt={song.title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500">
            <Music className="w-4 h-4" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-white text-white" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-white text-white translate-x-0.5" />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-white truncate group-hover/row:text-red-400 transition-colors duration-150">
          {ne ? song.title_ne || song.title : song.title}
        </p>
        <p className="text-[11px] text-neutral-500 font-nepali truncate">
          {ne ? song.artist_name_ne || song.artist_name : song.artist_name}
        </p>
      </div>

      <span className="text-[10px] font-mono text-neutral-500 tabular-nums flex-shrink-0">
        {showYear ? song.release_year : formatCount(song.play_count)}
      </span>
    </button>
  );
};

/** Mini station tile used inside the opened "Themed Radio Worlds" panel. */
const StationTile: React.FC<{ station: Station }> = ({ station }) => {
  const { locale } = useI18n();
  const { currentStation, status, playStation } = usePlayer();
  const ne = locale === 'ne';
  const isCurrent = currentStation?.slug === station.slug;
  const isPlaying = isCurrent && status === 'playing';
  const cover = station.cover_image || FALLBACK;

  const handlePlay = (event: React.MouseEvent) => {
    event.stopPropagation();
    playStation(station);
  };

  return (
    <button
      onClick={handlePlay}
      className={`group/station relative text-left rounded-xl overflow-hidden border transition-colors duration-200 ${
        isCurrent ? 'border-red-500/70' : 'border-white/10 hover:border-white/25'
      } bg-black/50`}
    >
      <div className="relative h-14 w-full overflow-hidden">
        <img
          src={cover}
          alt={station.title}
          loading="lazy"
          className="w-full h-full object-cover brightness-[0.7] group-hover/station:brightness-95 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <span className="absolute bottom-1.5 left-2 right-2 text-[11px] font-semibold text-white truncate">
          {ne ? station.title_ne || station.title : station.title}
        </span>
      </div>
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-[10px] font-mono text-neutral-500">
          {station.songs_count ?? 0} {ne ? 'गीत' : 'tracks'}
        </span>
        {isPlaying ? (
          <Volume2 className="w-3.5 h-3.5 text-red-400 animate-pulse" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current text-neutral-400 group-hover/station:text-red-400 transition-colors" />
        )}
      </div>
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
 * Four home surfaces (Trending, New Releases, Radio Worlds, Featured) laid out
 * as a horizontal wall of windows. Hovering / focusing / tapping a panel grows
 * it open with a smooth eased transition and reveals its contents; leaving
 * collapses it back to the original state.
 */
export const HomeShowcase: React.FC<HomeShowcaseProps> = ({
  stations,
  trendingSongs,
  newSongs,
  featuredSongs,
  onExploreCatalog,
}) => {
  const { locale } = useI18n();
  const ne = locale === 'ne';
  const [active, setActive] = useState<number | null>(null);

  const panels: Panel[] = [
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
      glow: 'from-red-600/40',
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
      icon: Sparkles,
      eyebrow: ne ? 'नयाँ आगमन' : 'FRESH ARRIVALS',
      title: ne ? 'नयाँ रिलिजहरू' : 'New Releases',
      caption: ne ? 'भर्खरै राखिएका ताजा धुनहरू' : 'The latest recordings added to the archive',
      countLabel: ne ? `${newSongs.length} गीत` : `${newSongs.length} tracks`,
      image: artworkFor(newSongs[0]) || FALLBACK,
      accentText: 'text-amber-400',
      accentBg: 'bg-amber-500',
      glow: 'from-amber-500/35',
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
      key: 'radio',
      icon: Radio,
      eyebrow: ne ? 'स्टेसनहरू' : 'STATIONS',
      title: ne ? 'विषयगत रेडियो संसार' : 'Themed Radio Worlds',
      caption: ne ? 'चिया पसलदेखि पहाडी हावासम्मका माहोलहरू' : "Ambient worlds from tea shops to mountain winds",
      countLabel: ne ? `${stations.length} स्टेसन` : `${stations.length} stations`,
      image: stations[0]?.cover_image || FALLBACK,
      accentText: 'text-sky-400',
      accentBg: 'bg-sky-500',
      glow: 'from-sky-500/35',
      content: (
        <div className="grid grid-cols-2 gap-2">
          {stations.map((station) => (
            <StationTile key={station.slug} station={station} />
          ))}
        </div>
      ),
    },
    {
      key: 'featured',
      icon: Star,
      eyebrow: ne ? 'क्युरेटेड' : 'CURATED',
      title: ne ? 'विशेष कालजयी धुनहरू' : 'Featured Masterpieces',
      caption: ne ? 'प्रमाणित अभिलेखसहित चुनिएका उत्कृष्ट धुनहरू' : 'Hand-picked classics with verified metadata',
      countLabel: ne ? `${featuredSongs.length} गीत` : `${featuredSongs.length} tracks`,
      image: artworkFor(featuredSongs[0]) || FALLBACK,
      accentText: 'text-emerald-400',
      accentBg: 'bg-emerald-500',
      glow: 'from-emerald-500/35',
      content: (
        <div className="space-y-1">
          {featuredSongs.map((song) => (
            <SongRow key={song.id} song={song} showYear />
          ))}
        </div>
      ),
      action: { label: ne ? 'सबै हेर्नुहोस्' : 'View all', onClick: onExploreCatalog },
    },
  ];

  const clear = (i: number) => setActive((cur) => (cur === i ? null : cur));

  return (
    <section className="mt-4">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-500 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>{ne ? 'अन्वेषण' : 'EXPLORE'}</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-black text-white drop-shadow-sm">
            {ne ? 'एउटै भित्तामा चार संसार' : 'Four Worlds, One Wall'}
          </h2>
          <p className="text-xs text-neutral-500 font-nepali mt-1">
            {ne
              ? 'खोल्न कुनै पनि प्यानलमा होभर गर्नुहोस् — फेरि छोड्दा आफै बन्द हुन्छ।'
              : 'Hover any panel to open it — let go and it folds back to where it was.'}
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-600">
          <ChevronDown className="w-3.5 h-3.5" />
          {ne ? 'खोल्न होभर' : 'Hover to open'}
        </span>
      </div>

      {/* The wall of windows. Each panel grows on hover and collapses on leave. */}
      <div className="flex flex-col lg:flex-row gap-3 h-[640px] lg:h-[540px]">
        {panels.map((panel, i) => {
          const isActive = active === i;
          const Icon = panel.icon;
          return (
            <div
              key={panel.key}
              role="button"
              tabIndex={0}
              aria-expanded={isActive}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => clear(i)}
              onFocus={() => setActive(i)}
              onBlur={() => clear(i)}
              onClick={() => setActive((cur) => (cur === i ? null : i))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setActive((cur) => (cur === i ? null : i));
                }
              }}
              style={{ flexGrow: isActive ? 4 : 1 }}
              className={`group/panel relative overflow-hidden rounded-3xl border cursor-pointer outline-none select-none
                transition-[flex-grow,border-color,box-shadow] duration-700 ease-[cubic-bezier(.22,1,.36,1)]
                motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-red-500/60
                ${isActive ? 'border-white/25 shadow-2xl' : 'border-white/10 hover:border-white/20'}
                bg-black/60`}
            >
              {/* Ambient backdrop — eases its zoom when the window opens */}
              <img
                src={panel.image}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1200ms] ease-out motion-reduce:transition-none ${
                  isActive ? 'scale-110 brightness-[0.22]' : 'scale-100 brightness-[0.32]'
                }`}
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t ${panel.glow} via-black/75 to-black/95 transition-opacity duration-700`}
              />
              <div className="absolute inset-0 bg-black/20" />

              {/* Active accent line sweeping across the top edge */}
              <span
                className={`absolute top-0 left-0 h-[3px] ${panel.accentBg} transition-all duration-700 ease-out ${
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
                <div className="flex lg:hidden items-center gap-3 h-full px-4">
                  <span
                    className={`w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${panel.accentText}`} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{panel.title}</p>
                    <p className="text-[11px] text-neutral-500 font-mono">{panel.countLabel}</p>
                  </div>
                  <ChevronDown className="ml-auto w-4 h-4 text-neutral-500 flex-shrink-0" />
                </div>

                {/* Desktop: vertical spine */}
                <div className="hidden lg:flex flex-col items-center justify-center gap-5 h-full px-3">
                  <span className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${panel.accentText}`} />
                  </span>
                  <span
                    style={{ writingMode: 'vertical-rl' }}
                    className="font-serif text-lg font-bold text-white tracking-wide whitespace-nowrap"
                  >
                    {panel.title}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                    {panel.countLabel}
                  </span>
                </div>
              </div>

              {/* Opened window: contents fade and rise in */}
              <div
                className={`absolute inset-0 z-20 flex flex-col p-4 sm:p-5 transition-all duration-500 ease-out motion-reduce:transition-none ${
                  isActive ? 'opacity-100 translate-y-0 delay-100' : 'opacity-0 translate-y-3 pointer-events-none'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest ${panel.accentText}`}>
                      <Icon className="w-3 h-3" />
                      <span>{panel.eyebrow}</span>
                    </div>
                    <h3 className="font-serif text-lg sm:text-xl font-black text-white leading-tight mt-0.5">
                      {panel.title}
                    </h3>
                    <p className="text-[11px] text-neutral-500 font-nepali leading-snug mt-0.5">{panel.caption}</p>
                  </div>

                  {panel.action ? (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        panel.action?.onClick();
                      }}
                      className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-neutral-300 hover:text-white font-mono whitespace-nowrap transition-colors"
                    >
                      {panel.action.label}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="hidden sm:block text-[10px] font-mono uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                      {panel.countLabel}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {panel.content}
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
