import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { decadePath, decadesSeo, itemListJsonLd } from '../utils/pageMeta';
import { usePageSeo } from '../hooks/usePageSeo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { JsonLd } from '../components/JsonLd';
import { AppLink } from '../components/AppLink';

/** `/decades` — a decade index linking the golden-oldies collections. */
export const DecadesIndexPage: React.FC = () => {
  const { locale, t } = useI18n();
  const [decades, setDecades] = useState<{ decade: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .getDecades()
      .then((list) => {
        if (active) setDecades(list);
      })
      .catch((error) => console.error('Failed to load decades', error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const meta = useMemo(() => decadesSeo(locale), [locale]);
  usePageSeo(meta);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd
        data={itemListJsonLd({
          name: 'Nepali songs by decade',
          description: 'Golden Nepali songs from the 1960s to the 2020s.',
          path: '/decades',
          items: decades.map((entry) => ({
            name: `${entry.decade} Nepali songs`,
            url: decadePath(entry.decade),
            type: 'MusicPlaylist',
          })),
          inLanguage: locale === 'ne' ? 'ne-NP' : 'en',
        })}
      />

      <Breadcrumbs
        items={[
          { name: t.pages.home, path: '/' },
          { name: t.pages.decadeLabel, path: '/decades' },
        ]}
      />

      <header className="mb-10 max-w-3xl">
        <p className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
          <CalendarRange className="w-3.5 h-3.5 text-red-500" /> {t.pages.decadeLabel}
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400">
            {decades.length} {locale === 'ne' ? 'दशक' : 'decades'}
          </span>
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-white">
          {locale === 'ne' ? 'दशक अनुसार नेपाली गीतहरू' : 'Nepali Songs by Decade'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          {locale === 'ne'
            ? '१९६० को दशकदेखि २०२० सम्म — हरेक दशकको कालजयी नेपाली गीतको छुट्टै सङ्ग्रह।'
            : 'From the 1960s to the 2020s — a separate collection of timeless Nepali songs for every decade.'}
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {decades.map((entry) => (
            <AppLink
              key={entry.decade}
              href={decadePath(entry.decade)}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center transition-colors hover:border-red-500/40 hover:bg-white/[0.06]"
            >
              <span className="block font-serif text-2xl font-black text-white group-hover:text-red-300">
                {entry.decade}
              </span>
              <span className="mt-1 block text-[11px] font-mono text-neutral-500">
                {entry.count} {locale === 'ne' ? 'गीत' : 'songs'}
              </span>
            </AppLink>
          ))}
        </div>
      )}
    </div>
  );
};
