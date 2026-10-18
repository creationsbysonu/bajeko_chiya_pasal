import React from 'react';
import { useI18n } from '../context/I18nContext';
import { ShieldCheck, Heart, ExternalLink, Lock } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { Station } from '../types';
import { navigateTo, RouteTab } from '../utils/seo';

interface FooterProps {
  /** Live station list — links out to the worlds page instead of static text. */
  stations?: Station[];
  onOpenTakedown: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ stations = [], onOpenTakedown, onOpenAdmin }) => {
  const { locale, t } = useI18n();

  // Real anchors: crawlers see six more internal edges out of every page, and
  // modified clicks still open a new tab.
  const handleWorldLink = (event: React.MouseEvent<HTMLAnchorElement>, tab: RouteTab) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    navigateTo(tab);
  };

  return (
    <footer className="bg-black border-t border-white/8 pt-14 pb-[calc(7rem+env(safe-area-inset-bottom))] text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 3-col layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <BrandMark size={34} />
              <span className="text-sm font-bold text-white tracking-wide">BAJEKO CHIYA PASAL</span>
            </div>
            <p className="text-xs leading-relaxed font-nepali">
              {t.footer.aboutText}
            </p>
            <div className="text-xs text-red-600 font-mono font-bold tracking-widest">
              Kathmandu • 2026
            </div>
          </div>

          {/* Themed worlds — links into /stations, driven by live data so the
              footer can never drift from the catalog */}
          {stations.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
                {t.nav.radioWorlds}
              </h4>
              <ul className="space-y-2">
                {stations.map((s) => (
                  <li key={s.slug}>
                    <a
                      href="/stations"
                      onClick={(e) => handleWorldLink(e, 'stations')}
                      className="block text-xs font-nepali hover:text-white transition-colors duration-150"
                    >
                      {locale === 'ne' ? s.title_ne || s.title : s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Links & Developer */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
                Policies
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={onOpenTakedown}
                    className="flex items-center gap-1.5 text-red-500 hover:text-red-400 transition-colors duration-150"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>{t.nav.reportCopyright}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenAdmin}
                    className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors duration-150"
                  >
                    <Lock className="w-3 h-3" />
                    <span>{t.nav.admin}</span>
                  </button>
                </li>
                <li className="hover:text-white transition-colors">Official YouTube Embed Player</li>
                <li className="hover:text-white transition-colors">No Audio Extraction</li>
                <li className="hover:text-white transition-colors">WCAG 2.2 AA Accessible</li>
              </ul>
            </div>

            {/* Developer credit */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-3">
                Developer
              </h4>
              <a
                href="https://guptasonu.com.np"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 transition-colors duration-200 group"
              >
                <span>Sonu Gupta</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              </a>
              <a
                href="https://guptasonu.com.np"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-block text-xs text-neutral-600 hover:text-red-400 transition-colors"
              >
                guptasonu.com.np
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-white/5 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
            <span>© 2026 Bajeko Chiya Pasal (बजेको चिया पसल). All rights reserved.</span>
            <span className="flex items-center gap-1">
              Built with
              <Heart className="w-3 h-3 text-red-600 fill-current mx-0.5" />
              for Nepali musical heritage.
            </span>
          </div>
          <p className="text-xs text-neutral-700 mt-3 leading-relaxed text-center font-nepali">
            {t.footer.rightsDisclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
};
