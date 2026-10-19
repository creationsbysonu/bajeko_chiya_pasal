import React, { useEffect, useMemo, useState } from 'react';
import { Music4 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { fetchAllSongs, sortSongs } from '../services/catalog';
import type { Genre, Song } from '../types';
import {
  collectionJsonLd,
  genrePath,
  genreSeo,
  genresSeo,
} from '../utils/pageMeta';
import { applySeoMeta, SITE_URL } from '../utils/seo';
import { usePageSeo } from '../hooks/usePageSeo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { JsonLd } from '../components/JsonLd';
import { SongCard } from '../components/SongCard';
import { AppLink } from '../components/AppLink';

interface GenrePageProps {
  slug: string;
}

/** `/genres/:slug` — every song in one genre, with CollectionPage JSON-LD. */
export const GenrePage: React.FC<GenrePageProps> = ({ slug }) => {
  const { locale, t } = useI18n();
  const [genre, setGenre] = useState<Genre | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Remounted per genre slug by App, so no synchronous state reset is needed.
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [genres, items] = await Promise.all([
          api.getGenres(),
          fetchAllSongs({ genre: slug, ordering: '-play_count' }),
        ]);
        if (!active) return;
        const found = genres.find((item) => item.slug === slug) ?? null;
        if (!found) {
          setNotFound(true);
          return;
        }
        setGenre(found);
        setSongs(sortSongs(items));
      } catch (error) {
        console.error('Failed to load genre', error);
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
    () => (genre ? genreSeo(genre, songs.length, locale) : null),
    [genre, songs.length, locale]
  );
  usePageSeo(meta);

  useEffect(() => {
    if (!notFound) return;
    const fallback = genresSeo(locale);
    applySeoMeta({
      ...fallback,
      title: `${t.pages.genreNotFound} | ${fallback.title}`,
      canonical: `${SITE_URL}/genres/${slug}`,
      robots: 'noindex,follow',
    });
  }, [notFound, slug, locale, t.pages.genreNotFound]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-10 w-64 rounded bg-white/5 animate-pulse mb-4" />
        <div className="h-4 w-96 max-w-full rounded bg-white/5 animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!genre) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Music4 className="w-12 h-12 text-red-600/50 mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold text-white mb-2">{t.pages.genreNotFound}</h1>
        <p className="text-sm text-neutral-500 mb-6">
          {locale === 'ne' ? 'यो विधा भेटिएन।' : 'We could not find this genre.'}
        </p>
        <AppLink
          href="/genres"
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
        >
          {t.pages.browseGenres}
        </AppLink>
      </div>
    );
  }

  const name = locale === 'ne' ? genre.name_ne || genre.name : genre.name;
  const alternate = locale === 'ne' ? genre.name : genre.name_ne || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd
        data={collectionJsonLd({
          name: `${name} — Nepali songs`,
          description: genre.description || `Nepali ${genre.name} songs`,
          path: genrePath(genre),
          songs,
          parent: { name: t.pages.genres, path: '/genres' },
          inLanguage: locale === 'ne' ? 'ne-NP' : 'en',
        })}
      />

      <Breadcrumbs
        items={[
          { name: t.pages.home, path: '/' },
          { name: t.pages.genres, path: '/genres' },
          { name, path: genrePath(genre) },
        ]}
      />

      <header className="mb-8 max-w-3xl">
        <p className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
          <Music4 className="w-3.5 h-3.5 text-red-500" /> {t.pages.genre}
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400">{songs.length} {t.pages.songs.toLowerCase()}</span>
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-white">
          {locale === 'ne' ? `${name} गीतहरू` : `${genre.name} Songs`}
        </h1>
        {alternate && alternate !== name && (
          <p className="mt-1 font-nepali text-base text-neutral-500">{alternate}</p>
        )}
        {genre.description && (
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">{genre.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <AppLink
            href="/genres"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10"
          >
            {t.pages.browseGenres}
          </AppLink>
          <AppLink
            href="/catalog"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10"
          >
            {t.pages.browseCatalog}
          </AppLink>
        </div>
      </header>

      {songs.length === 0 ? (
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

      <div className="mt-10 border-t border-white/10 pt-6">
        <AppLink href="/catalog" className="text-xs font-semibold text-red-400 hover:text-red-300">
          {t.pages.browseCatalog} →
        </AppLink>
      </div>
    </div>
  );
};
