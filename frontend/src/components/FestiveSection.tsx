import React, { useEffect, useMemo, useState } from 'react';
import { Reveal } from './motion/Reveal';
import { api } from '../services/api';
import { FestivalCalendarEntry, FestivalSong } from '../types';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Music, Music2, CalendarDays, ChevronRight, Flame, Camera } from 'lucide-react';
import { festivalImage } from '../utils/festivalImagery';
import { hideBrokenImage } from '../utils/urlSafety';
import { festivalPlayback } from '../utils/festivalPlaylist';
import { FestivalGlyph } from './FestivalGlyph';

/* --------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* --------------------------------------------------------------------------- */

/** A Date built from a `YYYY-MM-DD` string without the UTC-midnight shift. */
const parseDate = (value: string | null | undefined): Date | null => {
  if (typeof value !== 'string' || !value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!Number.isFinite(y)) return null;
  return new Date(y, (m || 1) - 1, d || 1);
};

const formatDate = (value: string | null | undefined, locale: string): string => {
  // A missing or malformed date from the RPC must not throw mid-render — the
  // festival card renders on the home page.
  const date = parseDate(value);
  if (!date) return locale === 'ne' ? 'मिति अद्यावधिक हुँदै' : 'Date pending';
  return date.toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-GB', {
    month: 'short',
    day: 'numeric',
  });
};

const artworkFor = (song: FestivalSong): string | null =>
  song.artwork_url ||
  (song.provider_video_id ? `https://img.youtube.com/vi/${song.provider_video_id}/hqdefault.jpg` : null);

type Tone = 'active' | 'imminent' | 'later';

interface Countdown {
  tone: Tone;
  label: string;
  detail: string;
}

const countdownFor = (entry: FestivalCalendarEntry, locale: string, t: ReturnType<typeof useI18n>['t']): Countdown => {
  const ne = locale === 'ne';
  if (entry.is_active_window) {
    const left = Math.max(entry.days_until_end, 0);
    const detail = left <= 0
      ? (ne ? 'आज अन्तिम दिन' : 'Ends today')
      : `${left} ${left === 1 ? t.festival.dayLeft : t.festival.daysLeft}`;
    return { tone: 'active', label: t.festival.happeningNow, detail };
  }
  const days = entry.days_until_start;
  const when = formatDate(entry.start_date, locale);
  if (days <= 0) return { tone: 'active', label: t.festival.happeningNow, detail: when };
  if (days === 1) return { tone: 'imminent', label: t.festival.tomorrow, detail: when };
  const label = `${days} ${days === 1 ? t.festival.dayToGo : t.festival.daysToGo}`;
  return { tone: days <= 20 ? 'imminent' : 'later', label, detail: when };
};

const TONE_STYLES: Record<Tone, { pill: string; text: string; border: string; glow: string }> = {
  active: {
    pill: 'bg-red-600 text-white',
    text: 'text-red-300',
    border: 'border-red-500/50',
    glow: 'from-red-600/30',
  },
  imminent: {
    pill: 'bg-amber-500 text-black',
    text: 'text-amber-300',
    border: 'border-amber-500/45',
    glow: 'from-amber-500/25',
  },
  later: {
    pill: 'bg-white/10 text-neutral-200',
    text: 'text-cream-200',
    border: 'border-white/10',
    glow: 'from-cream-300/10',
  },
};

/* --------------------------------------------------------------------------- */
/* Playable song row                                                           */
/* --------------------------------------------------------------------------- */

