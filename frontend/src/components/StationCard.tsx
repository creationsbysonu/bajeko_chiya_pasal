import React from 'react';
import { Station } from '../types';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { Play, Volume2, Sparkles, Coffee, Bus, Mountain, Flame, Heart, Radio, Sun } from 'lucide-react';

interface StationCardProps {
  station: Station;
}

export const StationCard: React.FC<StationCardProps> = ({ station }) => {
  const { locale, t } = useI18n();
  const { currentStation, playStation, status } = usePlayer();

  const isCurrent = currentStation?.slug === station.slug;
  const isPlaying = isCurrent && status === 'playing';

  // Cultural icon selector
  const getAmbientIcon = (type: string) => {
    switch (type) {
      case 'teashop_rain':
        return Coffee;
      case 'bus_highway':
        return Bus;
      case 'mountain_wind':
        return Mountain;
      case 'temple_bells':
        return Sun;
      case 'gentle_breeze':
        return Heart;
      case 'tape_hiss':
        return Flame;
      default:
        return Radio;
    }
  };

  const AmbientIcon = getAmbientIcon(station.ambient_type);
  const coverUrl = station.cover_image || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80';

  return (
    <div
      className={`group relative rounded-2xl bg-black/60 backdrop-blur-md border transition-all duration-300 ease-out overflow-hidden flex flex-col justify-between hover:-translate-y-1 ${
        isCurrent
          ? 'border-red-500 shadow-glow-red ring-1 ring-red-500'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* 1. Photographic Cover Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/90">
        <img
          src={coverUrl}
          alt={station.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.85] group-hover:brightness-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

        {/* Ambient Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono text-neutral-400 border border-white/10 font-bold">
            <AmbientIcon className="w-3 h-3 text-red-500" />
            <span>{station.ambient_type.replace('_', ' ').toUpperCase()}</span>
          </span>
        </div>

        {/* Track count badge */}
        {station.songs_count !== undefined && (
          <div className="absolute top-2.5 right-2.5 text-[10px] font-mono text-white/80 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10 z-10">
            {station.songs_count} tracks
          </div>
        )}

        {/* Center Hover Play Button */}
        <button
          onClick={() => playStation(station)}
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isPlaying ? 'opacity-100 bg-black/40' : 'opacity-0 group-hover:opacity-100 bg-black/30'
          }`}
          aria-label={isPlaying ? 'Pause station' : 'Play station'}
        >
          <div className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-glow-red hover:scale-110 active:scale-95 transition-all duration-200">
            {isPlaying ? (
              <Volume2 className="w-4 h-4 text-white animate-pulse" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            )}
          </div>
        </button>
      </div>

      {/* 2. Metadata Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors duration-150 mb-0.5">
            {locale === 'ne' ? station.title_ne || station.title : station.title}
          </h3>
          <p className="font-nepali text-xs text-neutral-500 mb-2">
            {locale === 'ne' ? station.title : station.title_ne}
          </p>

          <p className="text-xs text-white/70 font-nepali line-clamp-2 leading-relaxed mb-4">
            {locale === 'ne' ? station.description_ne || station.description : station.description}
          </p>
        </div>

        {/* Action Button Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-mono">
            <Sparkles className="w-3 h-3 text-red-500" />
            <span>CONTINUOUS</span>
          </div>

          <button
            onClick={() => playStation(station)}
            className={`flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${
              isCurrent
                ? 'bg-red-600 text-white shadow-glow-red border border-red-400 font-bold'
                : 'bg-white/5 hover:bg-red-600 hover:text-white text-white/80 border border-white/10 hover:border-red-500'
            }`}
          >
            {isPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 animate-pulse text-white" />
                <span>Playing</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t.stations.listenNow}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
