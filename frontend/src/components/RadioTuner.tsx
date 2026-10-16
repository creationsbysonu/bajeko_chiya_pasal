import React, { useState } from 'react';
import { Station } from '../types';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { useAmbient } from '../context/AmbientContext';
import { AMBIENT_LAYERS } from '../services/ambient';
import { Play, Pause, Sparkles, Shuffle, Waves, VolumeX } from 'lucide-react';

interface RadioTunerProps {
  stations: Station[];
}

export const RadioTuner: React.FC<RadioTunerProps> = ({ stations }) => {
  const { locale } = useI18n();
  const { currentStation, playStation, togglePlayPause, status } = usePlayer();
  const ambient = useAmbient();
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
    <div className="my-10 max-w-6xl mx-auto space-y-6">

      {/* 1. Cinematic Featured Soundscape Stage */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl group pd-dark-zone">

        {/* Photographic Background with Atmospheric Gradient */}
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

        {/* Floating Soundscape Information & Controls */}
        <div className="absolute inset-0 p-5 sm:p-8 lg:p-10 flex flex-col justify-between z-10">

          {/* Top Bar: Ambient pill & Live Status */}
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
                    <span>Pause Soundscape</span>
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

      {/* 2. Atmospheric Soundscapes — a live ambient mixer, independent of the
             station being played. Layers stack over the music. */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
          <p className="text-xs uppercase tracking-widest font-mono text-neutral-500 flex items-center gap-2 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <span className="truncate">ATMOSPHERIC SOUNDSCAPES • सांगीतिक परिवेश</span>
            {ambient.activeCount > 0 && ambient.supported && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/15 border border-red-500/40 text-red-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {ambient.activeCount} {ne ? 'सक्रिय' : 'LIVE'}
              </span>
            )}
          </p>

          {ambient.supported && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {ambient.activeCount > 0 && (
                <button
                  onClick={ambient.stopAll}
                  title={ne ? 'सबै बन्द गर्नुहोस्' : 'Stop all ambience'}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-400 transition-colors duration-200 font-mono uppercase tracking-wider"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  {ne ? 'बन्द' : 'Clear'}
                </button>
              )}

              <div className="inline-flex items-center gap-2">
                <Waves className="w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={ambient.master}
                  onChange={(e) => ambient.setMaster(Number(e.target.value))}
                  aria-label={ne ? 'ध्वनि स्तर' : 'Ambience volume'}
                  className="w-20 h-1 accent-red-500 cursor-pointer"
                />
              </div>

              <button
                onClick={ambient.surprise}
                title={ne ? 'कुनै पनि मिश्रण बनाउनुहोस्' : 'Surprise mix'}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-400 transition-colors duration-200 font-mono uppercase tracking-wider"
              >
                <Shuffle className="w-3.5 h-3.5" />
                {ne ? 'मिक्स' : 'Surprise mix'}
              </button>
            </div>
          )}
        </div>

        {!ambient.supported ? (
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4 text-xs text-neutral-500">
            {ne
              ? 'तपाईंको ब्राउजरले वेब अडियो समर्थन गर्दैन, त्यसैले परिवेश ध्वनि उपलब्ध छैन।'
              : 'Your browser does not support Web Audio, so live ambience is unavailable.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {AMBIENT_LAYERS.map((layer) => {
              const on = ambient.isActive(layer.id);
              const volume = ambient.volumeOf(layer.id);

              return (
                <div
                  key={layer.id}
                  className={`group relative overflow-hidden rounded-2xl border p-3.5 transition-all duration-300 ease-out ${
                    on
                      ? 'border-red-500/70 bg-red-600/10 ring-1 ring-red-500/40 shadow-lg shadow-red-600/10'
                      : 'border-white/10 bg-black/60 hover:border-white/25 hover:-translate-y-0.5'
                  }`}
                >
                  <span
                    className="pointer-events-none absolute -bottom-3 -right-1 text-5xl opacity-[0.08] select-none"
                    aria-hidden="true"
                  >
                    {layer.icon}
                  </span>

                  <button
                    type="button"
                    onClick={() => ambient.toggle(layer.id)}
                    aria-pressed={on}
                    className="relative w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg"
                  >
                    <span className="text-2xl leading-none">{layer.icon}</span>
                    <h4 className="mt-2 text-xs font-semibold text-white truncate">
                      {ne ? layer.nameNe : layer.name}
                    </h4>
                    <p className="mt-0.5 text-xs text-white/50 leading-snug line-clamp-2 font-nepali">
                      {ne ? layer.blurbNe : layer.blurb}
                    </p>
                    <span
                      className={`mt-2 inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider transition-colors duration-200 ${
                        on ? 'text-red-400' : 'text-neutral-500 group-hover:text-red-400'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'}`} />
                      {on ? (ne ? 'सक्रिय' : 'Mixing') : (ne ? 'थप्नुहोस्' : 'Add layer')}
                    </span>
                  </button>

                  {on && (
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => ambient.setVolume(layer.id, Number(e.target.value))}
                      aria-label={`${layer.name} volume`}
                      className="relative mt-2 w-full h-1 accent-red-500 cursor-pointer"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {ambient.supported && (
          <p className="mt-3 px-1 text-[11px] text-neutral-600 font-nepali">
            {ne
              ? 'परिवेश ध्वनिहरू संगीतमाथि तह-तह भई बज्छन् — एउटा वा धेरै मिलाउनुहोस्।'
              : 'Ambience layers stack on top of the music — mix one or many.'}
          </p>
        )}
      </div>
    </div>
  );
};
