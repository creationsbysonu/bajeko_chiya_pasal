import React, { useEffect, useMemo, useState } from 'react';
import { Music4 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import type { Genre, GenreCategory } from '../types';
import { collectionJsonLd, genrePath, genresSeo } from '../utils/pageMeta';
import { usePageSeo } from '../hooks/usePageSeo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { JsonLd } from '../components/JsonLd';
import { AppLink } from '../components/AppLink';
import { groupGenresByCategory } from '../utils/genreTaxonomy';

/**
 * `/genres` — the genre hub. A single crawlable page that links every genre
 * collection, so the whole taxonomy is two clicks from the home page.
 */
export const GenresPage: React.FC = () => {
  const { locale, t } = useI18n();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [categories, setCategories] = useState<GenreCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getGenres().catch(() => [] as Genre[]),
      api.getGenreCategories().catch(() => [] as GenreCategory[]),
    ])
      .then(([genreList, categoryList]) => {
        if (!active) return;
        setGenres(genreList);
        setCategories(categoryList);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const meta = useMemo(() => genresSeo(locale), [locale]);
  usePageSeo(meta);

  const groups = groupGenresByCategory(genres, categories);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd
        data={collectionJsonLd({
          name: 'Nepali music genres',
          description:
            'Every Nepali music genre — classical, folk, dohori, pop, rock, ghazal and festive songs.',
          path: '/genres',
          inLanguage: locale === 'ne' ? 'ne-NP' : 'en',
        })}
      />

      <Breadcrumbs
        items={[
          { name: t.pages.home, path: '/' },
          { name: t.pages.genres, path: '/genres' },
        ]}
      />

      <header className="mb-10 max-w-3xl">
        <p className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
          <Music4 className="w-3.5 h-3.5 text-red-500" /> {t.pages.genres}
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400">
            {genres.length} {locale === 'ne' ? 'विधा' : 'genres'}
          </span>
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-white">
          {locale === 'ne' ? 'नेपाली संगीतका विधाहरू' : 'Nepali Music Genres'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          {locale === 'ne'
            ? 'शास्त्रीय र लोक परम्परादेखि आधुनिक पप, रक र चाडपर्वका गीतसम्म — विधा छान्नुहोस् र त्यसको पूरा सङ्ग्रह सुन्नुहोस्।'
            : 'From classical and folk traditions to modern pop, rock and festival songs — pick a genre and stream its full collection.'}
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.category}>
              <h2 className="mb-3 text-xs font-mono uppercase tracking-[0.25em] text-neutral-500">
                {group.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.genres.map((genre) => (
                  <AppLink
                    key={genre.slug}
                    href={genrePath(genre)}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:border-red-500/40 hover:bg-white/[0.06]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white group-hover:text-red-300">
                        {locale === 'ne' ? genre.name_ne || genre.name : genre.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500">
                        {locale === 'ne' ? genre.name : genre.name_ne}
                      </span>
                    </span>
                    <span className="flex-shrink-0 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                      {genre.songs_count ?? 0} {t.pages.songs.toLowerCase()}
                    </span>
                  </AppLink>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