const FestiveSongRow: React.FC<{
  song: FestivalSong;
  index: number;
  onPlay: (song: FestivalSong) => void;
}> = ({ song, index, onPlay }) => {
  const { locale, t } = useI18n();
  const { currentSong, status, togglePlayPause } = usePlayer();
  const ne = locale === 'ne';
  const isCurrent = currentSong?.id === song.id;
  const isPlaying = isCurrent && status === 'playing';
  const thumb = artworkFor(song);

  const handlePlay = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isCurrent) togglePlayPause();
    // The parent queues the rest of this festival so a single row tap keeps the
    // festival playlist going instead of falling back to the previous queue.
    else onPlay(song);
  };

  return (
    <button
      onClick={handlePlay}
      aria-label={ne ? song.title_ne || song.title : song.title}
      className={`group/row w-full text-left flex items-center gap-3 p-2.5 rounded-xl border transition-colors duration-200 ${
        isCurrent
          ? 'border-red-500/70 bg-red-600/15'
          : 'border-transparent hover:border-white/10 hover:bg-white/5'
      }`}
    >
      <span
        className={`w-6 text-center font-serif text-base font-black tabular-nums flex-shrink-0 ${
          index < 3 ? 'text-red-400' : 'text-neutral-500'
        }`}
      >
        {index + 1}
      </span>

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
        {isPlaying && (
          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-white truncate group-hover/row:text-red-300 transition-colors duration-150">
          {ne ? song.title_ne || song.title : song.title}
        </p>
        <p className="text-xs text-neutral-400 font-nepali truncate">
          {ne ? song.artist_name_ne || song.artist_name : song.artist_name}
        </p>
      </div>

      {song.source === 'festival' ? (
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-red-300 bg-red-600/15 border border-red-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
          {ne ? t.festival.tagDedicatedNe : t.festival.tagDedicated}
        </span>
      ) : song.source === 'trending' ? (
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
          <Flame className="w-3 h-3" />
          {ne ? t.festival.tagTrendingNe : t.festival.tagTrending}
        </span>
      ) : (
        <span className="hidden sm:block text-[11px] font-mono text-neutral-500 tabular-nums flex-shrink-0 max-w-[120px] truncate">
          {song.primary_genre_name || song.release_year || ''}
        </span>
      )}
    </button>
  );
};

/* --------------------------------------------------------------------------- */
/* Festival chip (calendar rail)                                               */
/* --------------------------------------------------------------------------- */

const FestivalChip: React.FC<{
  entry: FestivalCalendarEntry;
  isActive: boolean;
  onSelect: (slug: string) => void;
}> = ({ entry, isActive, onSelect }) => {
  const { locale, t } = useI18n();
  const ne = locale === 'ne';
  const status = countdownFor(entry, locale, t);
  const tone = TONE_STYLES[status.tone];

  const img = festivalImage(entry.slug);

  return (
    <button
      onClick={() => onSelect(entry.slug)}
      aria-pressed={isActive}
      className={`group/chip relative flex-shrink-0 w-52 text-left rounded-2xl border overflow-hidden transition-all duration-200 ease-out ${
        isActive
          ? `${tone.border} bg-white/8 shadow-lg scale-[1.02]`
          : 'border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/20'
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500`}
    >
      <div className="relative h-20">
        {img ? (
          <img
            src={img.url}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover/chip:scale-105"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${tone.glow} to-black`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45" />
        <span className="absolute top-2.5 left-2.5 flex items-center justify-center w-8 h-8 rounded-full bg-black/45 backdrop-blur-sm border border-white/15 text-white/90">
          <FestivalGlyph slug={entry.slug} className="w-4 h-4" />
        </span>
        <span className={`absolute top-2.5 right-2.5 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full ${tone.pill}`}>
          {entry.is_active_window
            ? (ne ? 'अहिले' : 'Now')
            : entry.days_until_start <= 0
              ? '•'
              : `${entry.days_until_start}d`}
        </span>
      </div>
      <div className="p-3.5">
        <p className={`font-serif text-[15px] font-black leading-snug truncate ${isActive ? 'text-white' : 'text-neutral-200'}`}>
          {ne ? entry.name_ne || entry.name : entry.name}
        </p>
        <p className="text-[11px] font-mono text-neutral-500 mt-1 truncate">
          {status.detail} · {entry.song_count} {ne ? t.festival.tracksLabelNe : t.festival.tracksLabel}
        </p>
      </div>
    </button>
  );
};

/* --------------------------------------------------------------------------- */
/* Section                                                                     */
/* --------------------------------------------------------------------------- */

/** Calendar-aware festive catalog: spotlights the next festival and the songs to vibe to before it. */
export const FestiveSection: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { locale, t } = useI18n();
  const { playSong } = usePlayer();
  const ne = locale === 'ne';

  const [calendar, setCalendar] = useState<FestivalCalendarEntry[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<FestivalSong[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [loadingSongs, setLoadingSongs] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getFestivalCalendar()
      .then((data) => {
        if (cancelled) return;
        setCalendar(data);
        // Default to the festival that is happening now or is soonest.
        setSelectedSlug(data[0]?.slug ?? null);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingCalendar(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedSlug) {
      setPlaylist([]);
      return;
    }
    let cancelled = false;
    setLoadingSongs(true);
    api.getFestivalSongs(selectedSlug, 24)
      .then((data) => {
        if (!cancelled) setPlaylist(data.results);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingSongs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  const current = useMemo(
    () => calendar.find((c) => c.slug === selectedSlug) ?? calendar[0] ?? null,
    [calendar, selectedSlug]
  );

  const status = current ? countdownFor(current, locale, t) : null;
  const tone = status ? TONE_STYLES[status.tone] : TONE_STYLES.later;
  const vibeWindow = Boolean(current && (current.is_active_window || current.is_imminent));

  const curated = festivalImage(current?.slug);
  const heroImage = curated?.url ?? (playlist[0] ? artworkFor(playlist[0]) : null);

  const playMix = () => {
    const mix = festivalPlayback(playlist);
    if (mix) playSong(mix.song, undefined, mix.queue);
  };

  /** Queue the rest of the selected festival so its playlist keeps playing. */
  const playFestivalSong = (song: FestivalSong) => {
    const playback = festivalPlayback(playlist, song.id);
    if (playback) playSong(playback.song, undefined, playback.queue);
  };

  const Wrapper: React.ElementType = embedded ? 'div' : 'section';

  return (
    <Wrapper className={embedded ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20'}>
      {/* Section header */}
      {!embedded && (
        <Reveal variant="up" className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-[0.3em] mb-2">
            <CalendarDays className="w-3.5 h-3.5 text-red-400" />
            <span>{t.festival.calendarLabel}</span>
          </div>
          <h2 className="font-serif text-3xl font-black text-white">
            {ne ? t.festival.titleNe : t.festival.title}
          </h2>
          <p className="text-neutral-400 mt-3 max-w-2xl mx-auto text-sm leading-relaxed font-nepali">
            {ne ? t.festival.subtitleNe : t.festival.subtitle}
          </p>
        </Reveal>
      )}

      {loadingCalendar ? (
        <div className="space-y-4">
          <div className="h-64 rounded-3xl bg-white/5 animate-pulse" />
          <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
        </div>
      ) : current && status ? (
        <>
          {/* Spotlight: the next festival and its mood-ready mix */}
          <Reveal variant="up" delay={40}>
            <div
              className={`relative overflow-hidden rounded-3xl border ${tone.border} bg-black pd-dark-zone`}
            >
              {heroImage ? (
                <>
                  <img
                    src={heroImage}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    onError={hideBrokenImage}
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${tone.glow} via-black/70 to-black/85`} />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/35" />
                </>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${tone.glow} via-black/60 to-black/80`} />
              )}
              <FestivalGlyph
                slug={current.slug}
                strokeWidth={0.8}
                className="pointer-events-none absolute -right-8 -bottom-10 w-56 h-56 text-white opacity-[0.06] select-none"
              />

              <div className={`relative grid gap-6 ${embedded ? '' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]'} p-5 sm:p-7`}>
                {/* Left: identity + countdown + CTA */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 ${tone.text}`}>
                      <FestivalGlyph slug={current.slug} className="w-7 h-7" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${tone.pill}`}>
                          {status.tone === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                          {status.label}
                        </span>
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl font-black text-white leading-tight mt-2">
                        {ne ? current.name_ne || current.name : current.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-300 font-nepali leading-relaxed mt-4">
                    {current.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-[11px] font-mono text-neutral-400">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {formatDate(current.start_date, locale)}
                      {current.end_date !== current.start_date ? ` – ${formatDate(current.end_date, locale)}` : ''}
                    </span>
                    <span className="tabular-nums">{status.detail}</span>
                    {current.is_estimated && (
                      <span className="text-amber-400/80">≈ {t.festival.estimated}</span>
                    )}
                  </div>

                  {vibeWindow && (
                    <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                      <Music2 className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-200 uppercase tracking-wider font-mono">
                          {t.festival.getInMood}
                        </p>
                        <p className="text-xs text-amber-100/80 font-nepali mt-0.5">{t.festival.vibeHint}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-6 flex items-center gap-4">
                    <button
                      onClick={playMix}
                      disabled={!playlist.length}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      {t.festival.listenNow}
                    </button>
                    <span className="text-xs font-mono text-neutral-400 tabular-nums">
                      {current.song_count} {ne ? t.festival.dedicatedLabelNe : t.festival.dedicatedLabel}
                    </span>
                  </div>

                  {curated && (
                    <a
                      href={curated.creditUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors self-start"
                    >
                      <Camera className="w-3 h-3" />
                      {curated.credit} · {curated.license} · Wikimedia Commons
                    </a>
                  )}
                </div>

                {/* Right: the playlist for this festival */}
                <div className="relative">
                  <div className={embedded ? 'pr-1' : 'max-h-[360px] overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]'}>
                    {loadingSongs ? (
                      <div className="space-y-1.5">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                        ))}
                      </div>
                    ) : playlist.length === 0 ? (
                      <div className="flex h-full min-h-[180px] items-center justify-center text-center text-sm text-neutral-400">
                        {ne ? t.festival.noSongsNe : t.festival.noSongs}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {playlist.map((song, i) => (
                          <FestiveSongRow
                            key={song.id}
                            song={song}
                            index={i}
                            onPlay={playFestivalSong}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {playlist.length > 6 && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/80 to-transparent" />
                  )}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Calendar rail: every major festival, soonest first */}
          <Reveal variant="up" delay={90} className={embedded ? '' : 'mt-10'}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg font-black text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-red-400" />
                {t.festival.calendarLabel}
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-neutral-500">
                {ne ? 'आगामी पहिले' : 'Soonest first'}
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex gap-3.5 overflow-x-auto overscroll-contain pb-3 px-1 pt-1 -mx-1 [scrollbar-width:thin]">
              {calendar.map((entry) => (
                <FestivalChip
                  key={entry.slug}
                  entry={entry}
                  isActive={entry.slug === selectedSlug}
                  onSelect={setSelectedSlug}
                />
              ))}
            </div>
          </Reveal>
        </>
      ) : (
        <div className="text-center text-sm text-neutral-500 py-12">
          {ne ? t.festival.noSongsNe : t.festival.noSongs}
        </div>
      )}
    </Wrapper>
  );
};

export default FestiveSection;
