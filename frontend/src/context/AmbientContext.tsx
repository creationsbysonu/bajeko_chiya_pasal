import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AMBIENT_LAYERS, ambientEngine } from '../services/ambient';

const ACTIVE_KEY = 'pd-ambient-active';
const VOLUMES_KEY = 'pd-ambient-volumes';
const MASTER_KEY = 'pd-ambient-master';

const DEFAULT_VOLUME = 0.7;

interface AmbientContextValue {
  supported: boolean;
  active: Record<string, boolean>;
  activeCount: number;
  master: number;
  isActive: (id: string) => boolean;
  volumeOf: (id: string) => number;
  toggle: (id: string) => void;
  setVolume: (id: string, v: number) => void;
  setMaster: (v: number) => void;
  surprise: () => void;
  stopAll: () => void;
}

const AmbientContext = createContext<AmbientContextValue | null>(null);

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

export const AmbientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supported = useMemo(() => ambientEngine.isSupported(), []);

  const [active, setActive] = useState<Record<string, boolean>>(() =>
    readJSON<Record<string, boolean>>(ACTIVE_KEY, {}),
  );
  const [volumes, setVolumes] = useState<Record<string, number>>(() =>
    readJSON<Record<string, number>>(VOLUMES_KEY, {}),
  );
  const [master, setMasterState] = useState<number>(() => readJSON<number>(MASTER_KEY, DEFAULT_VOLUME));

  // Arm any restored layers (the AudioContext stays suspended until the first
  // user gesture, so nothing blares before an interaction).
  useEffect(() => {
    if (!supported) return;
    ambientEngine.setMaster(master);
    const restored = Object.keys(active).filter((id) => active[id]);
    restored.forEach((id) => {
      ambientEngine.setVolume(id, volumes[id] ?? DEFAULT_VOLUME);
      ambientEngine.setEnabled(id, true);
    });

    const resume = () => ambientEngine.resume();
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
    return () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  useEffect(() => writeJSON(ACTIVE_KEY, active), [active]);
  useEffect(() => writeJSON(VOLUMES_KEY, volumes), [volumes]);
  useEffect(() => writeJSON(MASTER_KEY, master), [master]);

  const toggle = useCallback(
    (id: string) => {
      if (!supported) return;
      const willEnable = !active[id];
      ambientEngine.resume();
      ambientEngine.setMaster(master);
      ambientEngine.setVolume(id, volumes[id] ?? DEFAULT_VOLUME);
      ambientEngine.setEnabled(id, willEnable);
      setActive((prev) => ({ ...prev, [id]: willEnable }));
    },
    [supported, active, master, volumes],
  );

  const setVolume = useCallback(
    (id: string, v: number) => {
      ambientEngine.setVolume(id, v);
      setVolumes((prev) => ({ ...prev, [id]: v }));
    },
    [],
  );

  const setMaster = useCallback((v: number) => {
    ambientEngine.setMaster(v);
    setMasterState(v);
  }, []);

  const surprise = useCallback(() => {
    if (!supported) return;
    ambientEngine.resume();
    ambientEngine.setMaster(master);
    const ids = AMBIENT_LAYERS.map((l) => l.id);
    const pool = [...ids].sort(() => Math.random() - 0.5);
    const chosen = new Set(pool.slice(0, 2 + Math.floor(Math.random() * 2)));
    const next: Record<string, boolean> = {};
    ids.forEach((id) => {
      const on = chosen.has(id);
      next[id] = on;
      ambientEngine.setVolume(id, volumes[id] ?? DEFAULT_VOLUME);
      ambientEngine.setEnabled(id, on);
    });
    setActive(next);
  }, [supported, master, volumes]);

  const stopAll = useCallback(() => {
    ambientEngine.stopAll();
    const cleared: Record<string, boolean> = {};
    AMBIENT_LAYERS.forEach((l) => { cleared[l.id] = false; });
    setActive(cleared);
  }, []);

  const value = useMemo<AmbientContextValue>(
    () => ({
      supported,
      active,
      activeCount: AMBIENT_LAYERS.reduce((n, l) => n + (active[l.id] ? 1 : 0), 0),
      master,
      isActive: (id: string) => Boolean(active[id]),
      volumeOf: (id: string) => volumes[id] ?? DEFAULT_VOLUME,
      toggle,
      setVolume,
      setMaster,
      surprise,
      stopAll,
    }),
    [supported, active, master, volumes, toggle, setVolume, setMaster, surprise, stopAll],
  );

  return <AmbientContext.Provider value={value}>{children}</AmbientContext.Provider>;
};

export function useAmbient(): AmbientContextValue {
  const ctx = useContext(AmbientContext);
  if (!ctx) throw new Error('useAmbient must be used within an AmbientProvider');
  return ctx;
}
