import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useI18n } from '../context/I18nContext';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, ListMusic, Maximize2, Minimize2, AlertCircle, Music
} from 'lucide-react';

export const Player: React.FC = () => {
  const {
    currentSong,
    currentStation,
    status,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    queue,
    errorMessage,
    isExpanded,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
    setVolumeLevel,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    setIsExpanded,
    setIsQueueOpen,
    clearError,
  } = usePlayer();

  const { locale, t } = useI18n();
  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeeking(true);
    setSeekValue(parseFloat(e.target.value));
  };

  const handleSeekCommit = () => {
    setSeeking(false);
    seekTo(seekValue);
  };

  const currentDisplayTime = seeking ? seekValue : currentTime;
  const progressPercent = duration > 0 ? (currentDisplayTime / duration) * 100 : 0;

  return (
    <>
      {/* Permanent YouTube Iframe Container - NEVER conditionally unmounted */}
      <div
        className={
          isExpanded && currentSong
            ? 'fixed z-[60] left-1/2 -translate-x-1/2 top-[calc(env(safe-area-inset-top)+5rem)] md:top-24 w-[90vw] max-w-4xl aspect-video max-h-[55vh] rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl transition-all duration-300 pointer-events-auto'
            : 'fixed bottom-2 right-2 w-[240px] h-[135px] opacity-0 pointer-events-none -z-50 transition-all duration-300'
        }
      >
        <div id="purano-dhun-yt-iframe-slot" className="w-full h-full" />
      </div>

      {/* Expanded Cinematic View Modal */}
      {isExpanded && currentSong && (
        <div className="fixed inset-0 z-50 bg-ink-950/95 backdrop-blur-xl flex flex-col justify-between overflow-y-auto px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] md:px-8 md:pt-8 md:pb-8 animate-in fade-in">
          
          {/* Header */}
          <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <div className="text-left">
                <span className="text-xs uppercase font-mono tracking-wider text-neutral-400">
                  {t.player.station}: {locale === 'ne' ? currentStation?.title_ne || currentStation?.title : currentStation?.title}
                </span>
                <p className="text-[11px] text-cream-400/60 font-nepali">
                  {currentStation?.tagline}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10"
              aria-label="Minimize player"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Central Stage: Space reserved for YouTube Player Video Frame */}
          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center my-6">
            <div className="w-full aspect-video max-h-[55vh] pointer-events-none opacity-0" />

            {/* Song Meta Under Video */}
            <div className="text-center mt-6">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-cream-100 mb-1">
                {locale === 'ne' ? currentSong.title_ne || currentSong.title : currentSong.title}
              </h2>
              <p className="font-nepali text-neutral-400 text-lg">
                {locale === 'ne' ? currentSong.artist_name_ne || currentSong.artist_name : currentSong.artist_name}
              </p>
              <p className="text-xs text-cream-400/60 font-mono mt-1">
                {currentSong.attribution}
              </p>
            </div>
          </div>

          {/* Expanded Bottom Controls Container */}
          <div className="max-w-3xl mx-auto w-full space-y-4">
            {/* Seek bar */}
            <div className="flex items-center gap-3 text-xs font-mono text-cream-400">
              <span>{formatTime(currentDisplayTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentDisplayTime}
                onChange={handleSeekChange}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                className="flex-1 accent-red-600 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                aria-label="Seek time"
              />
              <span>{formatTime(duration)}</span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={toggleShuffle}
                className={`p-2.5 rounded-xl border transition-all ${
                  isShuffle ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-white/10 text-neutral-500 hover:text-white'
                }`}
                title={t.player.shuffle}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={prevTrack}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
                title={t.player.prev}
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-5 rounded-full bg-red-600 text-white hover:bg-red-500 shadow-glow-red transition-all"
                title={status === 'playing' ? t.player.pause : t.player.play}
              >
                {status === 'playing' ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current translate-x-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
                title={t.player.next}
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>

              <button
                onClick={cycleRepeatMode}
                className={`p-2.5 rounded-xl border transition-all ${
                  repeatMode !== 'off' ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-white/10 text-neutral-500 hover:text-white'
                }`}
                title={t.player.repeat}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Audio Player Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-black/98 backdrop-blur-md border-t border-white/8 shadow-2xl pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${
          currentSong ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
      >

        {/* Playback Error Banner if present */}
        {errorMessage && (
          <div className="bg-red-950/90 text-white border-b border-red-500/40 px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={nextTrack} className="underline hover:text-white font-semibold">
                Skip to next
              </button>
              <button onClick={clearError} className="px-2 py-0.5 bg-black/50 rounded text-[11px]">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Progress scrub bar — 16px tall hit area so it is easy to drag on touch screens */}
        <div className="relative w-full h-4 flex items-center group cursor-pointer">
          <div className="w-full h-0.5 bg-white/5 relative">
            <div
              className="h-full bg-red-600 transition-all duration-200 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentDisplayTime}
            onChange={handleSeekChange}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Seek bar"
          />
        </div>

        {/* Main Player Row */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-3.5 grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-4">
          
          {/* Left: Track Information */}
          <div className="flex items-center gap-3.5 min-w-0 sm:justify-start justify-center sm:order-1 order-2">
            <div className="w-12 h-12 rounded-xl border border-white/10 flex-shrink-0 relative overflow-hidden bg-black shadow-md">
              {currentSong ? (
                <img
                  src={currentSong.artwork_url || `https://img.youtube.com/vi/${currentSong.provider_video_id}/hqdefault.jpg`}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black text-neutral-600">
                  <Music className="w-5 h-5" />
                </div>
              )}
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-serif text-sm font-black text-white truncate drop-shadow-sm">
                  {currentSong
                    ? (locale === 'ne' ? currentSong.title_ne || currentSong.title : currentSong.title)
                    : 'Purano Dhun'}
                </h4>
              </div>
              <p className="text-xs text-neutral-500 font-nepali truncate">
                {currentSong
                  ? (locale === 'ne' ? currentSong.artist_name_ne || currentSong.artist_name : currentSong.artist_name)
                  : ''}
              </p>
              {currentStation && (
                <span className="text-[10px] text-cream-300/80 font-medium truncate block">
                  {locale === 'ne' ? currentStation.title_ne : currentStation.title}
                </span>
              )}
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex flex-col items-center gap-1 sm:order-2 order-1">
            <div className="flex items-center gap-2.5 sm:gap-4">
              
              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-full transition-all duration-300 ease-out hover:scale-105 active:scale-95 hidden sm:block ${
                  isShuffle ? 'text-red-400 bg-red-600/20 border border-red-500/40' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                title={t.player.shuffle}
                aria-label={t.player.shuffle}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Prev */}
              <button
                onClick={prevTrack}
                className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 ease-out active:scale-90"
                title={t.player.prev}
                aria-label={t.player.prev}
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              {/* Play / Pause button */}
              <button
                onClick={togglePlayPause}
                className="p-3 sm:p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-glow-red border border-red-500/50 transition-all duration-300 ease-out hover:scale-105 active:scale-95"
                title={status === 'playing' ? t.player.pause : t.player.play}
                aria-label={status === 'playing' ? t.player.pause : t.player.play}
              >
                {status === 'playing' ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current translate-x-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={nextTrack}
                className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 ease-out active:scale-90"
                title={t.player.next}
                aria-label={t.player.next}
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              {/* Repeat */}
              <button
                onClick={cycleRepeatMode}
                className={`p-2 rounded-full transition-all duration-300 ease-out hover:scale-105 active:scale-95 hidden sm:block ${
                  repeatMode !== 'off' ? 'text-red-400 bg-red-600/20 border border-red-500/40' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                title={t.player.repeat}
                aria-label={t.player.repeat}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>

            {/* Timers */}
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-cream-400 font-medium">
              <span className="text-white">{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume, Queue Drawer, and Expand */}
          <div className="flex items-center gap-3 sm:justify-end justify-center sm:order-3 order-3">
            
            {/* Volume slider */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolumeLevel(parseInt(e.target.value))}
                className="w-20 accent-red-600 h-1 bg-white/10 rounded cursor-pointer"
                aria-label="Volume slider"
              />
            </div>

            {/* Queue Drawer toggle */}
            <button
              onClick={() => setIsQueueOpen(true)}
              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 relative"
              title={t.player.queue}
              aria-label={t.player.queue}
            >
              <ListMusic className="w-4 h-4" />
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center">
                  {queue.length}
                </span>
              )}
            </button>

            {/* Expand / Minimize toggle */}
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10"
              title="Expand player"
              aria-label="Expand player"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </>
  );
};
