import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'bajeko_chiya_pasal_theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Pass the click event so the wave can originate from the toggle button. */
  toggleTheme: (event?: React.MouseEvent<HTMLElement>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Stored choice wins; otherwise follow the OS. Runs before React paints (see
 * main.tsx) so the page never flashes the wrong palette.
 */
export function initialTheme(): Theme {
  const stored = readStoredTheme();
  if (stored) return stored;

  const prefersLight =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches;

  return prefersLight ? 'light' : 'dark';
}

/** Sync the palette onto <html> so the CSS override layer picks it up. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.setAttribute('content', theme);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  // Guards cleanup: a rapid second toggle skips the first transition, whose
  // `finished` must not clear the new transition's origin.
  const waveToken = useRef(0);

  const commitTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing — the session still switches, it just won't persist.
    }
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      commitTheme(next);
    },
    [commitTheme],
  );

  /**
   * Day/night swap with a liquid "wave" reveal: the incoming palette flows out
   * from the pressed toggle using the View Transitions API. Browsers without
   * support (or users who prefer reduced motion) simply get an instant swap.
   */
  const toggleTheme = useCallback(
    (event?: React.MouseEvent<HTMLElement>) => {
      const next: Theme = theme === 'dark' ? 'light' : 'dark';

      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { finished: Promise<void> };
      };
      const reduceMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!doc.startViewTransition || reduceMotion) {
        commitTheme(next);
        return;
      }

      // Origin: the centre of the toggle button (viewport centre as a fallback).
      const rect = event?.currentTarget?.getBoundingClientRect?.();
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

      const root = document.documentElement;
      root.style.setProperty('--theme-wave-x', `${x}px`);
      root.style.setProperty('--theme-wave-y', `${y}px`);

      const token = ++waveToken.current;
      const transition = doc.startViewTransition(() => {
        // flushSync forces React to paint the new palette *inside* the
        // snapshot callback, so the incoming frame is the new theme.
        flushSync(() => commitTheme(next));
        // Apply the palette onto <html> synchronously as well: it normally
        // happens in a passive effect, which may run after the snapshot.
        applyTheme(next);
      });

      transition.finished.finally(() => {
        if (waveToken.current !== token) return;
        root.style.removeProperty('--theme-wave-x');
        root.style.removeProperty('--theme-wave-y');
      });
    },
    [theme, commitTheme],
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};