import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Song, Station, PlaybackStatus, RepeatMode } from '../types';
import { api } from '../services/api';

// YouTube IFrame Player API declarations
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  cueVideoById: (videoId: string) => void;
  destroy: () => void;
}

interface PlayerContextType {
  currentSong: Song | null;
  currentStation: Station | null;
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: Song[];
  history: Song[];
  errorMessage: string | null;
  isExpanded: boolean;
  isQueueOpen: boolean;
  playSong: (song: Song, station?: Station, newQueue?: Song[]) => void;
  playStation: (station: Station, startSong?: Song) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolumeLevel: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setIsExpanded: (expanded: boolean) => void;
  setIsQueueOpen: (open: boolean) => void;
  clearError: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>('unstarted');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<Song[]>([]);
  const [history, setHistory] = useState<Song[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  // Mirror volume/mute into refs so the one-time player-init effect (which only
  // re-runs on track change) reads the *current* values instead of a stale
  // render's closure. Without this, a volume/mute change made just before a
  // track change would be applied from the old value.
  const volumeRef = useRef<number>(volume);
  const isMutedRef = useRef<boolean>(isMuted);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  const consecutiveErrorsRef = useRef<number>(0);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const isApiReadyRef = useRef<boolean>(false);
  const containerId = 'bajeko-chiya-pasal-yt-iframe-slot';

  // Listener intent + background-safe state. `wantsPlaybackRef` survives screen
  // locks and tab switches so we know whether audio should still be running when
  // the page is backgrounded, unlocked, or restored from the back/forward cache.
  const wantsPlaybackRef = useRef<boolean>(false);
  const hiddenAtRef = useRef<number>(0);
  const actionsRef = useRef<{
    togglePlayPause: () => void;
    toggleMute: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    seekTo: (seconds: number) => void;
  }>({
    togglePlayPause: () => undefined,
    toggleMute: () => undefined,
    nextTrack: () => undefined,
    prevTrack: () => undefined,
    seekTo: () => undefined,
  });

  // Load YouTube IFrame Player API script safely once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      isApiReadyRef.current = true;
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      isApiReadyRef.current = true;
    };
  }, []);

  // Update playback time tracker ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (status === 'playing') {
      interval = setInterval(() => {
        if (ytPlayerRef.current) {
          try {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setCurrentTime(cur);
            if (dur > 0) setDuration(dur);
          } catch {
            // ignore
          }
        }
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // Handle Track Advancement
  const nextTrack = useCallback(() => {
    if (!currentSong) return;

    if (repeatMode === 'one') {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.seekTo(0, true);
        ytPlayerRef.current.playVideo();
        return;
      }
    }

    if (queue.length === 0) {
      if (repeatMode === 'all' && history.length > 0) {
        // Reset queue from history
        const resetQueue = [...history, currentSong];
        const next = resetQueue[0];
        setHistory([]);
        setQueue(resetQueue.slice(1));
        setCurrentSong(next);
        return;
      }
      setStatus('paused');
      return;
    }

    let nextIndex = 0;
    if (isShuffle && queue.length > 1) {
      nextIndex = Math.floor(Math.random() * queue.length);
    }

    const nextSong = queue[nextIndex];
    const newQueue = queue.filter((_, idx) => idx !== nextIndex);

    setHistory((prev) => [currentSong, ...prev.slice(0, 19)]);
    setQueue(newQueue);
    setCurrentSong(nextSong);
  }, [currentSong, queue, history, isShuffle, repeatMode]);

  const prevTrack = useCallback(() => {
    if (currentTime > 5 && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(0, true);
      return;
    }

    if (history.length > 0) {
      const prevSong = history[0];
      const newHistory = history.slice(1);
      if (currentSong) {
        setQueue((prev) => [currentSong, ...prev]);
      }
      setHistory(newHistory);
      setCurrentSong(prevSong);
    } else if (ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(0, true);
    }
  }, [currentTime, history, currentSong]);

  // Initializing or changing video in YouTube Player
  useEffect(() => {
    if (!currentSong) return;

    setErrorMessage(null);
    setCurrentTime(0);

    const initOrLoad = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initOrLoad, 150);
        return;
      }

      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        try {
          ytPlayerRef.current.loadVideoById(currentSong.provider_video_id);
          ytPlayerRef.current.setVolume(volumeRef.current);
          if (isMutedRef.current) {
            ytPlayerRef.current.mute();
          } else {
            ytPlayerRef.current.unMute();
          }
          ytPlayerRef.current.playVideo();
        } catch {
          // recreate if stale
          createPlayer();
        }
      } else {
        createPlayer();
      }
    };

    const createPlayer = () => {
      const container = document.getElementById(containerId);
      if (!container) {
        setTimeout(createPlayer, 100);
        return;
      }

      try {
        ytPlayerRef.current = new window.YT.Player(containerId, {
          height: '100%',
          width: '100%',
          videoId: currentSong.provider_video_id,
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: (evt) => {
              evt.target.setVolume(volumeRef.current);
              if (isMutedRef.current) {
                evt.target.mute();
              } else {
                evt.target.unMute();
              }
              evt.target.playVideo();
            },
            onStateChange: (evt) => {
              const state = evt.data;
              if (state === window.YT.PlayerState.PLAYING) {
                setStatus('playing');
                wantsPlaybackRef.current = true;
                consecutiveErrorsRef.current = 0;
                api.logPlaybackEvent({ event_type: 'start', song: currentSong.id, station: currentStation?.id });
              } else if (state === window.YT.PlayerState.PAUSED) {
                setStatus('paused');
                // A pause observed while the page is visible is almost always the
                // listener's own action (our bar, the embed controls, or a
                // lock-screen press routed to us) — honour it. A pause right after
                // the screen goes off is usually the mobile browser throttling the
                // embed, so keep the intent and resume once it is back in the
                // foreground or while it retries in the background.
                const hiddenForMs = hiddenAtRef.current > 0 ? Date.now() - hiddenAtRef.current : 0;
                if (document.visibilityState === 'visible' || hiddenForMs > 6000) {
                  wantsPlaybackRef.current = false;
                }
              } else if (state === window.YT.PlayerState.BUFFERING) {
                setStatus('buffering');
              } else if (state === window.YT.PlayerState.ENDED) {
                wantsPlaybackRef.current = false;
                setStatus('ended');
                api.logPlaybackEvent({ event_type: 'complete', song: currentSong.id, station: currentStation?.id });
                actionsRef.current.nextTrack();
              }
            },
            onError: (evt) => {
              setStatus('error');
              consecutiveErrorsRef.current += 1;
              const errorCodes: Record<number, string> = {
                2: 'Invalid video parameter',
                5: 'HTML5 player playback error',
                100: 'Track not found or marked private on YouTube',
                101: 'Publisher restricted embedded playback',
                150: 'Publisher restricted embedded playback',
              };
              const errorReason = errorCodes[evt.data] || `Error code ${evt.data}`;
              const errorText = `Track unavailable (${errorReason}). Skipping to next track...`;
              setErrorMessage(errorText);

              api.logPlaybackEvent({
                event_type: 'error',
                song: currentSong.id,
                station: currentStation?.id,
                error_message: errorText,
              });

              // Auto advance quickly to next song in station queue
              if (consecutiveErrorsRef.current <= 5 && queue.length > 0) {
                setTimeout(() => {
                  actionsRef.current.nextTrack();
                }, 1500);
              } else {
                setErrorMessage('Selected track could not be loaded. Please choose another station or song.');
              }
            },
          },
        });
      } catch (err) {
        console.error('Error creating YouTube player instance', err);
      }
    };

    initOrLoad();
    // Deliberately keyed on the song id only: re-running on volume/mute/queue
    // changes would reload the video and restart playback. Volume/mute are read
    // through refs (above) and track advancement goes through actionsRef, so the
    // closures stay current without extra dependencies.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id]);

  const playSong = (song: Song, station?: Station, newQueue?: Song[]) => {
    consecutiveErrorsRef.current = 0;
    wantsPlaybackRef.current = true;
    setCurrentSong(song);
    if (station) setCurrentStation(station);
    if (newQueue) {
      setQueue(newQueue.filter((s) => s.id !== song.id));
    }
  };

  const playStation = async (station: Station, startSong?: Song) => {
    consecutiveErrorsRef.current = 0;
    setCurrentStation(station);

    try {
      const details = await api.getStationDetail(station.slug);
      const stationSongs = details.station_songs?.map((ss) => ss.song) || [];

      if (stationSongs.length === 0) {
        setErrorMessage('This station currently has no active published tracks.');
        return;
      }

      const songToPlay = startSong || stationSongs[0];
      const remainingQueue = stationSongs.filter((s) => s.id !== songToPlay.id);

      wantsPlaybackRef.current = true;
      setCurrentSong(songToPlay);
      setQueue(remainingQueue);
    } catch {
      setErrorMessage('Could not load station tracklist.');
    }
  };

  const togglePlayPause = () => {
    if (!ytPlayerRef.current) return;
    try {
      if (status === 'playing') {
        wantsPlaybackRef.current = false;
        ytPlayerRef.current.pauseVideo();
        setStatus('paused');
      } else {
        wantsPlaybackRef.current = true;
        ytPlayerRef.current.playVideo();
        setStatus('playing');
      }
    } catch {
      // player might be busy
    }
  };

  const seekTo = (seconds: number) => {
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(seconds, true);
        setCurrentTime(seconds);
      } catch {
        // ignore
      }
    }
  };

  const setVolumeLevel = (vol: number) => {
    setVolumeState(vol);
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume(vol);
        if (vol > 0 && isMuted) {
          ytPlayerRef.current.unMute();
          setIsMuted(false);
        }
      } catch {
        // ignore
      }
    }
  };

  const toggleMute = () => {
    if (!ytPlayerRef.current) return;
    try {
      if (isMuted) {
        ytPlayerRef.current.unMute();
        setIsMuted(false);
      } else {
        ytPlayerRef.current.mute();
        setIsMuted(true);
      }
    } catch {
      // ignore
    }
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const cycleRepeatMode = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  const clearError = () => {
    setErrorMessage(null);
  };

  // Keep actionsRef fresh so the one-time Media Session listeners below always
  // call the latest closures.
  useEffect(() => {
    actionsRef.current = { togglePlayPause, toggleMute, nextTrack, prevTrack, seekTo };
  });

  // ---------------------------------------------------------------------------
  // Background / lock-screen playback (mobile)
  // ---------------------------------------------------------------------------
  // Mobile browsers occasionally pause an embedded player right after the page
  // is hidden or the screen locks. As long as the listener still wants audio,
  // re-issue a play command whenever the page is hidden, shown, restored from
  // the back/forward cache, or refocused (a harmless no-op when playback never
  // stopped) so audio keeps playing with the phone locked.
  useEffect(() => {
    const resumeIfWanted = () => {
      if (!wantsPlaybackRef.current || !ytPlayerRef.current) return;
      try {
        ytPlayerRef.current.playVideo();
      } catch {
        // player still initialising — a later event will catch up
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        resumeIfWanted();
        // Retry shortly after: some mobile UAs pause the embed a beat after the
        // screen goes off (background timers are throttled but still fire).
        window.setTimeout(resumeIfWanted, 400);
        window.setTimeout(resumeIfWanted, 2500);
      } else {
        hiddenAtRef.current = 0;
        resumeIfWanted();
      }
    };

    const handleResume = () => {
      hiddenAtRef.current = 0;
      resumeIfWanted();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handleResume);
    window.addEventListener('focus', handleResume);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, []);

  // Media Session API: artwork + transport controls on Android/iOS lock screens,
  // notification shades, Bluetooth headsets, Android Auto and wearables.
  useEffect(() => {
    const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined;
    if (!ms) return;

    const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        // action not supported by this browser
      }
    };

    setHandler('play', () => {
      wantsPlaybackRef.current = true;
      try {
        ytPlayerRef.current?.playVideo();
        setStatus('playing');
      } catch {
        // ignore
      }
    });
    setHandler('pause', () => {
      wantsPlaybackRef.current = false;
      try {
        ytPlayerRef.current?.pauseVideo();
        setStatus('paused');
      } catch {
        // ignore
      }
    });
    setHandler('stop', () => {
      wantsPlaybackRef.current = false;
      try {
        ytPlayerRef.current?.pauseVideo();
      } catch {
        // ignore
      }
    });
    setHandler('previoustrack', () => actionsRef.current.prevTrack());
    setHandler('nexttrack', () => actionsRef.current.nextTrack());
    setHandler('seekbackward', (details) => {
      const offset = details.seekOffset || 10;
      try {
        const player = ytPlayerRef.current;
        if (player) player.seekTo(Math.max(0, player.getCurrentTime() - offset), true);
      } catch {
        // ignore
      }
    });
    setHandler('seekforward', (details) => {
      const offset = details.seekOffset || 10;
      try {
        const player = ytPlayerRef.current;
        if (player) player.seekTo(Math.min(player.getDuration() || Number.MAX_SAFE_INTEGER, player.getCurrentTime() + offset), true);
      } catch {
        // ignore
      }
    });
    setHandler('seekto', (details) => {
      if (typeof details.seekTime !== 'number') return;
      try {
        ytPlayerRef.current?.seekTo(details.seekTime, true);
      } catch {
        // ignore
      }
    });

    return () => {
      const actions: MediaSessionAction[] = [
        'play', 'pause', 'stop', 'previoustrack', 'nexttrack',
        'seekbackward', 'seekforward', 'seekto',
      ];
      actions.forEach((action) => setHandler(action, null));
    };
  }, []);

  // Publish now-playing metadata + playback state for lock screens.
  useEffect(() => {
    const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined;
    if (!ms) return;

    if (!currentSong) {
      ms.metadata = null;
      ms.playbackState = 'none';
      return;
    }

    const thumb = `https://img.youtube.com/vi/${currentSong.provider_video_id}/hqdefault.jpg`;
    try {
      if (typeof MediaMetadata !== 'undefined') {
        ms.metadata = new MediaMetadata({
          title: currentSong.title_ne || currentSong.title,
          artist: currentSong.artist_name_ne || currentSong.artist_name,
          album: currentStation ? currentStation.title_ne || currentStation.title : 'Bajeko Chiya Pasal',
          artwork: [
            { src: currentSong.artwork_url || thumb, sizes: '480x360', type: 'image/jpeg' },
            { src: thumb, sizes: '480x360', type: 'image/jpeg' },
            { src: `https://img.youtube.com/vi/${currentSong.provider_video_id}/maxresdefault.jpg`, sizes: '1280x720', type: 'image/jpeg' },
          ],
        });
      }
    } catch {
      // MediaMetadata unsupported — lock screen falls back to the page title
    }

    ms.playbackState = status === 'playing' ? 'playing' : status === 'unstarted' ? 'none' : 'paused';
  }, [currentSong, currentStation, status]);

  // Keep the lock-screen seek bar in sync (best effort; some UAs throw on
  // invalid values, so every call is guarded).
  useEffect(() => {
    const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined;
    if (!ms || typeof ms.setPositionState !== 'function') return;
    if (!currentSong || !Number.isFinite(duration) || duration <= 0) return;
    try {
      ms.setPositionState({
        duration,
        position: Math.min(Math.max(currentTime, 0), duration),
        playbackRate: 1,
      });
    } catch {
      // invalid values for this user agent — ignore
    }
  }, [currentSong, currentTime, duration]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        actionsRef.current.togglePlayPause();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        actionsRef.current.nextTrack();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        actionsRef.current.prevTrack();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        actionsRef.current.toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
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
        history,
        errorMessage,
        isExpanded,
        isQueueOpen,
        playSong,
        playStation,
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
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
