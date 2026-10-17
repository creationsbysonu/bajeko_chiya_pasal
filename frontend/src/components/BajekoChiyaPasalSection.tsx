import React, { useEffect, useState } from 'react';
import { Coffee, Flame, Radio, Mountain, Heart, Bus, Play, ArrowRight, Clock } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { Song, Station } from '../types';
import { BrandMark } from './BrandMark';
import { Reveal } from './motion/Reveal';
import { Roller } from './motion/Roller';
import { SteamCup, TeaLeafDivider, BrewRing } from './ChiyaGraphics';
import { useParallax } from '../hooks/useMotion';

interface BajekoChiyaPasalSectionProps {
  stations: Station[];
  featuredSongs: Song[];
  trendingSongs: Song[];
  newSongs: Song[];
  onExploreCatalog: () => void;
  /** Render a compact, chrome-less counter for embedding inside a panel. */
  embedded?: boolean;
}

// The "menu" of the shop: each brew is a mood that pours straight into one of
// the themed radio worlds. Kept here (not in the DB) so the wording can stay
// warm and hand-written.
const BREWS: {
  id: string;
  ne: string;
  en: string;
  noteNe: string;
  noteEn: string;
  station: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dudh', ne: 'दूध चिया', en: 'Milk Tea', noteNe: 'नरम, मिठो, आत्मीय धुन', noteEn: 'Soft, sweet, familiar melodies', station: 'chiya-pasal', Icon: Coffee },
  { id: 'masala', ne: 'मसला चिया', en: 'Masala Chiya', noteNe: 'चटपटी लोक र दोहोरी', noteEn: 'Spirited folk & dohori', station: 'lok-dohori', Icon: Flame },
  { id: 'kalo', ne: 'कालो चिया', en: 'Black Tea', noteNe: 'शुद्ध, कालजयी स्वर', noteEn: 'Pure, timeless classics', station: 'purano-radio', Icon: Radio },
  { id: 'himali', ne: 'हिमाली चिया', en: 'Himalayan Brew', noteNe: 'सारङ्गी–बाँसुरीको शीतलता', noteEn: 'Cool sarangi & flute', station: 'himalayan-acoustic', Icon: Mountain },
  { id: 'prem', ne: 'प्रेम चिया', en: 'Prem Chiya', noteNe: 'मुटु छुने प्रेमिल धुन', noteEn: 'Heart-touching romance', station: 'prem-geet', Icon: Heart },
  { id: 'yatra', ne: 'यात्रा चिया', en: 'Yatra Chiya', noteNe: 'बसको झ्यालबाट पहाडी धुन', noteEn: 'Hill tunes from the bus window', station: 'bus-yatra', Icon: Bus },
];

const SHOP_OPENS = 6;
const SHOP_CLOSES = 22;

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  const now = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((now - start) / 86_400_000);
}

/**
 * The shop-front: Bajeko Chiya Pasal. A signature block near the top of the home
 * page — an open/closed sign that follows the local clock, "today's special"
 * (a song that rotates once a day), and a tea menu whose brews pour one of the
 * themed radio worlds. All data comes from the existing catalog.
 *
 * Rendered as the first panel of the home "wall of worlds"; the standalone
 * `embedded` variant drops the outer chrome so it can live inside a panel.
 */
