import React from 'react';
import { useI18n } from '../context/I18nContext';
import { Radio, ShieldCheck, Heart, ExternalLink, Lock } from 'lucide-react';

interface FooterProps {
  onOpenTakedown: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTakedown, onOpenAdmin }) => {
  const { t } = useI18n();

  const stations = [
    'पुरानो रेडियो — Golden Era',
    'चिया पसल — Tea Shop Acoustic',
    'बस यात्रा — Highway Travel',
    'लोक दोहोरी — Folk Heritage',
    'प्रेम गीत — Romantic Melodies',
    'नेपाली रक — Pioneering Rock',
  ];

  return (
    <footer className="bg-black border-t border-white/8 pt-14 pb-28 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 3-col layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                <Radio className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white tracking-wide">PURANO DHUN</span>
            </div>
            <p className="text-xs leading-relaxed font-nepali">
              {t.footer.aboutText}
            </p>
            <div className="text-[11px] text-red-600 font-mono font-bold tracking-widest">
              Kathmandu • 2026
            </div>
          </div>

          {/* Stations */}
          <div>
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4">
              Themed Worlds
            </h4>
            <ul className="space-y-2">
              {stations.map((s, i) => (
                <li key={i} className="text-xs font-nepali hover:text-white transition-colors duration-150 cursor-default">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Links & Developer */}
          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4">
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
              <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-3">
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
                className="mt-0.5 inline-block text-[11px] text-neutral-600 hover:text-red-400 transition-colors"
              >
                guptasonu.com.np
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-white/5 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-600">
            <span>© 2026 Purano Dhun (पुरानो धुन). All rights reserved.</span>
            <span className="flex items-center gap-1">
              Built with
              <Heart className="w-3 h-3 text-red-600 fill-current mx-0.5" />
              for Nepali musical heritage.
            </span>
          </div>
          <p className="text-[11px] text-neutral-700 mt-3 leading-relaxed text-center font-nepali">
            {t.footer.rightsDisclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
};
