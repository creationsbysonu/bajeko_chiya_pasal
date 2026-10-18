import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../locales/en';
import { ne } from '../locales/ne';

type Locale = 'ne' | 'en';
type Translations = typeof ne;

interface I18nContextType {
  locale: Locale;
  t: Translations;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_KEY = 'bajeko_chiya_pasal_locale';
const MOTION_KEY = 'bajeko_chiya_pasal_reduced_motion';

// Storage access can throw outright (Safari private mode, storage-disabled
// webviews). An unguarded read inside a useState initializer crashes the whole
// app during its first render, so both directions are wrapped — the
// ThemeContext and PlayerContext already do the same.
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked — the preference simply won't persist.
  }
}

function readLocale(): Locale {
  const stored = readStorage(LOCALE_KEY);
  // Anything else (a tampered or stale value) must not leak into
  // `document.documentElement.lang`.
  return stored === 'en' || stored === 'ne' ? stored : 'ne';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(readLocale);

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    return readStorage(MOTION_KEY) === 'true' ||
      (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    writeStorage(LOCALE_KEY, l);
    document.documentElement.lang = l;
  };

  const toggleLocale = () => {
    setLocale(locale === 'ne' ? 'en' : 'ne');
  };

  const setReducedMotion = (v: boolean) => {
    setReducedMotionState(v);
    writeStorage(MOTION_KEY, v.toString());
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = locale === 'ne' ? ne : en;

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, toggleLocale, reducedMotion, setReducedMotion }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
