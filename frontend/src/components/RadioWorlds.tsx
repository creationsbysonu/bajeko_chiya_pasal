import React from 'react';
import { Play, Radio } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { Station } from '../types';
import { Reveal } from './motion/Reveal';

interface RadioWorldsProps {
  stations: Station[];
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

/**
 * The ten radio worlds, laid out as a wall of photo boxes right under the
 * "Five Worlds, One Wall" showcase. Each box keeps its own station colour and
 * tunes straight into that world on tap.
 *
 * The covers are deliberately brighter than a hero backdrop would allow —
 * they are the subject here, not ambience — and the boxes are sized so the
 * photograph, the world name and its tagline all read at a glance.
 */
export const RadioWorlds: React.FC<RadioWorldsProps> = ({ stations }) => {
  const { locale, t } = useI18n();
  const { currentStation, playStation, togglePlayPause, status } = usePlayer();

  // The site is named after the tea shop, so its world is the house default:
  // it is preselected everywhere and is what "Tune into Radio" starts.
  const houseDefault = stations.find((s) => s.slug === 'chiya-pasal') || stations[0];

  return (
    <section className="space-y-5">
      {/* Section header */}
      <Reveal variant="up" className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-sm">
          <Radio className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
          <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-neutral-400">
            {t.hero.vibeLabel}
          </span>
        </span>
        <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-black text-white drop-shadow-sm">
          {neLabel(stations.length, locale === 'ne')}
        </h2>
      </Reveal>

      {/* Every world, one tap to switch */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stations.map((station) => {
          const isActive = currentStation?.slug === station.slug;
          const isDefault = houseDefault?.slug === station.slug;
          const isPlaying = isActive && status === 'playing';
          // Each world carries its own colour so the wall reads like a row of
          // tuning dials instead of ten identical chips.
          const vibe = themeColor(station.theme_color);
          const accent = tint(vibe);
          const label = locale === 'ne' ? station.title_ne || station.title : station.title;
          const tagline = locale === 'ne' ? station.tagline_ne || station.tagline : station.tagline;
          const trackCount = station.songs_count ?? 0;

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
              className={`group/vibe pd-dark-zone relative flex h-full min-h-[184px] w-full flex-col gap-2 overflow-hidden rounded-3xl border p-4 pl-5 text-left transition-all duration-300 ease-out hover:-translate-y-1 active:scale-[0.98] ${
                isActive
                  ? 'border-white/25 bg-black shadow-2xl'
                  : 'border-white/10 bg-black hover:border-white/25'
              }`}
            >
              {/* Station photograph — the point of the box, so it stays bright */}
              {station.cover_image && (
                <img
                  src={station.cover_image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    // A dead cover must degrade to the plain card, never
                    // to a broken-image glyph over the copy.
                    event.currentTarget.style.display = 'none';
                  }}
                  className={`pointer-events-none absolute inset-0 h-full w-full origin-center object-cover saturate-110 transition-all duration-500 ease-out motion-reduce:transition-none ${
                    isActive
                      ? 'scale-105 opacity-85'
                      : 'opacity-70 group-hover/vibe:scale-105 group-hover/vibe:opacity-90'
                  }`}
                />
              )}
              {/* Readability scrim over the photograph — light on top, solid
                  under the words so the copy never fights the image */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/80"
              />
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
                className={`absolute inset-y-4 left-0 w-[3px] rounded-full transition-opacity duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-45 group-hover/vibe:opacity-90'
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
                <span className="truncate text-[15px] font-bold tracking-tight text-white">
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

              <span className="relative line-clamp-2 min-h-[2.2rem] text-[11.5px] font-nepali leading-snug text-neutral-300">
                {tagline}
              </span>

              <span className="relative mt-auto flex items-center gap-2 pt-1.5">
                {isDefault && (
                  <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-600/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-300">
                    {t.hero.defaultBadge}
                  </span>
                )}
                {trackCount > 0 && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                    {trackCount} {locale === 'ne' ? 'गीत' : 'tracks'}
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
                    className="ml-auto inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-neutral-300 opacity-0 transition-opacity duration-200 group-hover/vibe:opacity-100"
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

      <p className="text-center text-[11px] font-nepali text-neutral-500">{t.hero.vibeHint}</p>
    </section>
  );
};

/** "Ten Radio Worlds" / "दसवटा रेडियो संसारहरू", counted from the catalog. */
function neLabel(count: number, ne: boolean): string {
  return ne ? `${count} वटा रेडियो संसार` : `${count} Radio Worlds`;
}

export default RadioWorlds;
