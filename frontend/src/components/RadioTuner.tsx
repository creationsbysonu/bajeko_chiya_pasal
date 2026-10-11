import React from 'react';
import { Station } from '../types';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Sparkles } from 'lucide-react';

interface RadioTunerProps {
  stations: Station[];
}

export const RadioTuner: React.FC<RadioTunerProps> = ({ stations }) => {
  const { locale } = useI18n();
  const { currentStation, playStation, togglePlayPause, status } = usePlayer();

  const activeStation = currentStation || stations[0];
  const isPlaying = status === 'playing' && currentStation?.slug === activeStation?.slug;

  const handleStagePlayToggle = () => {
    if (currentStation?.slug === activeStation?.slug) {
      togglePlayPause();
    } else if (activeStation) {
      playStation(activeStation);
    }
  };

  if (!activeStation) return null;

  const coverUrl = activeStation.cover_image || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="my-10 max-w-6xl mx-auto space-y-6">
      
      {/* 1. Cinematic Featured Soundscape Stage */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl group">
        
        {/* Photographic Background with Atmospheric Gradient */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
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
        <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-between z-10">
          
          {/* Top Bar: Ambient pill & Live Status */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 shadow-glow-red animate-pulse' : 'bg-neutral-600'}`} />
              <span className="font-mono text-[10px] tracking-widest uppercase text-neutral-500 font-bold">
                {activeStation.ambient_type.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-white/30">•</span>
              <span className="text-[11px] font-mono text-white/80">
                CH-{(activeStation.display_order + 1).toString().padStart(2, '0')}
              </span>
            </div>

            {isPlaying && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-950/80 backdrop-blur-md border border-red-500/40 text-[10px] font-mono tracking-widest text-red-300 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping mr-1" />
                NOW STREAMING
              </div>
            )}
          </div>

          {/* Bottom Stage: Title, Description & Action */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="max-w-xl space-y-2">
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight drop-shadow">
                {locale === 'ne' ? activeStation.title_ne || activeStation.title : activeStation.title}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 font-nepali">
                {locale === 'ne' ? activeStation.title : activeStation.title_ne}
              </p>
              <p className="text-xs sm:text-sm text-white/80 font-nepali leading-relaxed line-clamp-2">
                {locale === 'ne' ? activeStation.description_ne || activeStation.description : activeStation.description}
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
                    <span>Tune In Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Soundscape Selector Thumbnails */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[10px] uppercase tracking-widest font-mono text-neutral-500 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>ATMOSPHERIC SOUNDSCAPES • सांगीतिक परिवेश</span>
          </p>
          <span className="text-xs text-white/50 font-nepali">
            क्लिक गरी परिवेश परिवर्तन गर्नुहोस्
          </span>
        </div>

        {/* Thumbnail Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {stations.map((st) => {
            const isSelected = activeStation.slug === st.slug;
            const thumbUrl = st.cover_image || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80';

            return (
              <button
                key={st.slug}
                onClick={() => playStation(st)}
                className={`relative rounded-2xl overflow-hidden text-left border transition-all duration-300 ease-out group hover:scale-[1.02] active:scale-[0.98] ${
                  isSelected
                    ? 'border-red-500 shadow-glow-red ring-1 ring-red-500'
                    : 'border-white/10 hover:border-white/20 bg-black/60'
                }`}
              >
                {/* Image Aspect ratio container */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/80">
                  <img
                    src={thumbUrl}
                    alt={st.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-glow-red animate-pulse" />
                  )}
                </div>

                {/* Thumbnail Metadata */}
                <div className="p-3 bg-black/90">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase mb-0.5">
                    CH-{(st.display_order + 1).toString().padStart(2, '0')}
                  </div>
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-red-400 transition-colors duration-150">
                    {locale === 'ne' ? st.title_ne || st.title : st.title}
                  </h4>
                  <p className="text-[10px] text-white/60 truncate mt-0.5 font-nepali">
                    {locale === 'ne' ? st.tagline_ne || st.tagline : st.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
