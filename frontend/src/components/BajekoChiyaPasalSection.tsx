import React, { useEffect, useState } from 'react';
import { Coffee, Flame, Radio, Mountain, Heart, Bus, Play, ArrowRight, Clock, Volume2 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { Song, Station } from '../types';
import { BrandMark } from './BrandMark';
import { Reveal } from './motion/Reveal';

interface BajekoChiyaPasalSectionProps {
  stations: Station[];
  featuredSongs: Song[];
  trendingSongs: Song[];
  newSongs: Song[];
  onExploreCatalog: () => void;
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
 * The shop-front: Bajeko Chiya Pasal. A signature block at the top of the home
 * page — an open/closed sign that follows the local clock, "today's special"
 * (a song that rotates once a day), and a tea menu whose brews pour one of the
 * themed radio worlds. All data comes from the existing catalog.
 */
export const BajekoChiyaPasalSection: React.FC<BajekoChiyaPasalSectionProps> = ({
  stations,
  featuredSongs,
  trendingSongs,
  newSongs,
  onExploreCatalog,
}) => {
  const { locale, t } = useI18n();
  const cp = t.chiyaPasal;
  const { playSong, playStation, currentStation, currentSong, status } = usePlayer();
  const ne = locale === 'ne';

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

  return (
    <section className="relative rounded-3xl overflow-hidden border border-gold-500/20 bg-black shadow-2xl pd-dark-zone">
      {/* Warm shop backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1400&q=80"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover brightness-[0.18] contrast-[1.08] saturate-[0.9]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-black/70" />
        <div className="absolute -top-24 left-1/3 w-[420px] h-[240px] bg-red-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 p-5 sm:p-8 lg:p-10">
        {/* Shop board header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Reveal variant="up" className="flex items-center gap-3.5">
            <span className="grid place-items-center w-14 h-14 rounded-2xl bg-black/60 border border-gold-500/25 shadow-glow-red flex-shrink-0">
              <BrandMark size={34} />
            </span>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.45em] text-gold-500/80">{cp.kicker}</p>
              <h2 className={`text-2xl sm:text-3xl font-black text-white leading-tight ${ne ? 'font-nepali' : 'font-serif'}`}>
                {cp.heading}
              </h2>
            </div>
          </Reveal>

          <Reveal variant="fade" delay={80}>
            <span
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold font-mono uppercase tracking-wider ${
                isOpen
                  ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300'
                  : 'bg-white/5 border-white/15 text-neutral-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
              <Clock className="w-3.5 h-3.5" />
              {isOpen ? cp.openNow : cp.closedNow}
            </span>
          </Reveal>
        </div>

        <p className={`mt-4 max-w-2xl text-sm text-cream-200/85 leading-relaxed ${ne ? 'font-nepali' : ''}`}>
          {cp.intro}
        </p>

        {/* The counter: today's special + the menu */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          {/* Today's special */}
          <Reveal variant="up" delay={120}>
            <div className="h-full rounded-2xl border border-gold-500/20 bg-black/55 backdrop-blur-sm p-4 sm:p-5 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-red-400 font-bold">
                  {cp.specialLabel}
                </span>
                {specialPlaying && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                    <Volume2 className="w-3 h-3" /> {cp.nowPouring}
                  </span>
                )}
              </div>

              {special ? (
                <div className="mt-3 flex items-center gap-4 flex-1">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-black">
                    <img
                      src={specialArt}
                      alt={specialTitle}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-base sm:text-lg font-bold text-white truncate ${ne ? 'font-nepali' : ''}`} title={specialTitle}>
                      {specialTitle}
                    </h3>
                    <p className="text-xs text-neutral-400 truncate">{specialArtist || special.film_or_source}</p>
                    <p className={`mt-1.5 text-[11px] text-gold-500/80 leading-snug ${ne ? 'font-nepali' : ''}`}>
                      {cp.specialHint}
                    </p>
                    <button
                      onClick={() => playSong(special)}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold tracking-wide shadow-glow-red border border-red-500/50 transition-all duration-200 ease-out hover:scale-105 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      {cp.sipPlay}
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`mt-4 text-sm text-neutral-500 ${ne ? 'font-nepali' : ''}`}>{cp.specialEmpty}</p>
              )}
            </div>
          </Reveal>

          {/* Tea menu */}
          <Reveal variant="up" delay={180}>
            <div className="h-full rounded-2xl border border-white/10 bg-black/45 backdrop-blur-sm p-4 sm:p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-gold-500/80 font-bold">
                  {cp.menuLabel}
                </span>
                <button
                  onClick={onExploreCatalog}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
                >
                  {cp.menuAll} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className={`text-[11px] text-neutral-500 mb-3 ${ne ? 'font-nepali' : ''}`}>{cp.menuHint}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BREWS.map((brew) => {
                  const station = stationFor(brew.station);
                  const playing = Boolean(station && currentStation?.slug === station.slug && status === 'playing');
                  return (
                    <button
                      key={brew.id}
                      onClick={() => station && playStation(station)}
                      disabled={!station}
                      className={`group text-left p-3 rounded-xl border transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                        playing
                          ? 'bg-red-600/15 border-red-500/50'
                          : 'bg-white/3 border-white/8 hover:border-gold-500/40 hover:bg-white/6'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`grid place-items-center w-8 h-8 rounded-lg flex-shrink-0 border ${playing ? 'bg-red-600/25 border-red-500/40' : 'bg-black/60 border-white/10'}`}>
                          <brew.Icon className={`w-4 h-4 ${playing ? 'text-red-400' : 'text-gold-500'}`} />
                        </span>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold text-white truncate ${ne ? 'font-nepali' : ''}`}>
                            {ne ? brew.ne : brew.en}
                          </h4>
                          <p className={`text-[10px] text-neutral-500 truncate ${ne ? 'font-nepali' : ''}`}>
                            {ne ? brew.noteNe : brew.noteEn}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>

        {/* House rule */}
        <div className="mt-5 pt-4 border-t border-white/8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className={`text-[11px] text-neutral-500 ${ne ? 'font-nepali' : ''}`}>
            <span className="text-gold-500/80 font-mono uppercase tracking-wider mr-1.5">{cp.houseRule}</span>
            {cp.houseRuleText}
          </p>
          <p className={`text-[11px] text-red-400/80 font-mono ${ne ? 'font-nepali' : ''}`}>{cp.firstSip}</p>
        </div>
      </div>
    </section>
  );
};
