import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { fetchAllSongs, sortSongs } from '../services/catalog';
import type { Song } from '../types';
import {
  catalogSeo,
  collectionJsonLd,
  decadePath,
  decadeSeo,
} from '../utils/pageMeta';
import { applySeoMeta, SITE_URL } from '../utils/seo';
import { usePageSeo } from '../hooks/usePageSeo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { JsonLd } from '../components/JsonLd';
import { SongCard } from '../components/SongCard';
import { AppLink } from '../components/AppLink';

interface DecadePageProps {
  decade: string;
}

/** `/decades/:decade` — golden-oldies collection for one decade. */
export const DecadePage: React.FC<DecadePageProps> = ({ decade }) => {
  const { locale, t } = useI18n();
  const [songs, setSongs] = useState<Song[]>([]);
  const [availableDecades, setAvailableDecades] = useState<{ decade: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Remounted per decade by App, so no synchronous state reset is needed.
  useEffect(() => {
    let active = true;

    Promise.all([
      fetchAllSongs({ decade, ordering: '-release_year' }),
      api.getDecades().catch(() => []),
    ])
      .then(([items, decades]) => {
        if (!active) return;
        setAvailableDecades(decades);
        if (!decades.some((entry) => entry.decade === decade)) {
          // An empty decade is a soft-404, not a thin landing page.
          setNotFound(true);
          return;
        }
        setSongs(sortSongs(items));
      })
      .catch((error) => {
        console.error('Failed to load decade', error);
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [decade]);

  const meta = useMemo(
    () => (!loadError && !notFound ? decadeSeo(decade, songs.length, locale) : null),
    [decade, songs.length, locale, loadError, notFound]
  );
  usePageSeo(meta);

  useEffect(() => {
    if (!loadError && !notFound) return;
    const fallback = catalogSeo(locale);
    applySeoMeta({
      ...fallback,
      title: `${decade} — ${fallback.title}`,
      canonical: `${SITE_URL}${decadePath(decade)}`,
      robots: notFound ? 'noindex,follow' : fallback.robots,
    });
  }, [loadError, notFound, decade, locale]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {!notFound && (
        <JsonLd
          data={collectionJsonLd({
            name: `${decade} Nepali songs`,
            description: `Nepali songs from the ${decade}`,
            path: decadePath(decade),
            songs,
            parent: { name: t.pages.decadeLabel, path: '/decades' },
            inLanguage: locale === 'ne' ? 'ne-NP' : 'en',
          })}
        />
      )}

      <Breadcrumbs
        items={[
          { name: t.pages.home, path: '/' },
          { name: t.pages.decadeLabel, path: '/decades' },
          { name: decade, path: decadePath(decade) },
        ]}
      />

      {notFound ? (
        <div className="max-w-3xl py-16 text-center">
          <CalendarRange className="w-12 h-12 text-red-600/50 mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold text-white mb-2">
            {locale === 'ne' ? 'यो दशक भेटिएन' : 'Decade not found'}
          </h1>
          <p className="text-sm text-neutral-500 mb-6">
            {locale === 'ne'
              ? 'उपलब्ध दशकहरूको सूची हेर्नुहोस्।'
              : 'Browse the decades we actually have songs for.'}
          </p>
          <AppLink
            href="/decades"
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
          >
            {t.pages.browseByDecade}
          </AppLink>
        </div>
      ) : (
      <>
      <header className="mb-8 max-w-3xl">
        <p className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
          <CalendarRange className="w-3.5 h-3.5 text-red-500" /> {t.pages.decadeLabel}
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400">{songs.length} {t.pages.songs.toLowerCase()}</span>
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-white">
          {locale === 'ne' ? `${decade} का नेपाली गीतहरू` : `${decade} Nepali Songs`}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          {locale === 'ne'
            ? `${decade} दशकका कालजयी नेपाली गीतहरू — रेडियो नेपालका सम्झना, पुराना क्यासेट र पुस्तौंदेखि चल्दै आएका धुनहरू।`
            : `Golden Nepali songs from the ${decade} — Radio Nepal memories, vintage cassettes and melodies that never aged.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <AppLink
            href="/catalog"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10"
          >
            {t.pages.browseCatalog}
          </AppLink>
          <AppLink
            href="/stations"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10"
          >
            {t.pages.browseStations}
          </AppLink>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-sm text-neutral-500">
          {t.pages.noSongs}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}

      {availableDecades.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 font-serif text-2xl font-bold text-white">
            {t.pages.browseByDecade}
          </h2>
          <div className="flex flex-wrap gap-2">
            {availableDecades.map((item) => (
              <AppLink
                key={item.decade}
                href={decadePath(item.decade)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                  item.decade === decade
                    ? 'border-red-500/60 bg-red-950/40 text-red-300'
                    : 'border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.decade} <span className="text-neutral-500">({item.count})</span>
              </AppLink>
            ))}
          </div>
        </section>
      )}
      </>
      )}
    </div>
  );
};
