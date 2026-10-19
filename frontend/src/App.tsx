import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { I18nProvider, useI18n } from './context/I18nContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navigation } from './components/Navigation';
import { Player } from './components/Player';
import { QueueDrawer } from './components/QueueDrawer';
import { Footer } from './components/Footer';

import { Home } from './pages/Home';

import { Station, Song, Genre, GenreCategory } from './types';
import { api } from './services/api';
import {
  applyRouteSeo,
  navigateTo,
  parseRoute,
  routeTab,
  type AppRoute,
} from './utils/seo';

// The three secondary screens are split into their own chunks so the home page
// — the one search engines rank — parses far less JavaScript before first
// paint. That shows up directly in LCP/TBT, which are ranking signals.
const RadioWorldsPage = React.lazy(() =>
  import('./pages/RadioWorldsPage').then((m) => ({ default: m.RadioWorldsPage }))
);
const Catalog = React.lazy(() =>
  import('./pages/Catalog').then((m) => ({ default: m.Catalog }))
);
const FavoritesPage = React.lazy(() =>
  import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage }))
);

// Entity pages: each one is a separately indexed URL (song/artist/station/
// genre/decade/festival). Code-splitting keeps the home entry bundle small while
// the build-time prerenderer gives every route real HTML for crawlers.
const SongPage = React.lazy(() =>
  import('./pages/SongPage').then((m) => ({ default: m.SongPage }))
);
const ArtistPage = React.lazy(() =>
  import('./pages/ArtistPage').then((m) => ({ default: m.ArtistPage }))
);
const StationPage = React.lazy(() =>
  import('./pages/StationPage').then((m) => ({ default: m.StationPage }))
);
const GenrePage = React.lazy(() =>
  import('./pages/GenrePage').then((m) => ({ default: m.GenrePage }))
);
const GenresPage = React.lazy(() =>
  import('./pages/GenresPage').then((m) => ({ default: m.GenresPage }))
);
const DecadePage = React.lazy(() =>
  import('./pages/DecadePage').then((m) => ({ default: m.DecadePage }))
);
const DecadesIndexPage = React.lazy(() =>
  import('./pages/DecadesIndexPage').then((m) => ({ default: m.DecadesIndexPage }))
);
const ArtistsPage = React.lazy(() =>
  import('./pages/ArtistsPage').then((m) => ({ default: m.ArtistsPage }))
);
const FestivalsPage = React.lazy(() =>
  import('./pages/FestivalsPage').then((m) => ({ default: m.FestivalsPage }))
);
const FestivalPage = React.lazy(() =>
  import('./pages/FestivalPage').then((m) => ({ default: m.FestivalPage }))
);
const AboutPage = React.lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);

// Both modals are on-demand too: the admin portal is ~164 kB of source that no
// listener needs at first paint, so it is fetched only when the button is hit.
const TakedownModal = React.lazy(() =>
  import('./components/TakedownModal').then((m) => ({ default: m.TakedownModal }))
);
const AdminModal = React.lazy(() =>
  import('./components/AdminModal').then((m) => ({ default: m.AdminModal }))
);

const RouteFallback = () => (
  <div className="flex items-center justify-center py-32" role="status" aria-live="polite">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-red-500" />
    <span className="sr-only">Loading…</span>
  </div>
);

