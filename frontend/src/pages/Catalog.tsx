import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Song, Genre, GenreCategory } from '../types';
import { SongCard } from '../components/SongCard';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { Search, X, Music, RefreshCw } from 'lucide-react';
import { groupGenresByCategory } from '../utils/genreTaxonomy';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface CatalogProps {
  initialGenre?: string;
  initialDecade?: string;
  initialLanguage?: string;
}

/**
 * Initial query for `/catalog?q=…` — the target of the site's SearchAction
 * (see the WebSite JSON-LD in index.html). Capped because it flows straight
 * into an RPC argument.
 */
const readQueryFromUrl = (): string => {
  const q = new URLSearchParams(window.location.search).get('q');
  return q ? q.slice(0, 100) : '';
};

export const Catalog: React.FC<CatalogProps> = ({ initialGenre, initialDecade, initialLanguage }) => {
  const { locale, t } = useI18n();
  const [search, setSearch] = useState(readQueryFromUrl);
  // Seeded with the same value so a deep-linked search fetches once instead of
  // showing "no results" first and correcting itself 300ms later.
  const [debouncedSearch, setDebouncedSearch] = useState(readQueryFromUrl);
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre || '');
  const [selectedDecade, setSelectedDecade] = useState<string>(initialDecade || '');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLanguage || '');
  const [selectedVerification, setSelectedVerification] = useState<string>('');
  const [ordering, setOrdering] = useState<string>('-release_year');
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [categories, setCategories] = useState<GenreCategory[]>([]);
  const [languages, setLanguages] = useState<{ language: string; count: number }[]>([]);
  const [decades, setDecades] = useState<{ decade: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Monotonic id for the song query. Two quick filter/search changes put two
  // requests in flight; without this guard the slower, older response lands
  // last and overwrites the newer result set (and a "load more" from the old
  // filter can append onto the new one). Bumping it on unmount also stops
  // in-flight responses from setting state on an unmounted page.
  const requestIdRef = useRef(0);
  useEffect(() => () => { requestIdRef.current += 1; }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load genres, languages and decades for the filter dropdowns
  useEffect(() => {
    api.getGenres().then(setGenres).catch(console.error);
    api.getLanguages().then(setLanguages).catch(console.error);
    api.getGenreCategories().then(setCategories).catch(console.error);
    // Decades come from the catalog rather than a hardcoded list, so a
    // deep-linked decade that this deployment actually publishes always has a
    // matching option (previously a 1950s link showed "All Decades" while
    // silently filtering).
    api.getDecades().then(setDecades).catch(console.error);
  }, []);

  const groupedGenres = groupGenresByCategory(genres, categories);

  const fetchSongs = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadError(null);
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
      // A newer query superseded this one while it was in flight.
      if (requestId !== requestIdRef.current) return;
      setSongs(res.results);
      setTotalCount(res.count);
      setHasMore(Boolean(res.next));
      setPage(1);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to load songs', err);
      // The previous list would otherwise stay on screen looking current.
      setSongs([]);
      setTotalCount(0);
      setHasMore(false);
      setLoadError(
        'Could not load songs — check your connection and retry. / गीत लोड गर्न सकिएन।'
      );
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [debouncedSearch, selectedGenre, selectedDecade, selectedLanguage, selectedVerification, ordering]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    // Join the *current* query rather than starting a new one: a filter change
    // bumps the id, which invalidates any page-2 append still in flight.
    const requestId = requestIdRef.current;
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
      if (requestId !== requestIdRef.current) return;
      setSongs((prev) => [...prev, ...res.results]);
      setHasMore(Boolean(res.next));
      setPage(nextPage);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to load more songs', err);
      setLoadError('Could not load the next page — check your connection and retry.');
    } finally {
      if (requestId === requestIdRef.current) setLoadingMore(false);
    }
  }, [page, loadingMore, debouncedSearch, selectedGenre, selectedDecade, selectedLanguage, selectedVerification, ordering]);

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
      
      <Breadcrumbs
        items={[
          { name: t.pages.home, path: '/' },
          { name: t.pages.catalog, path: '/catalog' },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-sm">
          {t.catalog.heading}
        </h1>
        <p className="text-xs text-neutral-500 font-nepali mt-1">
          {t.catalog.subheading}
        </p>
      </div>

      {/* Failed load: replace the silent stale/empty list with a real message */}
      {loadError && !loading && (
        <div role="alert" className="mb-6 rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 flex flex-wrap items-center gap-3">
          <p className="flex-1 min-w-[200px] text-sm text-amber-100">{loadError}</p>
          <button
            onClick={() => void fetchSongs()}
            aria-label={locale === 'ne' ? 'पुनः प्रयास गर्नुहोस्' : 'Retry loading songs'}
            className="flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {locale === 'ne' ? 'पुनः प्रयास' : 'Retry'}
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-black/60 backdrop-blur-md rounded-3xl border border-white/10 p-5 md:p-7 mb-8 shadow-2xl space-y-4">
        
        {/* Main Search Input */}
        <div className="relative">
          <label htmlFor="catalog-search" className="sr-only">
            {locale === 'ne' ? 'गीत खोज्नुहोस्' : 'Search songs'}
          </label>
          <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="catalog-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === 'ne' ? 'गीत, गायक, रचनाकार वा नेपाली युनिकोडमा खोज्नुहोस्...' : 'Search songs, artists, composer or lyrics (Nepali / Romanized)...'}
            className="w-full pl-12 pr-10 py-3.5 rounded-full bg-neutral-950 border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none placeholder:text-neutral-500 shadow-inner font-medium transition-colors duration-300"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label={locale === 'ne' ? 'खोज खाली गर्नुहोस्' : 'Clear search'}
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
            <label htmlFor="catalog-genre" className="block text-xs font-mono text-neutral-500 uppercase mb-1 tracking-widest">
              Genre (विधा)
            </label>
            <select
              id="catalog-genre"
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
            <label htmlFor="catalog-decade" className="block text-xs font-mono text-neutral-500 uppercase mb-1 tracking-widest">
              Decade (दशक)
            </label>
            <select
              id="catalog-decade"
              value={selectedDecade}
              onChange={(e) => setSelectedDecade(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:border-red-500 focus:outline-none"
            >
              <option value="">{t.catalog.allDecades}</option>
              {/* Keep a deep-linked decade visible even if the RPC has not
                  reported it yet, so the control never lies about being on
                  "All Decades" while the results are filtered. */}
              {selectedDecade && !decades.some((d) => d.decade === selectedDecade) && (
                <option value={selectedDecade}>{selectedDecade}</option>
              )}
              {decades.map((d) => (
                <option key={d.decade} value={d.decade}>
                  {d.decade} ({d.count})
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label htmlFor="catalog-language" className="block text-xs font-mono text-neutral-500 uppercase mb-1 tracking-widest">
              Language (भाषा)
            </label>
            <select
              id="catalog-language"
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
            <label htmlFor="catalog-verification" className="block text-xs font-mono text-neutral-500 uppercase mb-1 tracking-widest">
              Verification (प्रमाणन)
            </label>
            <select
              id="catalog-verification"
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
            <label htmlFor="catalog-ordering" className="block text-xs font-mono text-neutral-500 uppercase mb-1 tracking-widest">
              Sort By (क्रम)
            </label>
            <select
              id="catalog-ordering"
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
