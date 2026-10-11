import React from 'react';
import { Play, Search, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { Station } from '../types';
import { RadioTuner } from './RadioTuner';

interface HeroProps {
  stations: Station[];
  onExploreCatalog: () => void;
}

export const Hero: React.FC<HeroProps> = ({ stations, onExploreCatalog }) => {
  const { locale, t } = useI18n();
  const { currentStation, playStation, status } = usePlayer();

  const handleStartDefaultRadio = () => {
    if (stations.length > 0) {
      const stationToPlay = currentStation || stations[0];
      playStation(stationToPlay);
    }
  };

  return (
    <section className="relative pt-8 pb-14 overflow-hidden bg-black border-b border-white/5">
      {/* Subtle red ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-red-600/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Hero Headline */}
        <div className="text-center max-w-2xl mx-auto pt-4">

          {/* Live Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[11px] font-medium mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-nepali">{t.hero.badge}</span>
            <span className="text-white/20">•</span>
            <span className="font-mono text-red-500 font-bold">PURANO DHUN</span>
          </div>

          {/* Main Title */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-3">
            {locale === 'ne' ? (
              <>
                <span className="block font-nepali">पुराना धुन, नयाँ सम्झना</span>
                <span className="block text-xl sm:text-2xl font-serif text-neutral-400 font-normal mt-2">
                  Nepali Music, Timeless Memories
                </span>
              </>
            ) : (
              <>
                <span className="block">Nepali Music,</span>
                <span className="block text-red-500">Timeless Memories</span>
                <span className="block text-xl sm:text-2xl font-nepali text-neutral-400 font-normal mt-2">
                  पुराना धुन, नयाँ सम्झना
                </span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-neutral-500 leading-relaxed font-nepali mb-8 max-w-xl mx-auto">
            {t.hero.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <button
              onClick={handleStartDefaultRadio}
              className="flex items-center gap-2 px-7 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-sm tracking-wide transition-all duration-200 ease-out hover:scale-105 active:scale-95"
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

          {/* Active Station Indicator */}
          {currentStation && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-neutral-300">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  status === 'playing' ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'
                }`}
              />
              <span className="font-mono text-red-500 text-[10px] font-bold uppercase">
                {status === 'playing' ? 'On Air' : 'Tuned'}
              </span>
              <span className="text-neutral-400">—</span>
              <span className="font-nepali font-medium">
                {locale === 'ne' ? currentStation.title_ne || currentStation.title : currentStation.title}
              </span>
            </div>
          )}

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-5 mt-6 text-[11px] text-neutral-600 font-nepali">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
              <span>{t.hero.verifiedNote}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-red-600" />
              <span>सर्जक र प्रतिलिपि अधिकारको सम्मान</span>
            </div>
          </div>
        </div>

        {/* Radio Tuner / Station Cards */}
        <RadioTuner stations={stations} />
      </div>
    </section>
  );
};
