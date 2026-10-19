import React, { useEffect, useMemo, useState } from 'react';
import { Play, Radio, Volume2 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import type { Song, Station } from '../types';
import {
  catalogSeo,
  stationJsonLd,
  stationPath,
  stationSeo,
} from '../utils/pageMeta';
import { applySeoMeta, SITE_URL } from '../utils/seo';
import { usePageSeo } from '../hooks/usePageSeo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { JsonLd } from '../components/JsonLd';
import { SongCard } from '../components/SongCard';
import { AppLink } from '../components/AppLink';
import { hideBrokenImage, safeImageUrl } from '../utils/urlSafety';

interface StationPageProps {
  slug: string;
  /** The already-loaded world list, used for "other worlds" links. */
  stations?: Station[];
}

/**
 * `/stations/:slug` — one themed radio world, its full queue and its place
 * among the other nine stations. Prerendered with RadioStation JSON-LD.
 */
export const StationPage: React.FC<StationPageProps> = ({ slug, stations = [] }) => {
  const { locale, t } = useI18n();
  const { currentStation, playStation, status } = usePlayer();
  const [station, setStation] = useState<Station | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Remounted per slug by App, so no synchronous state reset is needed.
  useEffect(() => {
    let active = true;

    api
      .getStationDetail(slug)
      .then((detail) => {
        if (!active) return;
        setStation(detail);
        setSongs(
          (detail.station_songs ?? [])
            .map((entry) => entry.song)
            .filter((song) => song?.publication_status === 'published')
        );
      })
      .catch((error) => {
        console.error('Failed to load station', error);
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const meta = useMemo(() => (station ? stationSeo(station, locale) : null), [station, locale]);
  usePageSeo(meta);

  useEffect(() => {
    if (!notFound) return;
    const fallback = catalogSeo(locale);
    applySeoMeta({
      ...fallback,
      title: `${t.pages.stationNotFound} | ${fallback.title}`,
      canonical: `${SITE_URL}/stations/${slug}`,
      robots: 'noindex,follow',
    });
  }, [notFound, slug, locale, t.pages.stationNotFound]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-56 rounded-2xl bg-white/5 animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Radio className="w-12 h-12 text-red-600/50 mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold text-white mb-2">{t.pages.stationNotFound}</h1>
        <p className="text-sm text-neutral-500 mb-6">
          {locale === 'ne'
            ? 'यो रेडियो संसार उपलब्ध छैन।'
            : 'This radio world is not available.'}
        </p>
        <AppLink
          href="/stations"
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
        >
          {t.pages.browseStations}
        </AppLink>
      </div>
    );
  }

  const title = locale === 'ne' ? station.title_ne || station.title : station.title;
  const alternate = locale === 'ne' ? station.title : station.title_ne || null;
  const tagline = locale === 'ne' ? station.tagline_ne || station.tagline : station.tagline;
  const description =
    (locale === 'ne' ? station.description_ne || station.description : station.description) ||
    tagline;
  const cover = safeImageUrl(station.cover_image);
  const isCurrent = currentStation?.slug === station.slug;
  const isPlaying = isCurrent && status === 'playing';
  const otherStations = stations.filter((item) => item.slug !== station.slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd data={stationJsonLd(station, locale, songs)} />

      <Breadcrumbs
        items={[
          { name: t.pages.home, path: '/' },
          { name: t.pages.stations, path: '/stations' },
          { name: title, path: stationPath(station) },
        ]}
      />

      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/70 mb-10">
        {cover && (
          <img
            src={cover}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover opacity-35"
            loading="eager"
            onError={hideBrokenImage}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
        <div className="relative p-6 sm:p-10 max-w-3xl">
          <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-widest text-red-400">
            <Radio className="w-3.5 h-3.5" /> {t.pages.station}
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">{songs.length} {t.pages.songs.toLowerCase()}</span>
            {isPlaying && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-950/50 px-2 py-0.5 text-[10px] font-bold text-red-400">
                <Volume2 className="w-3 h-3 animate-pulse" /> ON AIR
              </span>
            )}
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-black leading-tight text-white">
            {title}
          </h1>
          {alternate && alternate !== title && (
            <p className="mt-2 font-nepali text-lg text-neutral-400">{alternate}</p>
          )}
          {tagline && <p className="mt-3 text-sm font-medium text-neutral-300">{tagline}</p>}
          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400">{description}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => playStation(station, songs[0])}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-glow-red transition-all hover:bg-red-500 hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              {isPlaying ? (locale === 'ne' ? 'बजिरहेको छ' : 'Playing') : t.pages.playStation}
            </button>
            <AppLink
              href="/stations"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-white/10"
            >
              {t.pages.browseStations}
            </AppLink>
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-5 font-serif text-2xl font-bold text-white">
          {locale === 'ne' ? 'यो रेडियोको गीतसूची' : 'This station\u2019s playlist'}
        </h2>
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
      </section>

      {otherStations.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 font-serif text-2xl font-bold text-white">{t.pages.browseStations}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {otherStations.map((item) => (
              <AppLink
                key={item.slug}
                href={stationPath(item)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold text-neutral-300 transition-colors hover:border-red-500/40 hover:bg-white/[0.06] hover:text-white"
              >
                {locale === 'ne' ? item.title_ne || item.title : item.title}
              </AppLink>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
