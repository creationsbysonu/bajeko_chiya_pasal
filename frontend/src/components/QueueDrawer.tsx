import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useI18n } from '../context/I18nContext';
import { X, Play, ListMusic, History, Sparkles } from 'lucide-react';
import { Song } from '../types';

export const QueueDrawer: React.FC = () => {
  const {
    isQueueOpen,
    setIsQueueOpen,
    currentSong,
    currentStation,
    queue,
    history,
    playSong,
  } = usePlayer();
  const { locale, t } = useI18n();

  if (!isQueueOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/80 backdrop-blur-md animate-in fade-in pd-veil">
      <div className="w-full max-w-md bg-black border-l border-white/10 h-full flex flex-col shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2.5">
            <ListMusic className="w-5 h-5 text-red-500" />
            <h3 className="font-serif text-lg font-bold text-white">
              {t.player.queue}
            </h3>
            {queue.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold shadow-sm">
                {queue.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsQueueOpen(false)}
            className="p-2.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
            aria-label="Close queue"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Active Now Playing Track */}
          {currentSong && (
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5 text-red-500" />
                <span>{t.player.nowPlaying}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-red-500/40 flex items-center gap-3.5 shadow-glow-red">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10">
                  <img
                    src={currentSong.artwork_url || `https://img.youtube.com/vi/${currentSong.provider_video_id}/hqdefault.jpg`}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif font-bold text-sm text-white truncate">
                    {locale === 'ne' ? currentSong.title_ne || currentSong.title : currentSong.title}
                  </h4>
                  <p className="text-xs text-neutral-500 font-nepali truncate">
                    {locale === 'ne' ? currentSong.artist_name_ne || currentSong.artist_name : currentSong.artist_name}
                  </p>
                  {currentStation && (
                    <span className="inline-block mt-0.5 text-xs text-white/50 font-mono truncate">
                      Station: {currentStation.title}
                    </span>
                  )}
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-glow-red animate-pulse flex-shrink-0" />
              </div>
            </div>
          )}

          {/* Up Next in Queue */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                Up Next ({queue.length})
              </span>
            </div>

            {queue.length === 0 ? (
              <p className="text-xs text-white/50 font-nepali py-3 text-center bg-white/[0.02] rounded-xl border border-white/5">
                {t.player.emptyQueue}
              </p>
            ) : (
              <div className="space-y-2">
                {queue.map((song: Song, idx: number) => (
                  <div
                    key={`${song.id}-${idx}`}
                    onClick={() => playSong(song, currentStation || undefined)}
                    className="p-2.5 rounded-xl bg-black hover:bg-white/5 border border-white/8 hover:border-white/15 flex items-center justify-between cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-white/40 w-4 text-center">
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10">
                        <img
                          src={song.artwork_url || `https://img.youtube.com/vi/${song.provider_video_id}/hqdefault.jpg`}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-medium text-white group-hover:text-red-400 transition-colors duration-150 truncate">
                          {locale === 'ne' ? song.title_ne || song.title : song.title}
                        </h5>
                        <p className="text-xs text-white/60 font-nepali truncate">
                          {locale === 'ne' ? song.artist_name_ne || song.artist_name : song.artist_name}
                        </p>
                      </div>
                    </div>
                    <Play className="w-3.5 h-3.5 text-neutral-600 group-hover:text-red-500 flex-shrink-0 ml-2 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Played History */}
          {history.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">
                <History className="w-3.5 h-3.5 text-neutral-500" />
                <span>Recently Played ({history.length})</span>
              </div>
              <div className="space-y-2">
                {history.map((song: Song, idx: number) => (
                  <div
                    key={`hist-${song.id}-${idx}`}
                    onClick={() => playSong(song, currentStation || undefined)}
                    className="p-2 rounded-lg bg-black hover:bg-white/5 border border-white/5 hover:border-white/10 flex items-center justify-between cursor-pointer group transition-all duration-200"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10">
                        <img
                          src={song.artwork_url || `https://img.youtube.com/vi/${song.provider_video_id}/hqdefault.jpg`}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs text-white/60 group-hover:text-neutral-300 truncate">
                          {locale === 'ne' ? song.title_ne || song.title : song.title}
                        </h5>
                        <p className="text-xs text-white/40 truncate">
                          {song.artist_name}
                        </p>
                      </div>
                    </div>
                    <Play className="w-3 h-3 text-neutral-600 group-hover:text-red-500 flex-shrink-0 ml-2 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