export const BajekoChiyaPasalSection: React.FC<BajekoChiyaPasalSectionProps> = ({
  stations,
  featuredSongs,
  trendingSongs,
  newSongs,
  onExploreCatalog,
  embedded = false,
}) => {
  const { locale, t } = useI18n();
  const cp = t.chiyaPasal;
  const { playSong, playStation, currentStation, currentSong, status } = usePlayer();
  const ne = locale === 'ne';

  // Scroll depth: the glows drift with the page and the big watermark lags
  // behind, so the panel gains a gentle layered parallax as you scroll past.
  const glowRedRef = useParallax<HTMLDivElement>(-0.16);
  const glowAmberRef = useParallax<HTMLDivElement>(0.12);
  const cupRef = useParallax<HTMLDivElement>(-0.08);

  // Keep the open/closed sign honest without a full re-render loop.
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const id = window.setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const isOpen = hour >= SHOP_OPENS && hour < SHOP_CLOSES;

  const pool = featuredSongs.length ? featuredSongs : trendingSongs.length ? trendingSongs : newSongs;
  // The special rotates once per day; `Date` is intentional and stable within a day.
  // oxlint-disable-next-line react/purity
  const specialIndex = dayOfYear(new Date());
  const special: Song | null = pool.length ? pool[specialIndex % pool.length] : null;

  const stationFor = (slug: string) => stations.find((s) => s.slug === slug);

  const specialPlaying = Boolean(special && currentSong?.id === special.id && status === 'playing');
  const specialTitle = special ? (ne ? special.title_ne || special.title : special.title) : '';
  const specialArtist = special ? (ne ? special.artist_name_ne || special.artist_name : special.artist_name) : '';
  const specialArt = special
    ? special.artwork_url || `https://img.youtube.com/vi/${special.provider_video_id}/hqdefault.jpg`
    : '';

  const openChip = (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-semibold font-mono uppercase tracking-[0.15em] ${
        isOpen
          ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300'
          : 'bg-white/5 border-white/15 text-neutral-400'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
      <Clock className="w-3.5 h-3.5" />
      {isOpen ? cp.openNow : cp.closedNow}
    </span>
  );

  const specialCard = (
    <div className="h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-red-400 font-semibold">
          {cp.specialLabel}
        </span>
        {specialPlaying && (
          <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.15em] text-emerald-300">
            <span className="pd-eq" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            {cp.nowPouring}
          </span>
        )}
      </div>

      {special ? (
        <div className="mt-4 flex items-center gap-5 flex-1">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-white/5 shadow-lg">
            <img
              src={specialArt}
              alt={specialTitle}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className={`text-lg sm:text-xl font-bold text-white leading-snug truncate ${ne ? 'font-nepali' : 'font-serif'}`}
              title={specialTitle}
            >
              {specialTitle}
            </h3>
            <p className="mt-1 text-[13px] text-neutral-400 truncate">
              {specialArtist || special.film_or_source}
            </p>
            <button
              onClick={() => playSong(special)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-[13px] font-semibold tracking-wide shadow-glow-red border border-red-500/50 transition-all duration-200 ease-out hover:scale-105 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              {cp.sipPlay}
            </button>
          </div>
        </div>
      ) : (
        <p className={`mt-4 text-sm text-neutral-500 leading-relaxed ${ne ? 'font-nepali' : ''}`}>{cp.specialEmpty}</p>
      )}
    </div>
  );

  const menuCard = (
    <div className="h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-red-400 font-semibold">
          {cp.menuLabel}
        </span>
        <button
          onClick={onExploreCatalog}
          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
        >
          {cp.menuAll} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BREWS.map((brew) => {
          const station = stationFor(brew.station);
          const playing = Boolean(station && currentStation?.slug === station.slug && status === 'playing');
          return (
            <button
              key={brew.id}
              onClick={() => station && playStation(station)}
              disabled={!station}
              className={`group relative overflow-hidden text-left p-3.5 rounded-xl border transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                playing
                  ? 'bg-red-600/15 border-red-500/50'
                  : 'bg-white/3 border-white/8 hover:border-red-500/40 hover:bg-white/6'
              }`}
            >
              {/* left accent that grows on hover / while playing */}
              <span
                aria-hidden="true"
                className={`absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full bg-red-500 origin-center transition-transform duration-300 ease-out ${
                  playing ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'
                }`}
              />
              {/* slow sheen sweep on hover */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/6 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              />
              <div className="relative flex items-center gap-3">
                <span className={`grid place-items-center w-9 h-9 rounded-lg flex-shrink-0 border transition-colors ${playing ? 'bg-red-600/25 border-red-500/40' : 'bg-white/5 border-white/10 group-hover:border-red-500/40'}`}>
                  <brew.Icon className={`w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110 ${playing ? 'text-red-400' : 'text-red-400/80'}`} />
                </span>
                <div className="min-w-0">
                  <h4 className={`text-sm font-semibold text-white truncate ${ne ? 'font-nepali' : ''}`}>
                    {ne ? brew.ne : brew.en}
                  </h4>
                  <p className={`mt-0.5 text-xs text-neutral-500 truncate ${ne ? 'font-nepali' : ''}`}>
                    {ne ? brew.noteNe : brew.noteEn}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Embedded: just the counter, for the "The Tea Shop" panel of the home wall.
  if (embedded) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">{openChip}</div>
        <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
          <Reveal variant="up">{specialCard}</Reveal>
          <Reveal variant="up" delay={60}>{menuCard}</Reveal>
        </div>
      </div>
    );
  }

  return (
    <section className="relative rounded-3xl overflow-hidden border border-red-500/15 bg-gradient-to-br from-ink-750 via-ink-850 to-ink-950 shadow-2xl pd-grain pd-grain--soft">
      {/* Layered warm glows — parallaxed so the panel breathes as you scroll. */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          ref={glowRedRef}
          className="pd-parallax absolute -top-24 left-1/4 w-[420px] h-[240px] bg-red-600/10 blur-[130px] rounded-full"
        />
        <div
          ref={glowAmberRef}
          className="pd-parallax absolute -bottom-20 -right-10 w-[380px] h-[220px] bg-amber-500/10 blur-[140px] rounded-full"
        />
        <div className="pd-halo absolute -top-10 -right-10 w-56 h-56 rounded-full hidden md:block" />
      </div>

      {/* Big parallaxed teacup watermark */}
      <div ref={cupRef} className="pd-parallax pointer-events-none absolute -right-10 -bottom-14 hidden sm:block">
        <BrandMark size={240} decorative className="opacity-[0.05]" />
      </div>

      {/* Slow-bobbing steam, tucked into the corner */}
      <SteamCup className="pd-brew pointer-events-none absolute -top-2 -right-2 w-24 h-24 text-red-500/20 hidden md:block" />

      <div className="relative z-10 p-5 sm:p-8 lg:p-10">
        {/* Shop board header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Reveal variant="zoom">
              <span className="relative grid place-items-center w-16 h-16 rounded-2xl bg-white/5 border border-red-500/20 shadow-lg flex-shrink-0">
                <BrewRing className="pd-spin-slow pointer-events-none absolute -inset-2 text-red-500/25" />
                <BrandMark size={38} />
              </span>
            </Reveal>
            <div className="min-w-0">
              <Reveal variant="fade" delay={60}>
                <p className="text-[11px] font-mono uppercase tracking-[0.4em] text-red-400/90">
                  {cp.kicker}
                </p>
              </Reveal>
              <Reveal mask delay={120}>
                <h2
                  className={`mt-1 text-3xl sm:text-4xl font-black text-white leading-[1.05] ${
                    ne ? 'font-nepali' : 'font-serif tracking-tight'
                  }`}
                >
                  {cp.heading}
                </h2>
              </Reveal>
            </div>
          </div>

          <Reveal variant="fade" delay={160}>
            {openChip}
          </Reveal>
        </div>

        {/* Ornamental divider */}
        <Reveal variant="fade" delay={200} className="mt-6">
          <TeaLeafDivider className="w-full max-w-md h-6 mx-auto text-red-500/40" />
        </Reveal>

        {/* The counter: today's special + the menu */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          <Reveal variant="up" delay={120}>
            {specialCard}
          </Reveal>
          <Reveal variant="up" delay={180}>
            {menuCard}
          </Reveal>
        </div>

        {/* Rolling ticker of what's brewing */}
        <Reveal variant="fade" delay={260} className="mt-6">
          <div className="rounded-full border border-white/8 bg-white/3 px-1">
            <Roller
              items={BREWS.map((b) => (
                <span key={b.id} className={`text-xs text-neutral-400 ${ne ? 'font-nepali' : ''}`}>
                  {ne ? b.ne : b.en}
                </span>
              ))}
              separator={<span className="w-1 h-1 rounded-full bg-red-500/60" aria-hidden="true" />}
              duration={30}
              className="py-1"
              label={ne ? 'चिया मेनु टिकर' : 'Tea menu ticker'}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
};
