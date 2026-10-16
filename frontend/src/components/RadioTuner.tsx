import React, { useState } from 'react';
import { Station } from '../types';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Sparkles, Shuffle } from 'lucide-react';

interface RadioTunerProps {
  stations: Station[];
}

export const RadioTuner: React.FC<RadioTunerProps> = ({ stations }) => {
  const { locale } = useI18n();
  const { currentStation, playStation, togglePlayPause, status } = usePlayer();
  // Fixed at mount, stable across renders, but gives a fresh random pick on
  // every visit so the stage never shows the same static world twice.
  const [seed, setSeed] = useState(() => Math.random());

  const suggestion = stations.length
    ? stations[Math.floor(seed * stations.length) % stations.length]
    : undefined;

  const activeStation = currentStation || suggestion;
  const isPlaying = status === 'playing' && currentStation?.slug === activeStation?.slug;
  const isSuggested = !currentStation && !!activeStation;

  const ne = locale === 'ne';

  const handleStagePlayToggle = () => {
    if (currentStation?.slug === activeStation?.slug) {
      togglePlayPause();
    } else if (activeStation) {
      playStation(activeStation);
    }
  };

  const handleShuffleStation = () => {
    if (!stations.length) return;
    if (currentStation) {
      // Already listening — jump straight into another random world.
      playStation(stations[Math.floor(Math.random() * stations.length)]);
    } else {
      // Idle — just offer a different suggestion.
      setSeed(Math.random());
    }
  };

  if (!activeStation) return null;

  const coverUrl = activeStation.cover_image || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="my-10 max-w-6xl mx-auto">
      {/* Cinematic Featured Station Stage */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl group pd-dark-zone">

        {/* Photographic Background with Vignette Gradient */}
        <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] w-full overflow-hidden">
          <img
            src={coverUrl}
            alt={activeStation.title}
            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 brightness-[0.75] contrast-[1.05]"
          />
          {/* Subtle multi-layer vignette gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
        </div>

        {/* Floating Station Information & Controls */}
        <div className="absolute inset-0 p-5 sm:p-8 lg:p-10 flex flex-col justify-between z-10">

          {/* Top Bar: Station pill & Live Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 shadow-glow-red animate-pulse' : 'bg-neutral-600'}`} />
              <span className="font-mono text-xs tracking-widest uppercase text-neutral-500 font-bold">
                {activeStation.ambient_type.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="text-white/30">•</span>
              <span className="text-xs font-mono text-white/80">
                CH-{(activeStation.display_order + 1).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isSuggested && (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono tracking-widest text-red-300 font-bold">
                  <Sparkles className="w-3 h-3" />
                  {ne ? 'सुझाव' : 'SUGGESTED'}
                </div>
              )}

              {isPlaying && (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-950/80 backdrop-blur-md border border-red-500/40 text-xs font-mono tracking-widest text-red-300 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping mr-1" />
                  NOW STREAMING
                </div>
              )}

              <button
                onClick={handleShuffleStation}
                title={ne ? 'अरू सुझाव / अर्को रेडियो' : 'Surprise me — shuffle the airwaves'}
                aria-label={ne ? 'अरू सुझाव' : 'Surprise me'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-red-600/80 backdrop-blur-md border border-white/10 hover:border-red-500/50 text-xs font-mono tracking-widest text-white/80 hover:text-white font-bold transition-all duration-200 active:scale-95"
              >
                <Shuffle className="w-3.5 h-3.5" />
                {ne ? 'शफल' : 'SURPRISE'}
              </button>
            </div>
          </div>

          {/* Bottom Stage: Title, Description & Action */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="max-w-xl space-y-2">
              {isSuggested && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-red-400">
                  <Sparkles className="w-3 h-3" />
                  {ne ? 'तपाईंका लागि सुझाव' : 'Picked for you today'}
                </span>
              )}
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight drop-shadow">
                {ne ? activeStation.title_ne || activeStation.title : activeStation.title}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 font-nepali">
                {ne ? activeStation.title : activeStation.title_ne}
              </p>
              <p className="text-xs sm:text-sm text-white/80 font-nepali leading-relaxed line-clamp-2">
                {ne ? activeStation.description_ne || activeStation.description : activeStation.description || activeStation.tagline}
              </p>
            </div>

            {/* Play Button & Audio Wave Animation */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {isPlaying && (
                <div className="flex items-end gap-1 h-6 select-none" aria-hidden="true">
                  <span className="w-1 bg-red-500 rounded-full animate-pulse h-6" />
                  <span className="w-1 bg-red-500 rounded-full animate-pulse delay-75 h-4" />
                  <span className="w-1 bg-white rounded-full animate-pulse delay-150 h-5" />
                  <span className="w-1 bg-red-600 rounded-full animate-pulse delay-100 h-3" />
                </div>
              )}

              <button
                onClick={handleStagePlayToggle}
                className="flex items-center gap-3 px-7 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide shadow-glow-red border border-red-500/50 transition-all duration-300 ease-out hover:scale-105 active:scale-95"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>{ne ? 'रेडियो रोक्नुहोस्' : 'Pause Radio'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white translate-x-0.5" />
                    <span>{isSuggested ? 'Tune Into This' : 'Tune In Now'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
