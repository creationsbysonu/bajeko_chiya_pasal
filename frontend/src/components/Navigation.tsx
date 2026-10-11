import React, { useState, useEffect } from 'react';
import { ShieldAlert, Menu, X, Radio } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenTakedown: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  onOpenTakedown,
}) => {
  const { locale, t, toggleLocale } = useI18n();
  const { currentStation, status } = usePlayer();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navItems = [
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Wordmark */}
          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
              <Radio className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-wide group-hover:text-red-400 transition-colors duration-200">
              PURANO DHUN
            </span>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
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
                </button>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-1">
            {/* Live indicator */}
            {currentStation && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono mr-2">
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

            {/* Language */}
            <button
              onClick={toggleLocale}
              title={locale === 'ne' ? 'Switch to English' : 'नेपालीमा हेर्नुहोस्'}
              className="px-2.5 py-1 text-[11px] font-medium text-neutral-400 hover:text-white transition-colors duration-200 rounded hover:bg-white/5"
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
              onClick={toggleLocale}
              className="text-[11px] text-neutral-400 hover:text-white px-2 py-1 transition-colors"
            >
              {locale === 'ne' ? 'EN' : 'NE'}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
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
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'text-red-500 bg-red-950/30'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}

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
    </header>
  );
};