function MainApp() {
  const { currentStation, playStation } = usePlayer();
  const { locale } = useI18n();
  const defaultTunedRef = useRef(false);
  const [route, setRoute] = useState<AppRoute>(
    () => parseRoute(window.location.pathname) ?? { name: 'home' }
  );
  const currentTab = routeTab(route);

  // Address bar ↔ screen state. Back/forward moves between real pages, and an
  // unknown path is collapsed to "/" — Vercel answers 200 for every path, so
  // /whatever would otherwise be an indexed soft-404 duplicating the home page.
  useEffect(() => {
    if (!parseRoute(window.location.pathname)) {
      window.history.replaceState(null, '', '/');
    }
    const onPopState = () =>
      setRoute(parseRoute(window.location.pathname) ?? { name: 'home' });
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Keep <title>, description, canonical and robots pointing at what is
  // actually on screen for the four tab routes. Entity pages own their tags
  // (see usePageSeo): applying the tab fallback here after their effect would
  // overwrite a correct song/artist title with the generic catalog one.
  useEffect(() => {
    if (
      route.name === 'home' ||
      route.name === 'stations' ||
      route.name === 'catalog' ||
      route.name === 'favorites'
    ) {
      applyRouteSeo(route.name, locale);
    }
  }, [route, locale]);
  const [stations, setStations] = useState<Station[]>([]);
  const [featuredSongs, setFeaturedSongs] = useState<Song[]>([]);
  const [newSongs, setNewSongs] = useState<Song[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [teaShopSongs, setTeaShopSongs] = useState<Song[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [categories, setCategories] = useState<GenreCategory[]>([]);
  const [decades, setDecades] = useState<{ decade: string; count: number }[]>([]);

  // Modals state
  const [takedownOpen, setTakedownOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [targetTakedownSong, setTargetTakedownSong] = useState<Song | null>(null);

  // 'loading' → first paint, 'ready' → catalog in place, 'error' → every call
  // failed (offline / Supabase asleep) and the page would otherwise render a
  // permanently empty shell with no explanation and no way to retry.
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Songs offered in the takedown form's picker. It used to receive only the
  // 8 featured songs, so most of the catalog could not be reported at all —
  // and with an empty list at first render it silently filed reports against
  // whatever id happened to be in state.
  const reportableSongs = useMemo(() => {
    const seen = new Set<number>();
    const out: Song[] = [];
    for (const song of [...featuredSongs, ...trendingSongs, ...newSongs, ...teaShopSongs]) {
      if (song && typeof song.id === 'number' && !seen.has(song.id)) {
        seen.add(song.id);
        out.push(song);
      }
    }
    return out;
  }, [featuredSongs, trendingSongs, newSongs, teaShopSongs]);

  const loadData = async () => {
    try {
      const [stationsData, featuredData, genresData, decadesData, categoriesData, newSongsData, trendingData, chiyaStation] = await Promise.all([
        api.getStations(),
        api.getFeatured(),
        api.getGenres(),
        api.getDecades(),
        api.getGenreCategories().catch(() => [] as GenreCategory[]),
        api.getSongs({ ordering: '-created_at' }).catch(() => ({ count: 0, next: null, previous: null, results: [] as Song[] })),
        api.getSongs({ ordering: '-play_count' }).catch(() => ({ count: 0, next: null, previous: null, results: [] as Song[] })),
        api.getStationDetail('chiya-pasal').catch(() => null),
      ]);
      setStations(stationsData);
      setFeaturedSongs(featuredData.songs);
      setNewSongs(newSongsData.results.slice(0, 8));
      setTrendingSongs(trendingData.results.slice(0, 8));
      setGenres(genresData);
      setDecades(decadesData);
      setCategories(categoriesData);
      setTeaShopSongs(
        (chiyaStation?.station_songs ?? [])
          .map((entry) => entry.song)
          .filter((song) => song?.publication_status === 'published')
      );
      setLoadStatus('ready');
    } catch (err) {
      console.error('Failed to load initial data', err);
      setLoadStatus('error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // The site is named after the tea shop, so it opens tuned to that world with
  // the curated playlist already loaded. Browsers may block the first unmuted
  // autoplay attempt; the station, queue and track stay selected so a single
  // tap starts the music.
  useEffect(() => {
    if (defaultTunedRef.current || stations.length === 0) return;
    defaultTunedRef.current = true;
    if (currentStation) return;

    const houseDefault = stations.find((s) => s.slug === 'chiya-pasal');
    if (houseDefault) void playStation(houseDefault);
  }, [stations, currentStation, playStation]);

  const handleExploreCatalog = () => navigateTo('catalog');

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-red-600 selection:text-white font-sans">
      
      {/* Navigation Header */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={navigateTo}
        onOpenTakedown={() => setTakedownOpen(true)}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1">
        {/* Catalog failed to load — say so and offer a retry instead of
            silently rendering an empty shell of "0 songs" panels. */}
        {loadStatus === 'error' && (
          <div role="alert" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3">
              <p className="flex-1 min-w-[220px] text-sm text-amber-100 font-nepali leading-relaxed">
                सामग्री लोड गर्न सकिएन — इन्टरनेट जाँच गरी पुनः प्रयास गर्नुहोस्।
                <span className="mt-0.5 block text-xs font-mono text-amber-300/80">
                  The catalog could not be loaded. Check your connection and retry.
                </span>
              </p>
              <button
                onClick={() => {
                  setLoadStatus('loading');
                  void loadData();
                }}
                className="rounded-lg border border-amber-400/50 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                Retry / पुनः प्रयास
              </button>
            </div>
          </div>
        )}

        {route.name === 'home' && (
          <Home
            stations={stations}
            featuredSongs={featuredSongs}
            newSongs={newSongs}
            trendingSongs={trendingSongs}
            teaShopSongs={teaShopSongs}
            genres={genres}
            categories={categories}
            decades={decades}
            onExploreCatalog={handleExploreCatalog}
          />
        )}

        {/* Secondary routes arrive as separate chunks; only they suspend. */}
        <Suspense fallback={<RouteFallback />}>
          {route.name === 'stations' && <RadioWorldsPage stations={stations} />}
          {route.name === 'station' && (
            <StationPage key={route.slug} slug={route.slug} stations={stations} />
          )}

          {route.name === 'catalog' && <Catalog />}
          {route.name === 'favorites' && <FavoritesPage />}

          {route.name === 'genres' && <GenresPage />}
          {route.name === 'artists' && <ArtistsPage />}
          {route.name === 'decades' && <DecadesIndexPage />}
          {route.name === 'festivals' && <FestivalsPage />}
          {route.name === 'genre' && <GenrePage key={route.slug} slug={route.slug} />}
          {route.name === 'decade' && <DecadePage key={route.decade} decade={route.decade} />}
          {route.name === 'festival' && <FestivalPage key={route.slug} slug={route.slug} />}
          {route.name === 'song' && <SongPage key={route.id} id={route.id} />}
          {route.name === 'artist' && <ArtistPage key={route.id} id={route.id} />}
          {route.name === 'about' && (
            <AboutPage onOpenTakedown={() => setTakedownOpen(true)} />
          )}
        </Suspense>
      </main>

      {/* Persistent Audio Player */}
      <Player />

      {/* Up Next / History Queue Drawer */}
      <QueueDrawer />

      {/* Content Moderation / Takedown Modal — mounted on demand */}
      {takedownOpen && (
        <Suspense fallback={null}>
          <TakedownModal
            isOpen
            onClose={() => {
              setTakedownOpen(false);
              setTargetTakedownSong(null);
            }}
            targetSong={targetTakedownSong}
            songsList={reportableSongs}
          />
        </Suspense>
      )}

      {/* Admin Portal Modal — mounted on demand */}
      {adminOpen && (
        <Suspense fallback={null}>
          <AdminModal isOpen onClose={() => setAdminOpen(false)} onCatalogUpdated={loadData} />
        </Suspense>
      )}

      {/* Footer */}
      <Footer
        stations={stations}
        genres={genres}
        onOpenTakedown={() => setTakedownOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <PlayerProvider>
          <MainApp />
        </PlayerProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
