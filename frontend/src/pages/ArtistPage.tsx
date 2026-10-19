import React, { useEffect, useMemo, useState } from 'react';
import { Mic2, Play, User } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { fetchArtist, fetchArtistSongs, sortSongs } from '../services/catalog';
import type { Artist, Song } from '../types';
import {
  artistJsonLd,
  artistPath,
  artistSeo,
  catalogSeo,
} from '../utils/pageMeta';
import { applySeoMeta, SITE_URL } from '../utils/seo';
import { usePageSeo } from '../hooks/usePageSeo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { JsonLd } from '../components/JsonLd';
import { SongCard } from '../components/SongCard';
import { AppLink } from '../components/AppLink';
import { hideBrokenImage, safeImageUrl } from '../utils/urlSafety';

interface ArtistPageProps {
  id: number;
}

/**
 * `/artists/:id/:slug` — a full discography page. Artist pages are one of the
 * strongest long-tail surfaces for a music catalog ("Narayan Gopal songs"), so
 * they carry the biography, the complete song list and MusicGroup/Person JSON-LD.
 */
export const ArtistPage: React.FC<ArtistPageProps> = ({ id }) => {
  const { locale, t } = useI18n();
  const { playSong } = usePlayer();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Remounted per artist id by App, so no synchronous state reset is needed.
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const found = await fetchArtist(id);
        if (!active) return;
        if (!found) {
          setNotFound(true);
          return;
        }
        setArtist(found);
        const all = await fetchArtistSongs(found).catch(() => [] as Song[]);
        if (active) setSongs(sortSongs(all));
      } catch (error) {
        console.error('Failed to load artist', error);
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  const meta = useMemo(() => (artist ? artistSeo(artist, locale) : null), [artist, locale]);
  usePageSeo(meta);

  useEffect(() => {
    if (!notFound) return;
    const fallback = catalogSeo(locale);
    applySeoMeta({
      ...fallback,
      title: `${t.pages.artistNotFound} | ${fallback.title}`,
      canonical: `${SITE_URL}/artists/${id}`,
      robots: 'noindex,follow',
    });
  }, [notFound, id, locale, t.pages.artistNotFound]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-4 w-56 rounded bg-white/5 animate-pulse mb-6" />
        <div className="flex items-center gap-5 mb-8">
          <div className="h-24 w-24 rounded-full bg-white/5 animate-pulse" />
          <div className="space-y-3">
            <div className="h-8 w-64 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-40 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <User className="w-12 h-12 text-red-600/50 mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold text-white mb-2">{t.pages.artistNotFound}</h1>
        <p className="text-sm text-neutral-500 mb-6">
          {locale === 'ne'
            ? 'यो कलाकारको विवरण भेटिएन।'
            : 'We could not find this artist in the catalog.'}
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

  const name = locale === 'ne' ? artist.display_name_ne || artist.display_name : artist.display_name;
  const alternateName =
    locale === 'ne' ? artist.display_name : artist.display_name_ne || null;
  const bio = locale === 'ne' ? artist.biography_ne || artist.biography : artist.biography;
  const image = safeImageUrl(artist.profile_image);
  const playAll = () => {
    if (songs[0]) playSong(songs[0], undefined, songs);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd data={artistJsonLd(artist, songs, locale)} />

      <Breadcrumbs
        items={[
          { name: t.pages.home, path: '/' },
          { name: locale === 'ne' ? 'कलाकारहरू' : 'Artists', path: '/artists' },
          { name, path: artistPath(artist) },
        ]}
      />

      <header className="flex flex-col sm:flex-row sm:items-center gap-6 mb-10">
        <div className="h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
          {image ? (
            <img
              src={image}
              alt={artist.display_name}
              className="h-full w-full object-cover"
              loading="eager"
              onError={hideBrokenImage}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-serif text-red-500/60">
              {(artist.display_name || '?').slice(0, 1)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
            <Mic2 className="w-3.5 h-3.5 text-red-500" /> {t.pages.artist}
            {artist.verification_status === 'verified' || artist.verification_status === 'official' ? (
              <span className="rounded-full border border-red-500/40 bg-red-950/40 px-2 py-0.5 text-[10px] font-bold text-red-400">
                {locale === 'ne' ? 'प्रमाणित' : 'Verified'}
              </span>
            ) : null}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-white">{name}</h1>
          {alternateName && alternateName !== name && (
            <p className="mt-1 font-nepali text-sm text-neutral-500">{alternateName}</p>
          )}
          <p className="mt-2 text-sm text-neutral-400">
            {songs.length || artist.songs_count || 0} {t.pages.songs.toLowerCase()}
            {locale === 'ne' ? ' · नेपाली संगीत' : ' · Nepali music'}
          </p>
        </div>

        {songs.length > 0 && (
          <button
            onClick={playAll}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-glow-red transition-all hover:bg-red-500 hover:scale-105 active:scale-95 sm:self-auto"
          >
            <Play className="w-4 h-4 fill-current" />
            {locale === 'ne' ? 'सबै बजाउनुहोस्' : 'Play all'}
          </button>
        )}
      </header>

      {bio && (
        <section className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
          <h2 className="mb-2 text-xs font-mono uppercase tracking-[0.25em] text-neutral-500">
            {t.pages.aboutArtist}
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-neutral-300">{bio}</p>
        </section>
      )}

      <section>
        <div className="mb-5 flex items-end justify-between gap-3">
          <h2 className="font-serif text-2xl font-bold text-white">
            {locale === 'ne' ? `${name} का गीतहरू` : `Songs by ${artist.display_name}`}
          </h2>
          <AppLink
            href="/catalog"
            className="text-xs font-semibold text-red-400 hover:text-red-300 whitespace-nowrap"
          >
            {t.pages.browseCatalog}
          </AppLink>
        </div>

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
    </div>
  );
};
