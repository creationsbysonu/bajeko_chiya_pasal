import React from 'react';
import { Play, Search, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { Station } from '../types';
import { RadioTuner } from './RadioTuner';
import { Reveal } from './motion/Reveal';
import { Roller } from './motion/Roller';

interface HeroProps {
  stations: Station[];
  onExploreCatalog: () => void;
}

export const Hero: React.FC<HeroProps> = ({ stations, onExploreCatalog }) => {
  const { locale, t } = useI18n();
  const { currentStation, playStation, status } = usePlayer();
  const { theme } = useTheme();

  const stationNames = stations.map((s) => ({
    text: locale === 'ne' ? s.title_ne || s.title : s.title,
    slug: s.slug,
  }));

  const handleStartDefaultRadio = () => {
    if (stations.length > 0) {
      const stationToPlay = currentStation || stations[0];
      playStation(stationToPlay);
    }
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[11px] font-medium backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-nepali">{t.hero.badge}</span>
                <span className="text-white/20">•</span>
                <span className="font-mono text-red-500 font-bold">PURANO DHUN</span>
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
                  <span className="font-mono text-red-500 text-[10px] font-bold uppercase">
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
