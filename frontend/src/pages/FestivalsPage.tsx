import React, { useEffect, useMemo, useState } from 'react';
import { PartyPopper } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import type { FestivalCalendarEntry } from '../types';
import { festivalPath, festivalsSeo, itemListJsonLd } from '../utils/pageMeta';
import { usePageSeo } from '../hooks/usePageSeo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { JsonLd } from '../components/JsonLd';
import { AppLink } from '../components/AppLink';

/** `/festivals` — every seasonal playlist, with live song counts. */
export const FestivalsPage: React.FC = () => {
  const { locale, t } = useI18n();
  const [festivals, setFestivals] = useState<FestivalCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .getFestivalCalendar()
      .then((list) => {
        if (active) setFestivals(list);
      })
      .catch((error) => console.error('Failed to load festivals', error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const meta = useMemo(() => festivalsSeo(locale), [locale]);
  usePageSeo(meta);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd
        data={itemListJsonLd({
          name: 'Nepali festival songs',
          description: 'Festival playlists for Dashain, Tihar, Chhath, Teej and more.',
          path: '/festivals',
          items: festivals.map((festival) => ({
            name: `${festival.name} songs`,
            url: festivalPath(festival),
            type: 'MusicPlaylist',
          })),
          inLanguage: locale === 'ne' ? 'ne-NP' : 'en',
        })}
      />

      <Breadcrumbs
        items={[
          { name: t.pages.home, path: '/' },
          { name: t.pages.festival, path: '/festivals' },
        ]}
      />

      <header className="mb-10 max-w-3xl">
        <p className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
          <PartyPopper className="w-3.5 h-3.5 text-red-500" /> {t.pages.festival}
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400">
            {festivals.length} {locale === 'ne' ? 'चाडपर्व' : 'festivals'}
          </span>
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-white">
          {locale === 'ne' ? 'नेपाली चाडपर्वका गीतहरू' : 'Nepali Festival Songs'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          {locale === 'ne'
            ? 'दशैं, तिहार, छठ, तीज, होली र बुद्ध जयन्ती — हरेक चाडपर्वको लागि छुट्टै नेपाली गीतको प्लेलिस्ट।'
            : 'Dashain, Tihar, Chhath, Teej, Holi and Buddha Jayanti — a dedicated Nepali playlist for every celebration.'}
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {festivals.map((festival) => (
            <AppLink
              key={festival.slug}
              href={festivalPath(festival)}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-red-500/40 hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-white group-hover:text-red-300">
                  {locale === 'ne' ? festival.name_ne || festival.name : festival.name}
                </span>
                {festival.is_active_window && (
                  <span className="flex-shrink-0 rounded-full border border-red-500/40 bg-red-950/50 px-2 py-0.5 text-[10px] font-bold text-red-400">
                    {locale === 'ne' ? 'अहिले' : 'NOW'}
                  </span>
                )}
              </div>
              {festival.description && (
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                  {festival.description}
                </p>
              )}
              <p className="mt-2 text-[11px] font-mono text-neutral-500">
                {festival.song_count} {locale === 'ne' ? 'गीत' : 'songs'}
              </p>
            </AppLink>
          ))}
        </div>
      )}
    </div>
  );
};
