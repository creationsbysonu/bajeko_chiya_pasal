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

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return (localStorage.getItem('purano_dhun_locale') as Locale) || 'ne';
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    return localStorage.getItem('purano_dhun_reduced_motion') === 'true' ||
      (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('purano_dhun_locale', l);
    document.documentElement.lang = l;
  };

  const toggleLocale = () => {
    setLocale(locale === 'ne' ? 'en' : 'ne');
  };

  const setReducedMotion = (v: boolean) => {
    setReducedMotionState(v);
    localStorage.setItem('purano_dhun_reduced_motion', v.toString());
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
