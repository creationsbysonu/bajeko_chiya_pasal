import React, { useEffect, useMemo, useState } from 'react';
import { PartyPopper, Play } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import type { FestivalCategory, FestivalSong } from '../types';
import {
  collectionJsonLd,
  festivalPath,
  festivalSeo,
  genresSeo,
  songPath,
} from '../utils/pageMeta';
import { applySeoMeta, SITE_URL } from '../utils/seo';
import { usePageSeo } from '../hooks/usePageSeo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { JsonLd } from '../components/JsonLd';
import { AppLink } from '../components/AppLink';
import { hideBrokenImage, safeImageUrl } from '../utils/urlSafety';

interface FestivalPageProps {
  slug: string;
}

/**
 * `/festivals/:slug` — a seasonal playlist page (Dashain, Tihar, Chhath…).
 * FestivalSong rows are lighter than full Song rows, so each entry links to its
 * canonical song page where it can actually be played.
 */
export const FestivalPage: React.FC<FestivalPageProps> = ({ slug }) => {
  const { locale, t } = useI18n();
  const [festival, setFestival] = useState<FestivalCategory | null>(null);
  const [songs, setSongs] = useState<FestivalSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Remounted per festival slug by App, so no synchronous state reset is needed.
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [categories, playlist] = await Promise.all([
          api.getFestivalCategories(),
          api.getFestivalSongs(slug, 100),
        ]);
        if (!active) return;
        const found = categories.find((item) => item.slug === slug) ?? null;
        if (!found) {
          setNotFound(true);
          return;
        }
        setFestival(found);
        setSongs(playlist.results ?? []);
      } catch (error) {
        console.error('Failed to load festival', error);
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  const meta = useMemo(
    () => (festival ? festivalSeo(festival, songs.length, locale) : null),
    [festival, songs.length, locale]
  );
  usePageSeo(meta);

  useEffect(() => {
    if (!notFound) return;
    const fallback = genresSeo(locale);
    applySeoMeta({
      ...fallback,
      title: `${t.pages.festivalNotFound} | ${fallback.title}`,
      canonical: `${SITE_URL}/festivals/${slug}`,
      robots: 'noindex,follow',
    });
  }, [notFound, slug, locale, t.pages.festivalNotFound]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-10 w-64 rounded bg-white/5 animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <PartyPopper className="w-12 h-12 text-red-600/50 mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold text-white mb-2">
          {t.pages.festivalNotFound}
        </h1>
        <p className="text-sm text-neutral-500 mb-6">
          {locale === 'ne' ? 'यो चाडपर्व भेटिएन।' : 'We could not find this festival.'}
        </p>
        <AppLink
          href="/catalog"
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
        >
          {t.pages.backToCatalog}
        </AppLink>
      </div>
    );
  }

  const name = locale === 'ne' ? festival.name_ne || festival.name : festival.name;
  const alternate = locale === 'ne' ? festival.name : festival.name_ne || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd
        data={collectionJsonLd({
          name: `${name} songs`,
          description: festival.description || `${festival.name} Nepali songs`,
          path: festivalPath(festival),
          songs: songs.map((song) => ({
            id: song.id,
            title: song.title,
            title_ne: song.title_ne || undefined,
          })),
          parent: { name: t.pages.festival, path: '/festivals' },
          inLanguage: locale === 'ne' ? 'ne-NP' : 'en',
        })}
      />

      <Breadcrumbs
        items={[
          { name: t.pages.home, path: '/' },
          { name: t.pages.festival, path: '/festivals' },
          { name, path: festivalPath(festival) },
        ]}
      />

      <header className="mb-8 max-w-3xl">
        <p className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
          <PartyPopper className="w-3.5 h-3.5 text-red-500" /> {t.pages.festival}
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400">{songs.length} {t.pages.songs.toLowerCase()}</span>
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-white">
          {locale === 'ne' ? `${name} का गीतहरू` : `${festival.name} Songs`}
        </h1>
        {alternate && alternate !== name && (
          <p className="mt-1 font-nepali text-base text-neutral-500">{alternate}</p>
        )}
        {festival.description && (
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">{festival.description}</p>
        )}
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

      {songs.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-sm text-neutral-500">
          {t.pages.noSongs}
        </p>
      ) : (
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {songs.map((song, index) => {
            const href = songPath({
              id: song.id,
              title: song.title,
              title_ne: song.title_ne || undefined,
            });
            const artwork = safeImageUrl(song.artwork_url);
            return (
              <li key={song.id}>
                <AppLink
                  href={href}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-red-500/40 hover:bg-white/[0.06]"
                >
                  <span className="w-5 flex-shrink-0 text-center text-xs font-mono text-neutral-600">
                    {index + 1}
                  </span>
                  <span className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-900 pd-dark-zone">
                    {artwork ? (
                      <img
                        src={artwork}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={hideBrokenImage}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-neutral-600">
                        <Play className="h-4 w-4" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white group-hover:text-red-300">
                      {song.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-neutral-500">
                      {song.artist_name || 'Nepali artist'}
                      {song.release_year ? ` · ${song.release_year}` : ''}
                    </span>
                  </span>
                  <Play className="h-4 w-4 flex-shrink-0 text-neutral-600 group-hover:text-red-400" />
                </AppLink>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
