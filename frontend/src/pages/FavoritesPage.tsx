import React, { useState, useEffect } from 'react';
import { FavoriteItem } from '../types';
import { SongCard } from '../components/SongCard';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import { Heart, Play } from 'lucide-react';

export const FavoritesPage: React.FC = () => {
  const { t } = useI18n();
  const { playSong } = usePlayer();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await api.getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to load favorites', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleFavoriteChange = (songId: number, isFav: boolean) => {
    if (!isFav) {
      setFavorites((prev) => prev.filter((f) => f.song.id !== songId));
    }
  };

  const handlePlayAll = () => {
    if (favorites.length > 0) {
      const songList = favorites.map((f) => f.song);
      playSong(songList[0], undefined, songList);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">
            <Heart className="w-3.5 h-3.5 fill-red-600 text-red-600" />
            <span>SAVED COLLECTION</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            {t.favorites.title}
          </h1>
          <p className="text-xs text-neutral-500 font-nepali mt-1">
            तपाईंले सुरक्षित गर्नुभएका मनपर्ने नेपाली गीतहरू
          </p>
        </div>

        {favorites.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-xs tracking-wide transition-all duration-200 hover:scale-105 active:scale-95 self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play All ({favorites.length})</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 bg-white/3 rounded-2xl border border-white/8 p-8 max-w-md mx-auto">
          <Heart className="w-12 h-12 text-red-600/40 mx-auto mb-4" />
          <h3 className="font-serif text-xl font-bold text-white mb-2">
            कुनै मनपरेको गीत फेला परेन
          </h3>
          <p className="text-xs text-neutral-500 font-nepali leading-relaxed mb-6">
            {t.favorites.empty}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map((fav) => (
            <SongCard
              key={fav.id}
              song={fav.song}
              isFavorited={true}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
