import React from 'react';
import { Play, Search, Radio } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { Station } from '../types';
import { RadioTuner } from './RadioTuner';
import { Reveal } from './motion/Reveal';
import { Roller } from './motion/Roller';

interface HeroProps {
  stations: Station[];
  onExploreCatalog: () => void;
}

/**
 * Station colours come from the catalog, and some of them are deliberately
 * dark (Biraha's slate, Bus Yatra's forest, Nepali Rock's oxblood). They look
 * rich as glows but turn illegible as text on a black hero, so anything that
 * carries meaning — indicator dots, status pills, the equaliser — gets the
 * colour mixed toward white first.
 */
const tint = (hex: string, amount = 0.55) => {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return hex;
  const value = parseInt(match[1], 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  const red = mix((value >> 16) & 255);
  const green = mix((value >> 8) & 255);
  const blue = mix(value & 255);
  return `rgb(${red}, ${green}, ${blue})`;
};

/**
 * `theme_color` is data, not code: it is used straight into gradients and
 * alpha-suffixed glows (`#RRGGBB38`), so anything that is not a full 6-digit
 * hex collapses to the brand crimson instead of producing broken CSS.
 */
const themeColor = (value?: string | null) => {
  const raw = (value ?? '').trim();
  const body = raw.startsWith('#') ? raw.slice(1) : raw;
  return /^[0-9a-f]{6}$/i.test(body) ? `#${body}` : '#DC2626';
};

export const Hero: React.FC<HeroProps> = ({ stations, onExploreCatalog }) => {
  const { locale, t } = useI18n();
  const { currentStation, playStation, togglePlayPause, status } = usePlayer();

  const stationNames = stations.map((s) => ({
    text: locale === 'ne' ? s.title_ne || s.title : s.title,
    slug: s.slug,
  }));

  // The site is named after the tea shop, so its world is the house default:
  // it is preselected everywhere and is what "Tune into Radio" starts.
  const houseDefault =
    stations.find((s) => s.slug === 'chiya-pasal') || stations[0];

  const handleStartDefaultRadio = () => {
    const stationToPlay = currentStation || houseDefault;
    if (stationToPlay) playStation(stationToPlay);
  };

  return (
    <div>
      <section
        className="relative pt-8 pb-14 overflow-hidden bg-black border-b border-white/5"
      >
        {/* Subtle red ambient glow — parallaxed */}
        <div
          className="pd-parallax absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-red-600/8 blur-[120px] rounded-full pointer-events-none"
        />
        <div className="absolute top-1/5 right-1/4 w-[400px] h-[240px] bg-red-600/4 blur-[100px] rounded-full pointer-events-none opacity-60" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Hero Headline — masked line roller reveal */}
          <div className="text-center max-w-2xl mx-auto pt-4">

            {/* Live Badge */}
            <Reveal variant="fade" delay={80} className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-nepali">{t.hero.badge}</span>
                <span className="text-white/20">•</span>
                <span className="font-mono text-red-500 font-bold">BAJEKO CHIYA PASAL</span>
              </div>
            </Reveal>

            {/* Main Title */}
            <Reveal variant="up" delay={140} className="mb-3">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                {locale === 'ne' ? (
                  <>
                    <span className="block font-nepali">{t.hero.title}</span>
                    <span className="block text-xl sm:text-2xl font-serif text-neutral-400 font-normal mt-2">
                      Nepali Music, Timeless Memories
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block">{t.hero.title}</span>
                    <span className="block text-xl sm:text-2xl font-nepali text-neutral-400 font-normal mt-2">
                      पुराना धुन, नयाँ सम्झना
                    </span>
                  </>
                )}
              </h1>
            </Reveal>

            {/* Subtitle */}
            <Reveal variant="up" delay={200} className="mb-8 max-w-xl mx-auto">
              <p className="text-sm text-neutral-500 leading-relaxed font-nepali">{t.hero.subtitle}</p>
            </Reveal>

            {/* CTA Buttons */}
            <Reveal variant="up" delay={260} className="mb-8">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleStartDefaultRadio}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-sm tracking-wide transition-all duration-200 ease-out hover:scale-105 active:scale-95 shadow-glow-red"
                >
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>{t.hero.startRadio}</span>
                </button>

                <button
                  onClick={onExploreCatalog}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-full bg-transparent hover:bg-white/5 text-white border border-white/15 hover:border-white/30 text-sm font-medium transition-all duration-200 ease-out hover:scale-105 active:scale-95"
                >
                  <Search className="w-4 h-4 text-neutral-400" />
                  <span>{t.hero.exploreSongs}</span>
                </button>
              </div>
            </Reveal>

            {/* Active Station Indicator */}
            {currentStation && (
              <Reveal variant="fade" delay={320}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-neutral-300">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status === 'playing' ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'}`}
                  />
                  <span className="font-mono text-red-500 text-xs font-bold uppercase">
                    {status === 'playing' ? 'On Air' : 'Tuned'}
                  </span>
                  <span className="text-neutral-400">—</span>
                  <span className="font-nepali font-medium">
                    {locale === 'ne' ? currentStation.title_ne || currentStation.title : currentStation.title}
                  </span>
                </div>
              </Reveal>
            )}
          </div>

          {/* Vibe picker — every radio world, one tap to switch */}
          {stations.length > 0 && (
            <Reveal variant="up" delay={340} className="mt-10 max-w-5xl mx-auto">
              <div className="mb-5 flex items-center justify-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-px w-8 bg-gradient-to-r from-transparent to-white/25 sm:w-16"
                />
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-sm">
                  <Radio className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-neutral-400">
                    {t.hero.vibeLabel}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="h-px w-8 bg-gradient-to-l from-transparent to-white/25 sm:w-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {stations.map((station) => {
                  const isActive = currentStation?.slug === station.slug;
                  const isDefault = houseDefault?.slug === station.slug;
                  const isPlaying = isActive && status === 'playing';
                  // Each world carries its own colour so the wall reads like a
                  // row of tuning dials instead of ten identical chips.
                  const vibe = themeColor(station.theme_color);
                  const accent = tint(vibe);
                  const label = locale === 'ne' ? station.title_ne || station.title : station.title;
                  const tagline = locale === 'ne' ? station.tagline_ne || station.tagline : station.tagline;

                  return (
                    <button
                      key={station.slug}
                      onClick={() => {
                        if (isActive) togglePlayPause();
                        else playStation(station);
                      }}
                      aria-pressed={isActive}
                      title={tagline}
                      style={
                        isActive
                          ? {
                              boxShadow: `0 0 0 1px ${vibe}59, 0 16px 34px -24px ${vibe}, 0 0 30px -14px ${vibe}`,
                            }
                          : undefined
                      }
                      className={`group/vibe relative flex h-full w-full flex-col gap-1.5 overflow-hidden rounded-2xl border p-3.5 pl-4 text-left backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 active:scale-[0.98] ${
                        isActive
                          ? 'border-white/25 bg-white/[0.05]'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                      }`}
                    >
                      {/* Station-tinted wash — solid when tuned, revealed on hover */}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
                          isActive ? 'opacity-100' : 'opacity-0 group-hover/vibe:opacity-100'
                        }`}
                        style={{
                          background: `radial-gradient(125% 95% at 12% 0%, ${vibe}38 0%, ${vibe}17 40%, transparent 74%)`,
                        }}
                      />
                      {/* Left channel rail */}
                      <span
                        aria-hidden="true"
                        className={`absolute inset-y-3 left-0 w-[3px] rounded-full transition-opacity duration-300 ${
                          isActive ? 'opacity-100' : 'opacity-35 group-hover/vibe:opacity-90'
                        }`}
                        style={{ background: `linear-gradient(180deg, ${vibe}, ${vibe}22)` }}
                      />

                      <span className="relative flex min-w-0 items-center gap-2">
                        <span className="relative flex-shrink-0" aria-hidden="true">
                          <span
                            className="block h-2 w-2 rounded-full"
                            style={{ backgroundColor: accent, boxShadow: `0 0 10px ${vibe}` }}
                          />
                          {isPlaying && (
                            <span
                              className="absolute -inset-1 rounded-full opacity-60 animate-ping"
                              style={{ backgroundColor: accent }}
                            />
                          )}
                        </span>
                        <span className="truncate text-[13px] font-semibold tracking-tight text-white">
                          {label}
                        </span>
                        {isActive && (
                          <span
                            className="ml-auto flex-shrink-0 rounded-full border px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-wider"
                            style={{
                              borderColor: `${accent}59`,
                              backgroundColor: `${vibe}1f`,
                              color: accent,
                            }}
                          >
                            {status === 'playing' ? 'ON AIR' : 'TUNED'}
                          </span>
                        )}
                      </span>

                      <span className="relative line-clamp-2 min-h-[2.1rem] text-[10.5px] font-nepali leading-snug text-neutral-400">
                        {tagline}
                      </span>

                      <span className="relative mt-auto flex items-center gap-2 pt-1">
                        {isDefault && (
                          <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-600/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-300">
                            {t.hero.defaultBadge}
                          </span>
                        )}
                        {isPlaying ? (
                          <span className="ml-auto flex h-3 items-end gap-[2px]" aria-hidden="true">
                            {[0, 1, 2, 3].map((bar) => (
                              <span
                                key={bar}
                                className="h-full w-[2px] origin-bottom animate-eq rounded-sm"
                                style={{ backgroundColor: accent, animationDelay: `${bar * 0.14}s` }}
                              />
                            ))}
                          </span>
                        ) : (
                          <span
                            aria-hidden="true"
                            className="ml-auto inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-neutral-400 opacity-0 transition-opacity duration-200 group-hover/vibe:opacity-100"
                          >
                            <Play className="h-2.5 w-2.5 fill-current" />
                            {isActive ? 'Resume' : 'Tune'}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-center text-[11px] font-nepali text-neutral-500">
                {t.hero.vibeHint}
              </p>
            </Reveal>
          )}

          {/* Radio Tuner / Station Cards */}
          <RadioTuner stations={stations} />

          {/* Roller ticker of station names across the hero footer */}
          <div className="mt-10 pt-6 border-t border-white/10 relative">
            <div className="pd-grain opacity-40" />
            <Reveal variant="up" delay={380} className="pb-4">
              <Roller
                items={stationNames.map((s) => (
                  <span key={s.slug} className="font-mono text-xs text-neutral-400 hover:text-white transition-colors">
                    {s.text}
                  </span>
                ))}
                separator={
                  <span className="w-1 h-1 rounded-full bg-neutral-600" aria-hidden="true" />
                }
                duration={34}
                label="Radio station ticker"
              />
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
};
