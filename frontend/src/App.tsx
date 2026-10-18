import React, { useState, useEffect, useRef } from 'react';
import { I18nProvider } from './context/I18nContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navigation } from './components/Navigation';
import { Player } from './components/Player';
import { QueueDrawer } from './components/QueueDrawer';
import { TakedownModal } from './components/TakedownModal';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';

import { Home } from './pages/Home';
import { RadioWorldsPage } from './pages/RadioWorldsPage';
import { Catalog } from './pages/Catalog';
import { FavoritesPage } from './pages/FavoritesPage';

import { Station, Song, Genre, GenreCategory } from './types';
import { api } from './services/api';

function MainApp() {
  const { currentStation, playStation } = usePlayer();
  const defaultTunedRef = useRef(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [stations, setStations] = useState<Station[]>([]);
  const [featuredSongs, setFeaturedSongs] = useState<Song[]>([]);
  const [newSongs, setNewSongs] = useState<Song[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [teaShopSongs, setTeaShopSongs] = useState<Song[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [categories, setCategories] = useState<GenreCategory[]>([]);
  const [decades, setDecades] = useState<{ decade: string; count: number }[]>([]);

  // Selected filters for Catalog deep-linking
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>('');
  const [selectedDecadeFilter, setSelectedDecadeFilter] = useState<string>('');

  // Modals state
  const [takedownOpen, setTakedownOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [targetTakedownSong, setTargetTakedownSong] = useState<Song | null>(null);

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
    } catch (err) {
      console.error('Failed to load initial data', err);
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

  const handleSelectGenre = (genreSlug: string) => {
    setSelectedGenreFilter(genreSlug);
    setSelectedDecadeFilter('');
    setCurrentTab('catalog');
  };

  const handleSelectDecade = (decade: string) => {
    setSelectedDecadeFilter(decade);
    setSelectedGenreFilter('');
    setCurrentTab('catalog');
  };

  const handleExploreCatalog = () => {
    setSelectedGenreFilter('');
    setSelectedDecadeFilter('');
    setCurrentTab('catalog');
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-red-600 selection:text-white font-sans">
      
      {/* Navigation Header */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenTakedown={() => setTakedownOpen(true)}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1">
        {currentTab === 'home' && (
          <Home
            stations={stations}
            featuredSongs={featuredSongs}
            newSongs={newSongs}
            trendingSongs={trendingSongs}
            teaShopSongs={teaShopSongs}
            genres={genres}
            categories={categories}
            decades={decades}
            onSelectGenre={handleSelectGenre}
            onSelectDecade={handleSelectDecade}
            onExploreCatalog={handleExploreCatalog}
          />
        )}

        {currentTab === 'stations' && (
          <RadioWorldsPage stations={stations} />
        )}

        {currentTab === 'catalog' && (
          <Catalog
            initialGenre={selectedGenreFilter}
            initialDecade={selectedDecadeFilter}
          />
        )}

        {currentTab === 'favorites' && (
          <FavoritesPage />
        )}
      </main>

      {/* Persistent Audio Player */}
      <Player />

      {/* Up Next / History Queue Drawer */}
      <QueueDrawer />

      {/* Content Moderation / Takedown Modal */}
      <TakedownModal
        isOpen={takedownOpen}
        onClose={() => {
          setTakedownOpen(false);
          setTargetTakedownSong(null);
        }}
        targetSong={targetTakedownSong}
        songsList={featuredSongs}
      />

      {/* Admin Portal Modal */}
      <AdminModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        onCatalogUpdated={loadData}
      />

      {/* Footer */}
      <Footer
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
