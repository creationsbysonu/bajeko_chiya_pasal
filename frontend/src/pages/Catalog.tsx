import React, { useState, useEffect, useCallback } from 'react';
import { Song, Genre, GenreCategory } from '../types';
import { SongCard } from '../components/SongCard';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { Search, X, Music, RefreshCw } from 'lucide-react';
import { groupGenresByCategory } from '../utils/genreTaxonomy';

interface CatalogProps {
  initialGenre?: string;
  initialDecade?: string;
  initialLanguage?: string;
}

export const Catalog: React.FC<CatalogProps> = ({ initialGenre, initialDecade, initialLanguage }) => {
  const { locale, t } = useI18n();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre || '');
  const [selectedDecade, setSelectedDecade] = useState<string>(initialDecade || '');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLanguage || '');
  const [selectedVerification, setSelectedVerification] = useState<string>('');
  const [ordering, setOrdering] = useState<string>('-release_year');
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [categories, setCategories] = useState<GenreCategory[]>([]);
  const [languages, setLanguages] = useState<{ language: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load genres and languages for dropdowns
  useEffect(() => {
    api.getGenres().then(setGenres).catch(console.error);
    api.getLanguages().then(setLanguages).catch(console.error);
    api.getGenreCategories().then(setCategories).catch(console.error);
  }, []);

  const groupedGenres = groupGenresByCategory(genres, categories);

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSongs({
        search: debouncedSearch,
        genre: selectedGenre,
        decade: selectedDecade,
        language: selectedLanguage,
        verification: selectedVerification,
        ordering,
        page: 1,
      });
      setSongs(res.results);
      setTotalCount(res.count);
      setHasMore(Boolean(res.next));
      setPage(1);
    } catch (err) {
      console.error('Failed to load songs', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedGenre, selectedDecade, selectedLanguage, selectedVerification, ordering]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await api.getSongs({
        search: debouncedSearch,
        genre: selectedGenre,
        decade: selectedDecade,
        language: selectedLanguage,
        verification: selectedVerification,
        ordering,
        page: nextPage,
      });
      setSongs((prev) => [...prev, ...res.results]);
      setHasMore(Boolean(res.next));
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more songs', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, debouncedSearch, selectedGenre, selectedDecade, selectedLanguage, selectedVerification, ordering]);

  const clearFilters = () => {
    setSearch('');
    setSelectedGenre('');
    setSelectedDecade('');
    setSelectedLanguage('');
    setSelectedVerification('');
    setOrdering('-release_year');
  };

  const hasActiveFilters = Boolean(search || selectedGenre || selectedDecade || selectedLanguage || selectedVerification);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-sm">
          {t.catalog.heading}
        </h1>
        <p className="text-xs text-neutral-500 font-nepali mt-1">
          {t.catalog.subheading}
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-black/60 backdrop-blur-md rounded-3xl border border-white/10 p-5 md:p-7 mb-8 shadow-2xl space-y-4">
        
        {/* Main Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === 'ne' ? 'गीत, गायक, रचनाकार वा नेपाली युनिकोडमा खोज्नुहोस्...' : 'Search songs, artists, composer or lyrics (Nepali / Romanized)...'}
            className="w-full pl-12 pr-10 py-3.5 rounded-full bg-neutral-950 border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none placeholder:text-neutral-500 shadow-inner font-medium transition-colors duration-300"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters and Sorting Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* Genre Filter */}
          <div>
            <label className="block text-xs font-mono text-neutral-500 uppercase mb-1 tracking-widest">
              Genre (विधा)
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:border-red-500 focus:outline-none"
            >
              <option value="">{t.catalog.allGenres}</option>
              {groupedGenres.map((group) => (
                <optgroup key={group.category} label={group.label}>
                  {group.genres.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {locale === 'ne' ? g.name_ne || g.name : g.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Decade Filter */}
          <div>
            <label className="block text-xs font-mono text-neutral-500 uppercase mb-1 tracking-widest">
              Decade (दशक)
            </label>
            <select
              value={selectedDecade}
              onChange={(e) => setSelectedDecade(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:border-red-500 focus:outline-none"
            >
              <option value="">{t.catalog.allDecades}</option>
              <option value="1960s">1960s (२०२० दशक)</option>
              <option value="1970s">1970s (२०३० दशक)</option>
              <option value="1980s">1980s (२०४० दशक)</option>
              <option value="1990s">1990s (२०५० दशक)</option>
              <option value="2000s">2000s (२०६० दशक)</option>
              <option value="2010s">2010s (२०७० दशक)</option>
              <option value="2020s">2020s (२०८० दशक)</option>
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-xs font-mono text-neutral-500 uppercase mb-1 tracking-widest">
              Language (भाषा)
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:border-red-500 focus:outline-none"
            >
              <option value="">{t.catalog.allLanguages}</option>
              {languages.map((l) => (
                <option key={l.language} value={l.language}>
                  {l.language} ({l.count})
                </option>
              ))}
            </select>
          </div>

          {/* Verification Status */}
          <div>
            <label className="block text-xs font-mono text-neutral-500 uppercase mb-1 tracking-widest">
              Verification (प्रमाणन)
            </label>
            <select
              value={selectedVerification}
              onChange={(e) => setSelectedVerification(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:border-red-500 focus:outline-none"
            >
              <option value="">All Recordings</option>
              <option value="verified">Verified Official Only</option>
              <option value="demo">Catalog Entries</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-xs font-mono text-neutral-500 uppercase mb-1 tracking-widest">
              Sort By (क्रम)
            </label>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:border-red-500 focus:outline-none"
            >
              <option value="-release_year">{t.catalog.sortYearDesc}</option>
              <option value="release_year">{t.catalog.sortYearAsc}</option>
              <option value="-play_count">{t.catalog.sortPlays}</option>
              <option value="title">{t.catalog.sortTitle}</option>
            </select>
          </div>
        </div>

        {/* Clear Filters pill bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-white/8 text-xs">
            <span className="text-neutral-500 font-mono">
              Found {totalCount} tracks matching filters
            </span>
            <button
              onClick={clearFilters}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 font-bold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear all filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Song List Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <div className="text-center py-16 bg-white/3 rounded-2xl border border-white/8 p-8">
          <Music className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-black text-white mb-1">
            {t.catalog.noResults}
          </h3>
          <p className="text-xs text-cream-300 font-nepali mb-5 font-medium">
            फरक शब्द वा विधा छनौट गरी पुनः खोज्नुहोस्।
          </p>
          <button
            onClick={clearFilters}
            className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-glow-red border border-red-500/50 transition-all duration-300 ease-out hover:scale-105 active:scale-95"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}

      {/* Load More (API paginates 24 per page) */}
      {!loading && songs.length > 0 && (
        <div className="flex flex-col items-center gap-3 mt-10 pt-8 border-t border-white/8">
          <span className="text-xs text-neutral-500 font-mono">
            Showing {songs.length} of {totalCount} tracks
          </span>
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-white/5 hover:bg-red-600 text-white font-bold text-xs border border-white/10 hover:border-red-500 transition-all duration-300 ease-out disabled:opacity-60 disabled:hover:bg-white/5 disabled:hover:border-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${loadingMore ? 'animate-spin' : ''}`} />
              <span>{loadingMore ? 'Loading...' : 'Load More Tracks'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
