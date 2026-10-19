import React, { useState, useEffect } from 'react';
import { ShieldAlert, Menu, X, Sun, Moon, Music } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useScrollProgress } from '../hooks/useMotion';
import { BrandMark } from './BrandMark';
import { AppLink } from './AppLink';
import { RouteTab, tabToPath } from '../utils/seo';

interface NavigationProps {
  currentTab: RouteTab;
  setCurrentTab: (tab: RouteTab) => void;
  onOpenTakedown: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  onOpenTakedown,
}) => {
  const { locale, t, toggleLocale } = useI18n();
  const { currentSong, currentStation, status } = usePlayer();
  const { theme, toggleTheme } = useTheme();
  const progress = useScrollProgress();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const themeLabel = theme === 'dark' ? t.nav.themeToLight : t.nav.themeToDark;
  const isPlaying = status === 'playing';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Real hrefs so crawlers (and "open in new tab") work; the click is still
  // intercepted to keep the SPA transition and never reload the page.
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, tab: RouteTab) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    setCurrentTab(tab);
  };

  const navItems: { id: RouteTab; label: string }[] = [
    { id: 'home', label: t.nav.home },
    { id: 'stations', label: t.nav.radioWorlds },
    { id: 'catalog', label: t.nav.catalog },
    { id: 'favorites', label: t.nav.favorites },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/98 border-b border-white/8 shadow-lg'
          : 'bg-black border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between h-14">

          {/* Wordmark — a home link, not a button, so crawlers see an internal edge */}
          <a
            href={tabToPath('home')}
            onClick={(e) => handleNavClick(e, 'home')}
            className="flex items-center gap-2.5 group flex-shrink-0"
            aria-label="Bajeko Chiya Pasal — home"
          >
            <div className="flex items-center gap-2.5 transition-transform duration-200 group-hover:scale-[1.03]">
              <BrandMark size={30} />
              <span className="leading-tight">
                <span className="block text-sm font-bold text-white tracking-wide group-hover:text-red-400 transition-colors duration-200">
                  BAJEKO CHIYA PASAL
                </span>
                <span className="block text-xs font-nepali text-neutral-500 group-hover:text-neutral-400 transition-colors duration-200">
                  बजेको चिया पसल
                </span>
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label={locale === 'ne' ? 'मुख्य नेभिगेसन' : 'Primary'}>
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <a
                  key={item.id}
                  href={tabToPath(item.id)}
                  onClick={(e) => handleNavClick(e, item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative text-xs tracking-widest uppercase font-medium pb-0.5 transition-colors duration-200 ${
                    isActive
                      ? 'text-red-500'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-red-600 rounded-full" />
                  )}
                </a>
              );
            })}
            {/* Not a tab: the genre hub is its own crawlable collection. */}
            <AppLink
              href="/genres"
              className="relative hidden lg:inline-block text-xs tracking-widest uppercase font-medium pb-0.5 text-neutral-400 hover:text-white transition-colors duration-200"
            >
              {t.pages.genres}
            </AppLink>
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-1">
            {/* Live indicator */}
            {currentStation && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono mr-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    status === 'playing'
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-neutral-600'
                  }`}
                />
                <span className="text-neutral-400 truncate max-w-[90px]">
                  {locale === 'ne'
                    ? currentStation.title_ne || currentStation.title
                    : currentStation.title}
                </span>
              </div>
            )}

            {/* Now Playing Indicator */}
            {currentSong && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 max-w-[180px]"
                title={locale === 'ne' ? currentSong.title_ne || currentSong.title : currentSong.title}
              >
                <Music className={`w-3 h-3 text-red-400 flex-shrink-0 ${isPlaying ? 'animate-pulse' : ''}`} />
                <span className="text-xs text-neutral-300 truncate">
                  {locale === 'ne' ? currentSong.title_ne || currentSong.title : currentSong.title}
                </span>
              </div>
            )}

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Day / Night theme toggle */}
            <button
              onClick={toggleTheme}
              title={themeLabel}
              aria-label={themeLabel}
              aria-pressed={theme === 'light'}
              className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors duration-200 rounded hover:bg-white/5"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Language */}
            <button
              onClick={toggleLocale}
              title={locale === 'ne' ? 'Switch to English' : 'नेपालीमा हेर्नुहोस्'}
              className="px-2.5 py-1 text-xs font-medium text-neutral-400 hover:text-white transition-colors duration-200 rounded hover:bg-white/5"
            >
              {locale === 'ne' ? 'EN' : 'NE'}
            </button>

            {/* Separator */}
            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Takedown */}
            <button
              onClick={onOpenTakedown}
              title={t.nav.reportCopyright}
              className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors duration-200 rounded hover:bg-white/5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
            </button>

          </div>

          {/* Mobile toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={themeLabel}
              aria-pressed={theme === 'light'}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleLocale}
              className="text-xs text-neutral-400 hover:text-white px-3 py-2 rounded transition-colors"
              aria-label={locale === 'ne' ? 'Switch to English' : 'नेपालीमा भर्नुहोस्'}
            >
              {locale === 'ne' ? 'EN' : 'NE'}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2.5 -mr-1 text-neutral-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-80' : 'max-h-0'
        }`}
      >
        <div className="bg-black border-t border-white/8 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <a
                key={item.id}
                href={tabToPath(item.id)}
                onClick={(e) => {
                  handleNavClick(e, item.id);
                  setMobileOpen(false);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`block w-full text-left px-3 py-2.5 rounded text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'text-red-500 bg-red-950/30'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </a>
            );
          })}
          <AppLink
            href="/genres"
            onClick={() => setMobileOpen(false)}
            className="block w-full text-left px-3 py-2.5 rounded text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5"
          >
            {t.pages.genres}
          </AppLink>

          <div className="pt-3 flex items-center gap-3 border-t border-white/8">
            <button
              onClick={() => { onOpenTakedown(); setMobileOpen(false); }}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 transition-colors py-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t.nav.reportCopyright}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Locomotive-style scroll progress hairline */}
      <div
        className="pd-progress absolute left-0 right-0 bottom-0 h-[2px] bg-red-600/90 pointer-events-none"
        style={{ '--p': progress } as React.CSSProperties}
        aria-hidden="true"
      />
    </header>
  );
};
