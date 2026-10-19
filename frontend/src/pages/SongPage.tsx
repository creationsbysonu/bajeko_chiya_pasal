import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Disc3,
  ExternalLink,
  Music,
  Play,
  Radio,
  User,
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import { fetchArtistSongs, fetchAllSongs, sortSongs } from '../services/catalog';
import type { Genre, Song } from '../types';
import {
  artistPathById,
  catalogSeo,
  genrePath,
  songJsonLd,
  songPath,
  songSeo,
} from '../utils/pageMeta';
import { applySeoMeta, SITE_URL } from '../utils/seo';
import { usePageSeo } from '../hooks/usePageSeo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { JsonLd } from '../components/JsonLd';
import { SongCard } from '../components/SongCard';
import { AppLink } from '../components/AppLink';
import { songArtwork, hideBrokenImage, safeYouTubeUrl } from '../utils/urlSafety';

interface SongPageProps {
  id: number;
}

function formatDuration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * `/songs/:id/:slug` — one song with its credits, official embed link, artist
 * link and related collections.
 *
 * This page exists for listeners and crawlers alike: it is prerendered at build
 * time with MusicRecording JSON-LD, and after React boots it becomes a normal
 * part of the SPA (the player keeps running across navigations).
 */
export const SongPage: React.FC<SongPageProps> = ({ id }) => {
  const { locale, t } = useI18n();
  const { playSong } = usePlayer();
  const [song, setSong] = useState<Song | null>(null);
  const [genre, setGenre] = useState<Genre | null>(null);
  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [relatedSongs, setRelatedSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Remounted with a fresh `key` for every song id (see App), so the initial
  // state is already correct and the effect only talks to the network.
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [detail, genres] = await Promise.all([
          api.getSongDetail(id),
          api.getGenres().catch(() => [] as Genre[]),
        ]);
        if (!active) return;
        setSong(detail);
        const matchedGenre =
          genres.find((g) => g.id === detail.primary_genre) ??
          genres.find((g) => g.name === detail.primary_genre_name) ??
          null;
        setGenre(matchedGenre);

        const [byArtist, byGenre] = await Promise.all([
          fetchArtistSongs({ id: detail.artist, display_name: detail.artist_name }).catch(
            () => [] as Song[]
          ),
          matchedGenre
            ? fetchAllSongs({ genre: matchedGenre.slug, ordering: '-play_count' }).catch(
                () => [] as Song[]
              )
            : Promise.resolve([] as Song[]),
        ]);
        if (!active) return;
        setArtistSongs(sortSongs(byArtist.filter((s) => s.id !== detail.id)).slice(0, 8));
        setRelatedSongs(byGenre.filter((s) => s.id !== detail.id).slice(0, 8));
      } catch (error) {
        console.error('Failed to load song', error);
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  const meta = useMemo(() => (song ? songSeo(song, locale) : null), [song, locale]);
  usePageSeo(meta);

  // A missing song must never be indexed as a thin duplicate of the catalog.
  useEffect(() => {
    if (!notFound) return;
    const fallback = catalogSeo(locale);
    applySeoMeta({
      ...fallback,
      title: `${t.pages.songNotFound} | ${fallback.title}`,
      canonical: `${SITE_URL}/songs/${id}`,
      robots: 'noindex,follow',
    });
  }, [notFound, id, locale, t.pages.songNotFound]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-4 w-56 rounded bg-white/5 animate-pulse mb-6" />
        <div className="grid lg:grid-cols-[340px,1fr] gap-8">
          <div className="aspect-video rounded-2xl bg-white/5 animate-pulse" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-white/5 animate-pulse" />
            <div className="h-24 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Music className="w-12 h-12 text-red-600/50 mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold text-white mb-2">{t.pages.songNotFound}</h1>
        <p className="text-sm text-neutral-500 mb-6">
          {locale === 'ne'
            ? 'यो गीत भण्डारबाट हटाइएको वा उपलब्ध नभएको हुन सक्छ।'
            : 'This song may have been removed from the catalog.'}
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

  const title = song.title;
  const titleNe = song.title_ne && song.title_ne !== title ? song.title_ne : null;
  const artist = song.artist_name;
  const artistNe = song.artist_name_ne && song.artist_name_ne !== artist ? song.artist_name_ne : null;
  const artwork = songArtwork(song);
  const youtube = safeYouTubeUrl(song.provider_url);
  const duration = formatDuration(song.duration_seconds);
  const genreName =
    locale === 'ne' ? song.primary_genre_name_ne || song.primary_genre_name : song.primary_genre_name;

  const details: Array<{ label: string; value: React.ReactNode }> = [];
  if (song.release_year) details.push({ label: t.pages.year, value: song.release_year });
  if (duration) details.push({ label: t.pages.duration, value: duration });
  if (song.language) details.push({ label: t.pages.language, value: song.language });
  if (song.decade) details.push({ label: t.pages.decadeLabel, value: song.decade });
  if (song.album) details.push({ label: t.pages.album, value: song.album });
  if (song.film_or_source) details.push({ label: t.pages.film, value: song.film_or_source });
  if (song.composer) details.push({ label: t.pages.composer, value: song.composer });
  if (song.lyricist) details.push({ label: t.pages.lyricist, value: song.lyricist });
  if (song.featured_artists)
    details.push({
      label: locale === 'ne' ? 'थप कलाकार' : 'Featured artists',
      value: song.featured_artists,
    });
  if (song.play_count) details.push({ label: t.pages.plays, value: song.play_count.toLocaleString() });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd data={songJsonLd(song, locale)} />

      <Breadcrumbs
        items={[
          { name: t.pages.home, path: '/' },
          { name: t.pages.catalog, path: '/catalog' },
          { name: title, path: songPath(song) },
        ]}
      />

      <article className="grid lg:grid-cols-[340px,1fr] gap-8 items-start">
        <div className="space-y-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 pd-dark-zone">
            {artwork ? (
              <img
                src={artwork}
                alt={`${title}${artist ? ` — ${artist}` : ''}`}
                className="w-full h-full object-cover"
                loading="eager"
                onError={hideBrokenImage}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-600">
                <Music className="w-10 h-10" />
              </div>
            )}
          </div>

          <button
            onClick={() => playSong(song, undefined, [song, ...artistSongs])}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-glow-red transition-all hover:bg-red-500 hover:scale-[1.02] active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            {t.pages.playSong}
          </button>

          {youtube && (
            <a
              href={youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-xs font-semibold text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t.pages.listenOnYouTube}
            </a>
          )}

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-neutral-500">
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 mb-1">
              {locale === 'ne' ? 'श्रेय' : 'Attribution'}
            </p>
            <p>{song.attribution || 'Official YouTube embed'}</p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
            <span className="inline-flex items-center gap-1.5 text-red-400">
              <Music className="w-3 h-3" /> {t.pages.song}
            </span>
            {genreName && <span className="text-neutral-600">/ {genreName}</span>}
            {song.decade && <span className="text-neutral-600">/ {song.decade}</span>}
          </p>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-white">
            {title}
          </h1>
          {titleNe && (
            <p className="mt-2 font-nepali text-xl text-neutral-400">{titleNe}</p>
          )}

          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-400">
            <User className="w-4 h-4 text-neutral-600" />
            <AppLink
              href={artistPathById(song.artist, artist || artistNe || 'artist')}
              className="font-medium text-white hover:text-red-400"
            >
              {locale === 'ne' ? artistNe || artist : artist}
            </AppLink>
            {artistNe && locale === 'ne' && <span className="text-neutral-600">({artist})</span>}
            {song.release_year && (
              <span className="inline-flex items-center gap-1 text-neutral-500">
                <Calendar className="w-3.5 h-3.5" />
                {song.release_year}
              </span>
            )}
            {duration && (
              <span className="inline-flex items-center gap-1 text-neutral-500">
                <Clock className="w-3.5 h-3.5" />
                {duration}
              </span>
            )}
          </p>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-neutral-400">
            {locale === 'ne'
              ? `${title}${song.release_year ? ` (${song.release_year})` : ''} — ${
                  artistNe || artist
                } को ${
                  genreName ? `${genreName} विधाको ` : ''
                }कालजयी नेपाली गीत। आधिकारिक युट्युब इम्बेडमार्फत ${SITE_URL.replace('https://', '')} मा निःशुल्क सुन्नुहोस्।`
              : `“${title}”${song.release_year ? ` (${song.release_year})` : ''} is a Nepali ${
                  genreName ? `${genreName} ` : ''
                }song by ${artist}. Stream it free through the official YouTube embed on Bajeko Chiya Pasal.`}
          </p>

          {details.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-neutral-500">
                <Disc3 className="w-3.5 h-3.5" /> {t.pages.details}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                {details.map((item) => (
                  <div key={item.label} className="min-w-0">
                    <dt className="text-[11px] uppercase tracking-widest text-neutral-600">{item.label}</dt>
                    <dd className="mt-0.5 truncate text-sm text-neutral-200">{item.value}</dd>
                  </div>
                ))}
                {genre && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-widest text-neutral-600">
                      {t.pages.genreLabel}
                    </dt>
                    <dd className="mt-0.5 text-sm">
                      <AppLink href={genrePath(genre)} className="text-red-400 hover:text-red-300">
                        {locale === 'ne' ? genre.name_ne || genre.name : genre.name}
                      </AppLink>
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <Radio className="w-4 h-4 text-red-500" />
              {locale === 'ne' ? 'यो गीत कहाँ सुन्ने?' : 'Where to hear this song'}
            </h2>
            <p className="text-sm leading-relaxed text-neutral-400">
              {locale === 'ne'
                ? 'यो गीत चिया पसल, पुरानो रेडियो र नेपाली क्लासिक्स जस्ता विषयगत रेडियो संसारमा बज्छ। तपाईंको मनपर्ने स्टेसन छान्नुहोस् वा पूरा भण्डारमा खोज्नुहोस्।'
                : 'This track plays across themed worlds such as the Tea Shop, Vintage Radio and Nepali Classics. Pick a station or search the whole catalog.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <AppLink
                href="/stations"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10"
              >
                {t.pages.browseStations}
              </AppLink>
              <AppLink
                href="/catalog"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10"
              >
                {t.pages.browseCatalog}
              </AppLink>
              <AppLink
                href={artistPathById(song.artist, artist || artistNe || 'artist')}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10"
              >
                {locale === 'ne' ? `${artistNe || artist} का सबै गीत` : `All songs by ${artist}`}
              </AppLink>
            </div>
          </section>
        </div>
      </article>

      {artistSongs.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-3">
            <h2 className="font-serif text-2xl font-bold text-white">
              {t.pages.moreFromArtist}
            </h2>
            <AppLink
              href={artistPathById(song.artist, artist || 'artist')}
              className="text-xs font-semibold text-red-400 hover:text-red-300 whitespace-nowrap"
            >
              {locale === 'ne' ? 'सबै हेर्नुहोस्' : 'View all'}
            </AppLink>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {artistSongs.map((item) => (
              <SongCard key={item.id} song={item} />
            ))}
          </div>
        </section>
      )}

      {relatedSongs.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-3">
            <h2 className="font-serif text-2xl font-bold text-white">{t.pages.relatedSongs}</h2>
            {genre && (
              <AppLink
                href={genrePath(genre)}
                className="text-xs font-semibold text-red-400 hover:text-red-300 whitespace-nowrap"
              >
                {locale === 'ne' ? 'यो विधा हेर्नुहोस्' : 'Explore the genre'}
              </AppLink>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedSongs.map((item) => (
              <SongCard key={item.id} song={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
