import React, { useState, useEffect } from 'react';
import { X, Lock, LogOut, AlertTriangle, ShieldCheck, FileText, Database, Plus, Search, Radio, Trash2, RefreshCw, FolderTree, ChevronLeft, ChevronRight, Pencil, ArrowUp, ArrowDown, ListMusic, TrendingUp, Star } from 'lucide-react';
import { api } from '../services/api';
import { AdminStats, TakedownTicket, AuditLogItem, Song, Station, Artist, AuthUser, Genre, GenreCategory, StationQueueItem, AdminInsights } from '../types';
import { resolveCategories, categoryLabel } from '../utils/genreTaxonomy';


interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCatalogUpdated?: () => void;
}

const CATALOG_PAGE_SIZE = 25;

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onCatalogUpdated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'stats' | 'insights' | 'songs' | 'addSong' | 'taxonomy' | 'stations' | 'takedowns' | 'audit' | 'security'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [categories, setCategories] = useState<GenreCategory[]>([]);
  const [takedowns, setTakedowns] = useState<TakedownTicket[]>([]);
  const [takedownStatuses, setTakedownStatuses] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [songSearch, setSongSearch] = useState('');

  // Catalog management state: server-side filters + pagination
  const [songStatusFilter, setSongStatusFilter] = useState('all');
  const [songCategoryFilter, setSongCategoryFilter] = useState('all');
  const [songLanguageFilter, setSongLanguageFilter] = useState('all');
  const [songPage, setSongPage] = useState(1);
  const [songCount, setSongCount] = useState(0);

  // Inline song editing
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Bulk selection + action state
  const [selectedSongIds, setSelectedSongIds] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState('none');
  const [bulkValue, setBulkValue] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  // Taxonomy (genres + artists + categories) management state
  const [taxonomyMessage, setTaxonomyMessage] = useState<string | null>(null);
  const [taxonomyBusy, setTaxonomyBusy] = useState(false);
  const [genreForm, setGenreForm] = useState({ name: '', name_ne: '', category: 'popular', description: '' });
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [artistSearch, setArtistSearch] = useState('');
  const [artistForm, setArtistForm] = useState({ display_name: '', display_name_ne: '', biography: '', verification_status: 'verified' });
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', name_ne: '', description: '' });

  // Add song form state
  const [newTitle, setNewTitle] = useState('');
  const [newTitleNe, setNewTitleNe] = useState('');
  const [newArtistId, setNewArtistId] = useState('');
  const [newGenreId, setNewGenreId] = useState('');
  const [newSecondaryGenreIds, setNewSecondaryGenreIds] = useState<number[]>([]);
  const [newLanguage, setNewLanguage] = useState('Nepali');
  const [newStatus, setNewStatus] = useState<'published' | 'draft'>('published');
  const [newVideoId, setNewVideoId] = useState('');
  const [newYear, setNewYear] = useState('1985');
  const [songSuccessMsg, setSongSuccessMsg] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Station editing state
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [stationForm, setStationForm] = useState({ title: '', title_ne: '', tagline: '', cover_image: '', theme_color: '#C7A66A', display_order: 0 });
  const [creatingStation, setCreatingStation] = useState(false);

  // Station queue management
  const [queueStation, setQueueStation] = useState<Station | null>(null);
  const [queueItems, setQueueItems] = useState<StationQueueItem[]>([]);
  const [queueBusy, setQueueBusy] = useState(false);
  const [queueSongPicker, setQueueSongPicker] = useState('');

  // Ticket filter state
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketNotes, setTicketNotes] = useState<Record<number, string>>({});

  // Insights / analytics dashboard state
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [insightsDays, setInsightsDays] = useState(30);
  const [insightsBusy, setInsightsBusy] = useState(false);


  const checkAuth = async () => {
    try {
      const user = await api.getCurrentUser();
      if (user.authenticated && user.is_staff) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        loadAdminData();
        return;
      }

      if (user.authenticated) {
        await api.logout();
        setLoginError('Admin access requires a staff account.');
      }

      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch {
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    setSecurityError(null);
    setSecuritySuccess(null);

    try {
      const res = await api.login(username, password);
      if (res.authenticated && res.is_staff) {
        setCurrentUser(res);
        setIsAuthenticated(true);
        loadAdminData();
      } else {
        setLoginError('Admin access requires a staff account.');
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPassword('');
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    setLoginError(null);
    setSecurityError(null);
    setSecuritySuccess(null);
    setActiveTab('stats');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityLoading(true);
    setSecurityError(null);
    setSecuritySuccess(null);

    try {
      const res = await api.changeAdminPassword(passwordForm);
      setSecuritySuccess(res.message);
      setCurrentUser(res.user);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setSecurityLoading(false);
    }
  };

  const loadSongs = async (overrides: {
    search?: string;
    status?: string;
    category?: string;
    language?: string;
    page?: number;
  } = {}) => {
    try {
      const data = await api.getAdminSongs({
        search: overrides.search ?? songSearch,
        status: overrides.status ?? songStatusFilter,
        category: overrides.category ?? songCategoryFilter,
        language: overrides.language ?? songLanguageFilter,
        page: overrides.page ?? songPage,
        page_size: CATALOG_PAGE_SIZE,
        ordering: '-id',
      });
      setSongs(data.results);
      setSongCount(data.count);
      // If the current page vanished (e.g. after deletes), step back one page
      const totalPages = Math.max(1, Math.ceil(data.count / CATALOG_PAGE_SIZE));
      if (data.results.length === 0 && (overrides.page ?? songPage) > totalPages) {
        await loadSongs({ ...overrides, page: totalPages });
        return;
      }
      setSelectedSongIds((prev) => {
        const visibleIds = new Set(data.results.map((song) => song.id));
        const next = new Set<number>();
        prev.forEach((id) => {
          if (visibleIds.has(id)) next.add(id);
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to load songs', err);
    }
  };

  const loadInsights = async (days?: number) => {
    const window = days ?? insightsDays;
    setInsightsBusy(true);
    try {
      const data = await api.getAdminInsights(window);
      setInsights(data);
    } catch (err) {
      console.error('Failed to load insights', err);
    } finally {
      setInsightsBusy(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [statsData, takedownData, auditData, stationsData, artistsData, genresData, categoriesData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminTakedowns(),
        api.getAdminAuditLogs(),
        api.getAdminStations(),
        api.getAdminArtists(),
        api.getAdminGenres(),
        api.getAdminGenreCategories(),
      ]);
      setStats(statsData);
      setTakedowns(takedownData.results);
      setTakedownStatuses(takedownData.available_statuses);
      setAuditLogs(auditData);
      setStations(stationsData);
      setArtists(artistsData);
      setGenres(genresData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
    await loadSongs();
    await loadInsights();
  };

  const handleTogglePublication = async (song: Song) => {
    const nextStatus = song.publication_status === 'published' ? 'taken_down' : 'published';
    try {
      await api.updateAdminSong(song.id, { publication_status: nextStatus });
      loadAdminData();
      onCatalogUpdated?.();
    } catch {
      alert('Failed to update publication status.');
    }
  };

  const handleDeleteSong = async (id: number) => {
    if (!window.confirm('Are you sure you want to unpublish and archive this song?')) return;
    try {
      await api.deleteAdminSong(id);
      loadAdminData();
      onCatalogUpdated?.();
    } catch {
      alert('Failed to remove song.');
    }
  };

  // ---- Selection helpers ----

  const toggleSongSelection = (id: number) => {
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allPageSelected = songs.length > 0 && songs.every((song) => selectedSongIds.has(song.id));

  const toggleSelectAllOnPage = () => {
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        songs.forEach((song) => next.delete(song.id));
      } else {
        songs.forEach((song) => next.add(song.id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedSongIds(new Set());

  // ---- Bulk actions ----

  const runBulkAction = async (action: string, extra: Record<string, unknown> = {}) => {
    const ids = Array.from(selectedSongIds);
    if (ids.length === 0 || action === 'none') return;

    if (action === 'delete') {
      const preview = await api.bulkAdminSongs({ action: 'delete', ids, preview: true }).catch(() => null);
      const impact = preview
        ? `\n\nThis removes ${preview.affected} song(s), ${preview.station_links_removed} station link(s) and ${preview.favorites_removed} favorite(s). This cannot be undone.`
        : '\n\nThis cannot be undone.';
      if (!window.confirm(`Permanently delete ${ids.length} selected song(s)?${impact}`)) return;
    }

    if (action === 'move_category') {
      const target = window.prompt(
        'Move to which genre category?\nValid options: classical_traditional, folk, popular, regional, special\n(Songs whose genre has no counterpart there need a fallback genre — use "move to genre" for precision.)',
      );
      if (!target) return;
      extra = { ...extra, target_category: target.trim() };
    }

    setBulkBusy(true);
    setBulkMessage(null);
    try {
      const result = await api.bulkAdminSongs({ action, ids, ...extra });
      const label = action.replace(/_/g, ' ');
      setBulkMessage(`${label}: ${result.affected} song(s) affected${result.skipped ? `, ${result.skipped} skipped` : ''}.`);
      clearSelection();
      setBulkAction('none');
      setBulkValue('');
      await loadAdminData();
      onCatalogUpdated?.();
    } catch (err) {
      setBulkMessage(err instanceof Error ? err.message : 'Bulk action failed.');
    } finally {
      setBulkBusy(false);
    }
  };

  const applyBulkAction = () => {
    switch (bulkAction) {
      case 'set_status':
      case 'set_verification':
      case 'set_language':
      case 'set_decade':
        if (!bulkValue.trim()) {
          setBulkMessage('Pick a value for this action first.');
          return;
        }
        runBulkAction(bulkAction, { value: bulkValue });
        return;
      case 'move_genre': {
        const genreId = Number(bulkValue);
        if (!genreId) {
          setBulkMessage('Pick a destination genre first.');
          return;
        }
        runBulkAction('move_genre', { genre_id: genreId });
        return;
      }
      case 'assign_artist': {
        const artistId = Number(bulkValue);
        if (!artistId) {
          setBulkMessage('Pick an artist first.');
          return;
        }
        runBulkAction('assign_artist', { artist_id: artistId });
        return;
      }
      case 'add_to_station':
      case 'remove_from_station': {
        const stationId = Number(bulkValue);
        if (!stationId) {
          setBulkMessage('Pick a station first.');
          return;
        }
        runBulkAction(bulkAction, { station_id: stationId });
        return;
      }
      case 'move_category':
        runBulkAction('move_category', {});
        return;
      default:
        runBulkAction(bulkAction);
    }
  };

  // ---- Taxonomy management (genres + artists) ----

  const defaultCategory = () => {
    const ordered = resolveCategories(categories);
    return ordered[0]?.slug ?? 'popular';
  };

  const handleCreateGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genreForm.name.trim()) return;
    setTaxonomyBusy(true);
    setTaxonomyMessage(null);
    try {
      const created = await api.createAdminGenre({
        name: genreForm.name.trim(),
        name_ne: genreForm.name_ne.trim(),
        category: genreForm.category || defaultCategory(),
        description: genreForm.description.trim(),
      });
      setTaxonomyMessage(`Genre "${created.name}" created.`);
      setGenreForm({ name: '', name_ne: '', category: defaultCategory(), description: '' });
      await loadAdminData();
      onCatalogUpdated?.();
    } catch (err) {
      setTaxonomyMessage(err instanceof Error ? err.message : 'Failed to create genre.');
    } finally {
      setTaxonomyBusy(false);
    }
  };

  const handleSaveGenreEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGenre) return;
    setTaxonomyBusy(true);
    setTaxonomyMessage(null);
    try {
      const updated = await api.updateAdminGenre(editingGenre.id, {
        name: editingGenre.name.trim(),
        name_ne: editingGenre.name_ne?.trim() || '',
        category: editingGenre.category,
        description: editingGenre.description?.trim() || '',
        is_active: editingGenre.is_active,
      });
      setTaxonomyMessage(`Genre "${updated.name}" updated.`);
      setEditingGenre(null);
      await loadAdminData();
      onCatalogUpdated?.();
    } catch (err) {
      setTaxonomyMessage(err instanceof Error ? err.message : 'Failed to update genre.');
    } finally {
      setTaxonomyBusy(false);
    }
  };

  const handleGenreCategoryChange = async (genre: Genre, category: string) => {
    if (category === genre.category) return;
    setTaxonomyBusy(true);
    setTaxonomyMessage(null);
    try {
      await api.updateAdminGenre(genre.id, { category });
      setTaxonomyMessage(`"${genre.name}" moved to ${categoryLabel(category, categories)}.`);
      await loadAdminData();
      onCatalogUpdated?.();
    } catch (err) {
      setTaxonomyMessage(err instanceof Error ? err.message : 'Failed to move genre.');
    } finally {
      setTaxonomyBusy(false);
    }
  };

  const handleGenreToggleActive = async (genre: Genre) => {
    setTaxonomyBusy(true);
    setTaxonomyMessage(null);
    try {
      await api.updateAdminGenre(genre.id, { is_active: !genre.is_active });
      setTaxonomyMessage(`"${genre.name}" ${genre.is_active ? 'hidden from' : 'restored to'} catalog filters.`);
      await loadAdminData();
      onCatalogUpdated?.();
    } catch {
      setTaxonomyMessage('Failed to update genre.');
    } finally {
      setTaxonomyBusy(false);
    }
  };

  const handleGenreDelete = async (genre: Genre) => {
    setTaxonomyBusy(true);
    setTaxonomyMessage(null);
    try {
      await api.deleteAdminGenre(genre.id);
      setTaxonomyMessage(`Genre "${genre.name}" deleted.`);
      await loadAdminData();
      onCatalogUpdated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete genre.';
      if (message.toLowerCase().includes('reassign_to')) {
        const target = window.prompt(
          `"${genre.name}" still has songs.\nEnter the ID of another genre to move them to (IDs are shown in the list):`,
        );
        const targetId = Number(target);
        if (!targetId) {
          setTaxonomyMessage('Delete cancelled — no reassignment target chosen.');
          setTaxonomyBusy(false);
          return;
        }
        try {
          await api.deleteAdminGenre(genre.id, targetId);
          setTaxonomyMessage(`Genre "${genre.name}" deleted; its songs were reassigned.`);
          await loadAdminData();
          onCatalogUpdated?.();
        } catch (err2) {
          setTaxonomyMessage(err2 instanceof Error ? err2.message : 'Failed to delete genre.');
        }
      } else {
        setTaxonomyMessage(message);
      }
    } finally {
      setTaxonomyBusy(false);
    }
  };

  const handleArtistDelete = async (artist: Artist) => {
    setTaxonomyBusy(true);
    setTaxonomyMessage(null);
    try {
      await api.deleteAdminArtist(artist.id);
      setTaxonomyMessage(`Artist "${artist.display_name}" deleted.`);
      await loadAdminData();
      onCatalogUpdated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete artist.';
      if (message.toLowerCase().includes('reassign_to')) {
        const target = window.prompt(
          `"${artist.display_name}" still has songs.\nEnter the ID of another artist to move them to (this also merges two artists):`,
        );
        const targetId = Number(target);
        if (!targetId) {
          setTaxonomyMessage('Delete cancelled — no reassignment target chosen.');
          setTaxonomyBusy(false);
          return;
        }
        try {
          await api.deleteAdminArtist(artist.id, targetId);
          setTaxonomyMessage(`Artist "${artist.display_name}" deleted; songs reassigned.`);
          await loadAdminData();
          onCatalogUpdated?.();
        } catch (err2) {
          setTaxonomyMessage(err2 instanceof Error ? err2.message : 'Failed to delete artist.');
        }
      } else {
        setTaxonomyMessage(message);
      }
    } finally {
      setTaxonomyBusy(false);
    }
  };

  const handleCreateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    setSongSuccessMsg(null);
    if (!newArtistId) {
      alert('Pick an artist (create one under the Taxonomy tab first if needed).');
      return;
    }
    try {
      await api.createAdminSong({
        title: newTitle,
        title_ne: newTitleNe,
        artist: Number(newArtistId),
        primary_genre: newGenreId ? Number(newGenreId) : null,
        secondary_genres: newSecondaryGenreIds.filter((id) => Number(newGenreId) !== id),
        language: newLanguage.trim() || 'Nepali',
        provider_video_id: newVideoId,
        release_year: parseInt(newYear) || null,
        metadata_verification_status: 'verified',
        publication_status: newStatus,
        artwork_url: `https://img.youtube.com/vi/${newVideoId}/hqdefault.jpg`,
      });
      setSongSuccessMsg(`Added track "${newTitle}" successfully!`);
      setNewTitle('');
      setNewTitleNe('');
      setNewVideoId('');
      setNewSecondaryGenreIds([]);
      loadAdminData();
      onCatalogUpdated?.();
    } catch {
      alert('Error creating song.');
    }
  };

  const handleSaveStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    try {
      await api.updateAdminStation(editingStation.id, {
        title: editingStation.title,
        title_ne: editingStation.title_ne,
        tagline: editingStation.tagline,
        tagline_ne: editingStation.tagline_ne,
        cover_image: editingStation.cover_image,
        theme_color: editingStation.theme_color,
        display_order: editingStation.display_order,
        is_active: editingStation.is_active,
        is_featured: editingStation.is_featured,
      });
      setEditingStation(null);
      loadAdminData();
      onCatalogUpdated?.();
    } catch {
      alert('Failed to update station.');
    }
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationForm.title.trim()) return;
    try {
      const created = await api.createAdminStation({
        title: stationForm.title.trim(),
        title_ne: stationForm.title_ne.trim(),
        tagline: stationForm.tagline.trim(),
        cover_image: stationForm.cover_image.trim(),
        theme_color: stationForm.theme_color,
        display_order: stationForm.display_order || 0,
      });
      setStationForm({ title: '', title_ne: '', tagline: '', cover_image: '', theme_color: '#C7A66A', display_order: 0 });
      setCreatingStation(false);
      setActiveTab('stations');
      loadAdminData();
      onCatalogUpdated?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create station.');
    }
  };

  const handleDeleteStation = async (station: Station) => {
    if (!window.confirm(`Delete station "${station.title}"? This removes its queue links but keeps the songs.`)) return;
    try {
      const res = await api.deleteAdminStation(station.id);
      setBulkMessage(res.message);
      loadAdminData();
      onCatalogUpdated?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete station.');
    }
  };

  // ---- Featured content curation (home hero) ----

  const sortedFeaturedSongs = songs
    .filter((s) => s.is_featured)
    .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0));

  const handleToggleSongFeatured = async (song: Song) => {
    try {
      const payload = song.is_featured
        ? { is_featured: false }
        : { is_featured: true, featured_order: sortedFeaturedSongs.length };
      await api.updateAdminSong(song.id, payload);
      await loadSongs();
      onCatalogUpdated?.();
    } catch {
      alert('Failed to update featured song.');
    }
  };

  const handleMoveFeaturedSong = async (song: Song, direction: -1 | 1) => {
    const ordered = [...sortedFeaturedSongs];
    const index = ordered.findIndex((s) => s.id === song.id);
    const target = ordered[index + direction];
    if (!target) return;
    try {
      await api.updateAdminSong(song.id, { featured_order: target.featured_order ?? 0 });
      await api.updateAdminSong(target.id, { featured_order: song.featured_order ?? 0 });
      await loadSongs();
      onCatalogUpdated?.();
    } catch {
      alert('Failed to reorder featured songs.');
    }
  };

  const handleToggleStationFeatured = async (station: Station) => {
    try {
      await api.updateAdminStation(station.id, { is_featured: !station.is_featured });
      loadAdminData();
      onCatalogUpdated?.();
    } catch {
      alert('Failed to update featured station.');
    }
  };

  // ---- Station queue management ----

  const openQueue = async (station: Station) => {
    setQueueStation(station);
    setQueueSongPicker('');
    setQueueBusy(true);
    try {
      const data = await api.getStationQueue(station.id);
      setQueueItems(data.queue);
    } catch {
      setQueueItems([]);
    } finally {
      setQueueBusy(false);
    }
  };

  const queueAddSong = async () => {
    if (!queueStation || !queueSongPicker) return;
    setQueueBusy(true);
    try {
      await api.addToStationQueue(queueStation.id, [Number(queueSongPicker)]);
      const data = await api.getStationQueue(queueStation.id);
      setQueueItems(data.queue);
      setQueueSongPicker('');
      onCatalogUpdated?.();
    } catch {
      alert('Failed to add song to queue.');
    } finally {
      setQueueBusy(false);
    }
  };

  const queueRemoveSong = async (songId: number) => {
    if (!queueStation) return;
    setQueueBusy(true);
    try {
      await api.removeFromStationQueue(queueStation.id, songId);
      const data = await api.getStationQueue(queueStation.id);
      setQueueItems(data.queue);
      onCatalogUpdated?.();
    } catch {
      alert('Failed to remove song.');
    } finally {
      setQueueBusy(false);
    }
  };

  const queueMove = async (index: number, direction: -1 | 1) => {
    if (!queueStation) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= queueItems.length) return;
    const reordered = [...queueItems];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    setQueueItems(reordered);
    setQueueBusy(true);
    try {
      await api.reorderStationQueue(queueStation.id, reordered.map((item) => item.song_id));
      onCatalogUpdated?.();
    } catch {
      alert('Failed to reorder queue.');
    } finally {
      setQueueBusy(false);
    }
  };

  // ---- Inline song editing ----

  const handleSaveSongEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;
    try {
      await api.updateAdminSong(editingSong.id, {
        title: editingSong.title.trim(),
        title_ne: editingSong.title_ne?.trim() || '',
        romanized_title: editingSong.romanized_title?.trim() || '',
        language: editingSong.language?.trim() || 'Nepali',
        release_year: editingSong.release_year ?? null,
        primary_genre: editingSong.primary_genre ?? null,
        artist: editingSong.artist,
        composer: editingSong.composer || '',
        lyricist: editingSong.lyricist || '',
        album: editingSong.album || '',
        film_or_source: editingSong.film_or_source || '',
        mood_tags: editingSong.mood_tags ?? [],
        duration_seconds: editingSong.duration_seconds ?? null,
        provider_video_id: editingSong.provider_video_id,
        artwork_url: editingSong.artwork_url || '',
        source_url: editingSong.source_url || '',
        attribution: editingSong.attribution || '',
        publication_status: editingSong.publication_status,
        metadata_verification_status: editingSong.metadata_verification_status,
        is_featured: editingSong.is_featured ?? false,
        featured_order: editingSong.featured_order ?? 0,
        secondary_genres: editingSong.secondary_genres ?? [],
      });
      setEditingSong(null);
      await loadSongs();
      onCatalogUpdated?.();
    } catch {
      alert('Failed to update song.');
    }
  };

  // ---- Artist create / edit ----

  const handleSaveArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistForm.display_name.trim()) return;
    setTaxonomyBusy(true);
    setTaxonomyMessage(null);
    try {
      const payload = {
        display_name: artistForm.display_name.trim(),
        display_name_ne: artistForm.display_name_ne.trim(),
        biography: artistForm.biography.trim(),
        verification_status: artistForm.verification_status,
      };
      if (editingArtist) {
        const updated = await api.updateAdminArtist(editingArtist.id, payload);
        setTaxonomyMessage(`Artist "${updated.display_name}" updated.`);
        setEditingArtist(null);
      } else {
        const created = await api.createAdminArtist(payload);
        setTaxonomyMessage(`Artist "${created.display_name}" created.`);
      }
      setArtistForm({ display_name: '', display_name_ne: '', biography: '', verification_status: 'verified' });
      await loadAdminData();
      onCatalogUpdated?.();
    } catch (err) {
      setTaxonomyMessage(err instanceof Error ? err.message : 'Failed to save artist.');
    } finally {
      setTaxonomyBusy(false);
    }
  };

  const startEditArtist = (artist: Artist) => {
    setEditingArtist(artist);
    setArtistForm({
      display_name: artist.display_name,
      display_name_ne: artist.display_name_ne || '',
      biography: artist.biography || '',
      verification_status: artist.verification_status,
    });
  };

  // ---- Category CRUD ----

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    setTaxonomyBusy(true);
    setTaxonomyMessage(null);
    try {
      const created = await api.createAdminGenreCategory({
        name: categoryForm.name.trim(),
        name_ne: categoryForm.name_ne.trim(),
        description: categoryForm.description.trim(),
        display_order: (categories.length + 1) * 10,
      });
      setTaxonomyMessage(`Category "${created.name}" created.`);
      setCategoryForm({ name: '', name_ne: '', description: '' });
      await loadAdminData();
      onCatalogUpdated?.();
    } catch (err) {
      setTaxonomyMessage(err instanceof Error ? err.message : 'Failed to create category.');
    } finally {
      setTaxonomyBusy(false);
    }
  };

  const moveCategory = async (category: GenreCategory, direction: -1 | 1) => {
    const ordered = resolveCategories(categories);
    const index = ordered.findIndex((c) => c.slug === category.slug);
    const target = ordered[index + direction];
    if (!target) return;
    const targetCategory = categories.find((c) => c.slug === target.slug);
    if (!targetCategory) return;

    setTaxonomyBusy(true);
    setTaxonomyMessage(null);
    try {
      await api.updateAdminGenreCategory(category.id, { display_order: targetCategory.display_order });
      await api.updateAdminGenreCategory(targetCategory.id, { display_order: category.display_order });
      await loadAdminData();
      onCatalogUpdated?.();
    } catch (err) {
      setTaxonomyMessage(err instanceof Error ? err.message : 'Failed to reorder categories.');
    } finally {
      setTaxonomyBusy(false);
    }
  };

  const handleToggleCategoryActive = async (category: GenreCategory) => {
    setTaxonomyBusy(true);
    setTaxonomyMessage(null);
    try {
      await api.updateAdminGenreCategory(category.id, { is_active: !category.is_active });
      setTaxonomyMessage(`Category "${category.name}" ${category.is_active ? 'hidden' : 'restored'}.`);
      await loadAdminData();
      onCatalogUpdated?.();
    } catch (err) {
      setTaxonomyMessage(err instanceof Error ? err.message : 'Failed to update category.');
    } finally {
      setTaxonomyBusy(false);
    }
  };

  const handleDeleteCategory = async (category: GenreCategory) => {
    setTaxonomyBusy(true);
    setTaxonomyMessage(null);
    try {
      const res = await api.deleteAdminGenreCategory(category.id);
      setTaxonomyMessage(res.message);
      await loadAdminData();
      onCatalogUpdated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category.';
      if (message.toLowerCase().includes('reassign_to') || message.toLowerCase().includes('still holds')) {
        const target = window.prompt(
          `"${category.name}" still holds genres. Enter a category slug to move them to (see the list).`,
        );
        if (!target) {
          setTaxonomyMessage('Delete cancelled — no target chosen.');
          setTaxonomyBusy(false);
          return;
        }
        try {
          const res = await api.deleteAdminGenreCategory(category.id, target.trim());
          setTaxonomyMessage(res.message);
          await loadAdminData();
          onCatalogUpdated?.();
        } catch (err2) {
          setTaxonomyMessage(err2 instanceof Error ? err2.message : 'Failed to delete category.');
        }
      } else {
        setTaxonomyMessage(message);
      }
    } finally {
      setTaxonomyBusy(false);
    }
  };

  // ---- Tickets ----

  const loadTakedowns = async (overrides: { status?: string; search?: string } = {}) => {
    try {
      const data = await api.getAdminTakedowns({
        status: overrides.status ?? ticketStatusFilter,
        search: overrides.search ?? ticketSearch,
      });
      setTakedowns(data.results);
      setTakedownStatuses(data.available_statuses);
    } catch (err) {
      console.error('Failed to load takedowns', err);
    }
  };

  const handleTakedownDecision = async (id: number, statusChoice: string) => {
    const notes = (ticketNotes[id] ?? '').trim() || `Moderated by admin: ${statusChoice}`;
    try {
      await api.handleTakedownAction(id, statusChoice, notes);
      setTicketNotes((prev) => ({ ...prev, [id]: '' }));
      loadAdminData();
      onCatalogUpdated?.();
    } catch {
      alert('Failed to update moderation ticket.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in pd-veil">
      <div className="w-full max-w-5xl bg-neutral-950 border border-red-600/30 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-500 border border-red-600/40 flex items-center justify-center shadow-glow-red">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-white tracking-wide">
                Purano Dhun Admin Portal
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                SECURE CATALOG & GOVERNANCE DASHBOARD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white border border-white/10 text-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                <span>Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Close admin modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {!isAuthenticated ? (
            /* Login Form */
            <div className="max-w-md mx-auto py-10">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-red-600/15 text-red-500 border border-red-500/30 flex items-center justify-center shadow-glow-red mx-auto mb-3">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-white mb-1">
                    Administrator Authentication
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Sign in with an allow-listed Supabase admin account.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-200 rounded-2xl text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="username"
                    className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !username.trim() || !password}
                  className="w-full py-3 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-glow-red transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? 'Authenticating...' : 'Sign In as Administrator'}
                </button>
              </form>
            </div>
          ) : (
            /* Admin Tabs */
            <div>
              {/* Tab navigation */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 overflow-x-auto">
                {[
                  { id: 'stats', label: 'Overview', icon: Database },
                  { id: 'insights', label: 'Insights', icon: TrendingUp },
                  { id: 'songs', label: `Catalog (${songCount})`, icon: ShieldCheck },
                  { id: 'addSong', label: 'Add Track', icon: Plus },
                  { id: 'taxonomy', label: `Taxonomy (${genres.length})`, icon: FolderTree },
                  { id: 'stations', label: `Stations (${stations.length})`, icon: Radio },
                  { id: 'takedowns', label: `Tickets (${takedowns.filter(t => t.status === 'pending').length})`, icon: AlertTriangle },
                  { id: 'security', label: 'Security', icon: Lock },
                  { id: 'audit', label: 'Audit Log', icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ease-out whitespace-nowrap ${
                        isActive
                          ? 'bg-red-600 text-white shadow-glow-red font-bold'
                          : 'bg-black text-neutral-400 hover:text-white border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Stats */}
              {activeTab === 'stats' && stats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-black border border-white/10">
                      <span className="text-xs font-mono text-neutral-400">TOTAL SONGS</span>
                      <p className="font-serif text-3xl font-bold text-white mt-1">{stats.total_songs}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black border border-white/10">
                      <span className="text-xs font-mono text-neutral-400">PUBLISHED SONGS</span>
                      <p className="font-serif text-3xl font-bold text-red-500 mt-1">{stats.published_songs}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black border border-white/10">
                      <span className="text-xs font-mono text-neutral-400">VERIFIED METADATA</span>
                      <p className="font-serif text-3xl font-bold text-white mt-1">{stats.verified_songs}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black border border-white/10">
                      <span className="text-xs font-mono text-neutral-400">PENDING TAKEDOWNS</span>
                      <p className="font-serif text-3xl font-bold text-red-500 mt-1">{stats.pending_takedowns}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black border border-white/10">
                      <span className="text-xs font-mono text-neutral-400">ARTISTS</span>
                      <p className="font-serif text-3xl font-bold text-white mt-1">{stats.total_artists}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black border border-white/10">
                      <span className="text-xs font-mono text-neutral-400">ACTIVE STATIONS</span>
                      <p className="font-serif text-3xl font-bold text-white mt-1">{stats.total_stations}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black border border-white/10">
                      <span className="text-xs font-mono text-neutral-400">GENRES</span>
                      <p className="font-serif text-3xl font-bold text-white mt-1">{stats.total_genres ?? genres.length}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black border border-white/10">
                      <span className="text-xs font-mono text-neutral-400">CATEGORIES</span>
                      <p className="font-serif text-3xl font-bold text-white mt-1">{stats.total_genre_categories ?? categories.length}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black border border-white/10">
                      <span className="text-xs font-mono text-neutral-400">OPEN TICKETS</span>
                      <p className="font-serif text-3xl font-bold text-red-500 mt-1">{stats.takedown_breakdown?.pending ?? stats.pending_takedowns}</p>
                    </div>
                  </div>
                  {stats.category_breakdown && (
                    <div className="space-y-1">
                      <span className="text-xs font-mono text-neutral-500 uppercase">Songs by category</span>
                      <div className="flex flex-wrap gap-2">
                        {resolveCategories(categories).map((category) => (
                          <span key={category.slug} className="px-3 py-1 rounded-full bg-black border border-white/10 text-[11px] font-mono text-neutral-300">
                            {category.label}: <span className="text-red-400 font-bold">{stats.category_breakdown?.[category.slug] ?? 0}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {stats.status_breakdown && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.entries(stats.status_breakdown).map(([status, count]) => (
                        <span key={status} className="px-3 py-1 rounded-full bg-black border border-white/10 text-[11px] font-mono text-neutral-300">
                          {status.replace('_', ' ')}: <span className="text-red-400 font-bold">{count}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Insights (listening analytics) */}
              {activeTab === 'insights' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-500 uppercase">Window</span>
                    {[7, 30, 90].map((days) => (
                      <button
                        key={days}
                        onClick={() => { setInsightsDays(days); loadInsights(days); }}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          insightsDays === days
                            ? 'bg-red-600 text-white border-red-600 font-bold'
                            : 'bg-black text-neutral-400 hover:text-white border-white/10 hover:border-white/20'
                        }`}
                      >
                        {days}d
                      </button>
                    ))}
                    <button
                      onClick={() => loadInsights()}
                      disabled={insightsBusy}
                      className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                      title="Refresh insights"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${insightsBusy ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {!insights ? (
                    <p className="text-xs text-neutral-500 font-mono text-center py-8">
                      {insightsBusy ? 'Loading insights…' : 'No playback data yet.'}
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-black border border-white/10">
                          <span className="text-xs font-mono text-neutral-400">PLAYBACK EVENTS</span>
                          <p className="font-serif text-3xl font-bold text-white mt-1">{insights.total_events}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-black border border-white/10">
                          <span className="text-xs font-mono text-neutral-400">COMPLETION RATE</span>
                          <p className="font-serif text-3xl font-bold text-red-500 mt-1">{insights.completion_rate}%</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-black border border-white/10">
                          <span className="text-xs font-mono text-neutral-400">LISTENERS</span>
                          <p className="font-serif text-3xl font-bold text-white mt-1">{insights.unique_sessions}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-black border border-white/10">
                          <span className="text-xs font-mono text-neutral-400">SKIPS</span>
                          <p className="font-serif text-3xl font-bold text-white mt-1">{insights.skips}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-black border border-white/10">
                          <span className="text-xs font-mono text-neutral-400">ERRORS</span>
                          <p className="font-serif text-3xl font-bold text-red-500 mt-1">{insights.errors}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-black border border-white/10">
                          <span className="text-xs font-mono text-neutral-400">FAVORITES (ALL TIME)</span>
                          <p className="font-serif text-3xl font-bold text-white mt-1">{insights.total_favorites}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-black border border-white/10 space-y-2">
                          <h4 className="font-serif text-sm font-bold text-white">Trending songs (window)</h4>
                          {insights.top_songs.length === 0 && (
                            <p className="text-xs text-neutral-500 font-mono">No playback events in this window.</p>
                          )}
                          {insights.top_songs.map((row) => (
                            <div key={row.song_id} className="flex items-center justify-between gap-3 text-xs">
                              <span className="text-white truncate">{row.title} <span className="text-neutral-500">· {row.artist_name}</span></span>
                              <span className="font-mono text-red-400 font-bold flex-shrink-0">{row.events}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 rounded-2xl bg-black border border-white/10 space-y-2">
                          <h4 className="font-serif text-sm font-bold text-white">Most played (all time)</h4>
                          {insights.most_played.length === 0 && (
                            <p className="text-xs text-neutral-500 font-mono">No plays recorded yet.</p>
                          )}
                          {insights.most_played.map((row) => (
                            <div key={row.song_id} className="flex items-center justify-between gap-3 text-xs">
                              <span className="text-white truncate">{row.title} <span className="text-neutral-500">· {row.artist_name}</span></span>
                              <span className="font-mono text-red-400 font-bold flex-shrink-0">{row.play_count}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 rounded-2xl bg-black border border-white/10 space-y-2">
                          <h4 className="font-serif text-sm font-bold text-white">Most favorited</h4>
                          {insights.most_favorited.length === 0 && (
                            <p className="text-xs text-neutral-500 font-mono">No favorites yet.</p>
                          )}
                          {insights.most_favorited.map((row) => (
                            <div key={row.song_id} className="flex items-center justify-between gap-3 text-xs">
                              <span className="text-white truncate">{row.title} <span className="text-neutral-500">· {row.artist_name}</span></span>
                              <span className="font-mono text-red-400 font-bold flex-shrink-0">{row.favorites}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 rounded-2xl bg-black border border-white/10 space-y-2">
                          <h4 className="font-serif text-sm font-bold text-white">Top stations (window)</h4>
                          {insights.top_stations.length === 0 && (
                            <p className="text-xs text-neutral-500 font-mono">No station playbacks in this window.</p>
                          )}
                          {insights.top_stations.map((row) => (
                            <div key={row.station_id} className="flex items-center justify-between gap-3 text-xs">
                              <span className="text-white truncate">{row.title}</span>
                              <span className="font-mono text-red-400 font-bold flex-shrink-0">{row.events}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {insights.error_events.length > 0 && (
                        <div className="p-4 rounded-2xl bg-black border border-red-500/30 space-y-2">
                          <h4 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" /> Recent playback errors
                          </h4>
                          {insights.error_events.map((row) => (
                            <div key={row.id} className="flex items-center justify-between gap-3 text-xs font-mono">
                              <span className="text-neutral-300 truncate">{row.song_title ?? 'Unknown song'} — {row.message || 'playback failed'}</span>
                              <span className="text-neutral-500 flex-shrink-0">{new Date(row.timestamp).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Tab 2: Catalog Management (All Songs) */}
              {activeTab === 'songs' && (
                <div className="space-y-4">
                  {/* Home featured curation */}
                  <div className="p-4 rounded-2xl bg-black border border-amber-500/20 space-y-3">
                    <h4 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" /> Home Featured ({sortedFeaturedSongs.length}/8)
                    </h4>
                    {sortedFeaturedSongs.length === 0 ? (
                      <p className="text-xs text-neutral-500 font-mono">
                        Nothing pinned — the home page auto-shows verified songs. Use the star on any song below to pin it.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {sortedFeaturedSongs.map((featured, index, arr) => (
                          <div key={featured.id} className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 flex items-center gap-3">
                            <span className="text-[11px] font-mono text-neutral-500 w-6 text-center">{index + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">{featured.title}</p>
                              <p className="text-[10px] font-mono text-neutral-500 truncate">{featured.artist_name}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleMoveFeaturedSong(featured, -1)}
                                disabled={index === 0}
                                className="p-1 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 disabled:opacity-30"
                                title="Move up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveFeaturedSong(featured, 1)}
                                disabled={index === arr.length - 1}
                                className="p-1 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 disabled:opacity-30"
                                title="Move down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleSongFeatured(featured)}
                                className="p-1.5 rounded-full text-amber-400 hover:text-amber-300 hover:bg-amber-950/40"
                                title="Unpin from home featured"
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={songSearch}
                      onChange={(e) => {
                        setSongSearch(e.target.value);
                        setSongPage(1);
                        loadSongs({ search: e.target.value, page: 1 });
                      }}
                      placeholder="Search tracks by title, artist, album, video ID..."
                      className="w-full pl-10 pr-4 py-2 rounded-full bg-black border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Server-side filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={songStatusFilter}
                      onChange={(e) => {
                        setSongStatusFilter(e.target.value);
                        setSongPage(1);
                        loadSongs({ status: e.target.value, page: 1 });
                      }}
                      className="px-3 py-1.5 rounded-full bg-black border border-white/15 text-neutral-300 text-[11px] focus:border-red-500 focus:outline-none"
                    >
                      <option value="all">All statuses</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="disputed">Disputed</option>
                      <option value="taken_down">Taken down</option>
                    </select>
                    <select
                      value={songCategoryFilter}
                      onChange={(e) => {
                        setSongCategoryFilter(e.target.value);
                        setSongPage(1);
                        loadSongs({ category: e.target.value, page: 1 });
                      }}
                      className="px-3 py-1.5 rounded-full bg-black border border-white/15 text-neutral-300 text-[11px] focus:border-red-500 focus:outline-none"
                    >
                      <option value="all">All categories</option>
                      {resolveCategories(categories).map((category) => (
                        <option key={category.slug} value={category.slug}>{category.label}</option>
                      ))}
                    </select>
                    <select
                      value={songLanguageFilter}
                      onChange={(e) => {
                        setSongLanguageFilter(e.target.value);
                        setSongPage(1);
                        loadSongs({ language: e.target.value, page: 1 });
                      }}
                      className="px-3 py-1.5 rounded-full bg-black border border-white/15 text-neutral-300 text-[11px] focus:border-red-500 focus:outline-none"
                    >
                      <option value="all">All languages</option>
                      {Array.from(new Set([...songs.map((s) => s.language), 'Nepali'])).map((language) => (
                        <option key={language} value={language}>{language}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => loadSongs()}
                      className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Refresh catalog"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bulk action bar */}
                  <div className="p-3 rounded-2xl bg-black border border-white/10 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={toggleSelectAllOnPage}
                        disabled={songs.length === 0}
                        className="px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 text-[11px] transition-colors disabled:opacity-50"
                      >
                        {allPageSelected ? 'Deselect page' : 'Select page'}
                      </button>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {selectedSongIds.size} selected
                      </span>
                      {selectedSongIds.size > 0 && (
                        <button
                          onClick={clearSelection}
                          className="text-[11px] text-neutral-500 hover:text-white underline"
                        >
                          clear
                        </button>
                      )}
                      <div className="flex-1" />
                      <span className="text-[10px] font-mono text-neutral-500 uppercase">Bulk actions</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={bulkAction}
                        onChange={(e) => {
                          setBulkAction(e.target.value);
                          setBulkValue('');
                        }}
                        className="px-3 py-1.5 rounded-full bg-neutral-900 border border-white/15 text-white text-[11px] focus:border-red-500 focus:outline-none"
                      >
                        <option value="none">Choose action…</option>
                        <option value="set_status">Set publication status…</option>
                        <option value="move_genre">Move to genre…</option>
                        <option value="move_category">Move to category…</option>
                        <option value="set_verification">Set verification…</option>
                        <option value="set_language">Set language…</option>
                        <option value="set_decade">Set decade…</option>
                        <option value="assign_artist">Assign artist…</option>
                        <option value="add_to_station">Add to station…</option>
                        <option value="remove_from_station">Remove from station…</option>
                        <option value="reset_play_counts">Reset play counts</option>
                        <option value="delete">Permanent delete…</option>
                      </select>
                      {bulkAction === 'set_status' && (
                        <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="px-3 py-1.5 rounded-full bg-neutral-900 border border-white/15 text-white text-[11px]">
                          <option value="">Pick status…</option>
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="disputed">Disputed</option>
                          <option value="taken_down">Taken down</option>
                        </select>
                      )}
                      {bulkAction === 'set_verification' && (
                        <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="px-3 py-1.5 rounded-full bg-neutral-900 border border-white/15 text-white text-[11px]">
                          <option value="">Pick verification…</option>
                          <option value="verified">Verified</option>
                          <option value="community_submitted">Community submitted</option>
                          <option value="demo">Demo</option>
                        </select>
                      )}
                      {bulkAction === 'move_genre' && (
                        <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="px-3 py-1.5 rounded-full bg-neutral-900 border border-white/15 text-white text-[11px]">
                          <option value="">Pick destination genre…</option>
                          {genres.map((genre) => (
                            <option key={genre.id} value={genre.id}>
                              {genre.name} ({categoryLabel(genre.category, categories)})
                            </option>
                          ))}
                        </select>
                      )}
                      {bulkAction === 'assign_artist' && (
                        <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="px-3 py-1.5 rounded-full bg-neutral-900 border border-white/15 text-white text-[11px]">
                          <option value="">Pick artist…</option>
                          {artists.map((artist) => (
                            <option key={artist.id} value={artist.id}>{artist.display_name}</option>
                          ))}
                        </select>
                      )}
                      {(bulkAction === 'add_to_station' || bulkAction === 'remove_from_station') && (
                        <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="px-3 py-1.5 rounded-full bg-neutral-900 border border-white/15 text-white text-[11px]">
                          <option value="">Pick station…</option>
                          {stations.map((station) => (
                            <option key={station.id} value={station.id}>{station.title}</option>
                          ))}
                        </select>
                      )}
                      {bulkAction === 'set_language' && (
                        <input
                          type="text"
                          value={bulkValue}
                          onChange={(e) => setBulkValue(e.target.value)}
                          placeholder="e.g. Nepali, Hindi, Maithili"
                          className="px-3 py-1.5 rounded-full bg-neutral-900 border border-white/15 text-white text-[11px] w-52"
                        />
                      )}
                      {bulkAction === 'set_decade' && (
                        <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="px-3 py-1.5 rounded-full bg-neutral-900 border border-white/15 text-white text-[11px]">
                          <option value="">Pick decade…</option>
                          {['1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'].map((decade) => (
                            <option key={decade} value={decade}>{decade}</option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={applyBulkAction}
                        disabled={bulkBusy || selectedSongIds.size === 0 || bulkAction === 'none'}
                        className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-[11px] font-bold transition-all"
                      >
                        {bulkBusy ? 'Working…' : 'Apply'}
                      </button>
                    </div>
                    {bulkMessage && (
                      <p className="text-[11px] font-mono text-red-300">{bulkMessage}</p>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {songs.map((song) => (
                      <div
                        key={song.id}
                        className="p-3.5 rounded-2xl bg-black border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedSongIds.has(song.id)}
                            onChange={() => toggleSongSelection(song.id)}
                            className="w-4 h-4 accent-red-600 flex-shrink-0 cursor-pointer"
                            aria-label={`Select ${song.title}`}
                          />
                          <img
                            src={song.artwork_url || `https://img.youtube.com/vi/${song.provider_video_id}/hqdefault.jpg`}
                            alt={song.title}
                            className="w-10 h-10 rounded-lg object-cover bg-neutral-900 border border-white/10 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="font-serif text-sm font-bold text-white truncate">
                              {song.title} <span className="text-neutral-400 font-normal">({song.title_ne})</span>
                            </h5>
                            <p className="text-xs text-neutral-400 truncate">
                              {song.artist_name} • {song.primary_genre_name || 'No genre'} • {song.language} • {song.release_year || 'Year?'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleTogglePublication(song)}
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                              song.publication_status === 'published'
                                ? 'bg-red-600/20 text-red-400 border-red-500/40'
                                : 'bg-neutral-900 text-neutral-400 border-white/10'
                            }`}
                          >
                            {song.publication_status === 'published'
                              ? 'Published'
                              : song.publication_status.replace('_', ' ')}
                          </button>

                          <button
                            onClick={() => handleToggleSongFeatured(song)}
                            className={`p-1.5 rounded-full transition-colors ${
                              song.is_featured
                                ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40'
                                : 'text-neutral-500 hover:text-amber-300 hover:bg-white/5'
                            }`}
                            title={song.is_featured ? 'Remove from home featured' : 'Pin to home featured'}
                          >
                            <Star className={`w-4 h-4 ${song.is_featured ? 'fill-current' : ''}`} />
                          </button>

                          <button
                            onClick={() => setEditingSong(song)}
                            className="p-1.5 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
                            title="Edit track"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteSong(song.id)}
                            className="p-1.5 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                            title="Unpublish track"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {songs.length === 0 && (
                      <p className="text-xs text-neutral-500 font-mono text-center py-6">
                        No songs match the current filters.
                      </p>
                    )}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-neutral-500">
                      {songCount} song{songCount === 1 ? '' : 's'} · page {songPage} of {Math.max(1, Math.ceil(songCount / CATALOG_PAGE_SIZE))}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const next = Math.max(1, songPage - 1);
                          setSongPage(next);
                          loadSongs({ page: next });
                        }}
                        disabled={songPage <= 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 border border-white/10 text-neutral-300 text-[11px] transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                      </button>
                      <button
                        onClick={() => {
                          const next = songPage + 1;
                          setSongPage(next);
                          loadSongs({ page: next });
                        }}
                        disabled={songPage >= Math.ceil(songCount / CATALOG_PAGE_SIZE)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 border border-white/10 text-neutral-300 text-[11px] transition-colors"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Song edit modal (inline, over the catalog) */}
              {editingSong && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pd-veil">
                  <form
                    onSubmit={handleSaveSongEdit}
                    className="w-full max-w-lg bg-neutral-950 border border-red-600/40 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif text-base font-bold text-white">Edit Track #{editingSong.id}</h4>
                      <button type="button" onClick={() => setEditingSong(null)} className="text-neutral-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Title (English / Romanized)</label>
                      <input
                        type="text"
                        value={editingSong.title}
                        onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Title (नेपाली)</label>
                      <input
                        type="text"
                        value={editingSong.title_ne || ''}
                        onChange={(e) => setEditingSong({ ...editingSong, title_ne: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Artist</label>
                        <select
                          value={editingSong.artist}
                          onChange={(e) => setEditingSong({ ...editingSong, artist: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        >
                          {artists.map((artist) => (
                            <option key={artist.id} value={artist.id}>{artist.display_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Primary genre</label>
                        <select
                          value={editingSong.primary_genre ?? ''}
                          onChange={(e) => setEditingSong({ ...editingSong, primary_genre: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        >
                          <option value="">No genre</option>
                          {resolveCategories(categories).map((category) => (
                            <optgroup key={category.slug} label={category.label}>
                              {genres.filter((genre) => genre.category === category.slug).map((genre) => (
                                <option key={genre.id} value={genre.id}>{genre.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Additional genres (secondary)</label>
                      <select
                        multiple
                        value={(editingSong.secondary_genres ?? []).map(String)}
                        onChange={(e) =>
                          setEditingSong({
                            ...editingSong,
                            secondary_genres: Array.from(e.target.selectedOptions, (option) => Number(option.value)),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none h-24"
                      >
                        {genres.map((genre) => (
                          <option key={genre.id} value={genre.id}>{genre.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-neutral-500 mt-1">Hold ⌘/Ctrl to pick more than one.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Romanized title</label>
                      <input
                        type="text"
                        value={editingSong.romanized_title || ''}
                        onChange={(e) => setEditingSong({ ...editingSong, romanized_title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Composer</label>
                        <input
                          type="text"
                          value={editingSong.composer || ''}
                          onChange={(e) => setEditingSong({ ...editingSong, composer: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Lyricist</label>
                        <input
                          type="text"
                          value={editingSong.lyricist || ''}
                          onChange={(e) => setEditingSong({ ...editingSong, lyricist: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Album</label>
                        <input
                          type="text"
                          value={editingSong.album || ''}
                          onChange={(e) => setEditingSong({ ...editingSong, album: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Film / source</label>
                        <input
                          type="text"
                          value={editingSong.film_or_source || ''}
                          onChange={(e) => setEditingSong({ ...editingSong, film_or_source: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Mood tags (comma-separated)</label>
                      <input
                        type="text"
                        value={(editingSong.mood_tags ?? []).join(', ')}
                        onChange={(e) => setEditingSong({ ...editingSong, mood_tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })}
                        placeholder="e.g. nostalgic, romantic"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Language</label>
                        <input
                          type="text"
                          value={editingSong.language || ''}
                          onChange={(e) => setEditingSong({ ...editingSong, language: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Release year</label>
                        <input
                          type="number"
                          value={editingSong.release_year ?? ''}
                          onChange={(e) => setEditingSong({ ...editingSong, release_year: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Publication</label>
                        <select
                          value={editingSong.publication_status}
                          onChange={(e) => setEditingSong({ ...editingSong, publication_status: e.target.value as Song['publication_status'] })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="disputed">Disputed</option>
                          <option value="taken_down">Taken down</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Verification</label>
                        <select
                          value={editingSong.metadata_verification_status}
                          onChange={(e) => setEditingSong({ ...editingSong, metadata_verification_status: e.target.value as Song['metadata_verification_status'] })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        >
                          <option value="verified">Verified</option>
                          <option value="community_submitted">Community</option>
                          <option value="demo">Demo</option>
                        </select>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingSong.is_featured ?? false}
                        onChange={(e) => setEditingSong({ ...editingSong, is_featured: e.target.checked })}
                        className="w-4 h-4 accent-amber-500"
                      />
                      Pin to home featured
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">YouTube video ID</label>
                        <input
                          type="text"
                          value={editingSong.provider_video_id || ''}
                          onChange={(e) => setEditingSong({ ...editingSong, provider_video_id: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs font-mono focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Duration (seconds)</label>
                        <input
                          type="number"
                          value={editingSong.duration_seconds ?? ''}
                          onChange={(e) => setEditingSong({ ...editingSong, duration_seconds: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Artwork URL</label>
                      <input
                        type="text"
                        value={editingSong.artwork_url || ''}
                        onChange={(e) => setEditingSong({ ...editingSong, artwork_url: e.target.value })}
                        placeholder="Leave blank to auto-use the YouTube thumbnail"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs font-mono focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Source URL</label>
                        <input
                          type="text"
                          value={editingSong.source_url || ''}
                          onChange={(e) => setEditingSong({ ...editingSong, source_url: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs font-mono focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Attribution</label>
                        <input
                          type="text"
                          value={editingSong.attribution || ''}
                          onChange={(e) => setEditingSong({ ...editingSong, attribution: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button type="submit" className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold">
                        Save Changes
                      </button>
                      <button type="button" onClick={() => setEditingSong(null)} className="px-5 py-2 rounded-full bg-neutral-800 text-white text-xs">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Station queue manager modal */}
              {queueStation && (
                <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pd-veil">
                  <div className="w-full max-w-2xl bg-neutral-950 border border-red-600/40 rounded-3xl p-6 space-y-4 max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif text-base font-bold text-white flex items-center gap-2">
                        <ListMusic className="w-4 h-4 text-red-500" /> Queue — {queueStation.title} ({queueItems.length})
                      </h4>
                      <button type="button" onClick={() => setQueueStation(null)} className="text-neutral-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Add a song */}
                    <div className="flex items-center gap-2">
                      <select
                        value={queueSongPicker}
                        onChange={(e) => setQueueSongPicker(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Add a song to the queue…</option>
                        {songs
                          .filter((s) => !queueItems.some((item) => item.song_id === s.id))
                          .map((s) => (
                            <option key={s.id} value={s.id}>{s.title} — {s.artist_name}</option>
                          ))}
                      </select>
                      <button
                        onClick={queueAddSong}
                        disabled={queueBusy || !queueSongPicker}
                        className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>

                    {/* Queue list */}
                    <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                      {queueItems.length === 0 && (
                        <p className="text-xs text-neutral-500 font-mono text-center py-6">This station has no songs yet.</p>
                      )}
                      {queueItems.map((item, index) => (
                        <div key={item.song_id} className="p-2.5 rounded-xl bg-black border border-white/10 flex items-center gap-3">
                          <span className="text-[11px] font-mono text-neutral-500 w-6 text-center">{index + 1}</span>
                          {item.artwork_url && (
                            <img src={item.artwork_url} alt={item.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">{item.title}</p>
                            <p className="text-[10px] font-mono text-neutral-500 truncate">{item.artist_name} · {item.publication_status}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => queueMove(index, -1)}
                              disabled={queueBusy || index === 0}
                              className="p-1 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 disabled:opacity-30"
                              title="Move up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => queueMove(index, 1)}
                              disabled={queueBusy || index === queueItems.length - 1}
                              className="p-1 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 disabled:opacity-30"
                              title="Move down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => queueRemoveSong(item.song_id)}
                              disabled={queueBusy}
                              className="p-1.5 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-950/40 disabled:opacity-50"
                              title="Remove from queue"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      The song picker shows the current catalog page. Use the Catalog tab's "add to station" bulk action to queue many songs at once.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Add Track */}
              {activeTab === 'addSong' && (
                <form onSubmit={handleCreateSong} className="max-w-lg space-y-4">
                  {songSuccessMsg && (
                    <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-200 rounded-2xl text-xs">
                      {songSuccessMsg}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">Title (English / Romanized)</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Maya Baiguni"
                      className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">Nepali Title (नेपाली शीर्षक)</label>
                    <input
                      type="text"
                      value={newTitleNe}
                      onChange={(e) => setNewTitleNe(e.target.value)}
                      placeholder="e.g. माया बैगुनी"
                      className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">Artist</label>
                      <select
                        value={newArtistId}
                        onChange={(e) => setNewArtistId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none"
                        required
                      >
                        <option value="">Pick artist…</option>
                        {artists.map((a) => (
                          <option key={a.id} value={a.id}>{a.display_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">Primary Genre</label>
                      <select
                        value={newGenreId}
                        onChange={(e) => setNewGenreId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">No genre</option>
                        {resolveCategories(categories).map((category) => (
                          <optgroup key={category.slug} label={category.label}>
                            {genres.filter((g) => g.category === category.slug).map((g) => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">Additional Genres</label>
                      <select
                        multiple
                        value={newSecondaryGenreIds.map(String)}
                        onChange={(e) => setNewSecondaryGenreIds(Array.from(e.target.selectedOptions, (option) => Number(option.value)))}
                        className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none h-20"
                      >
                        {genres.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">Language</label>
                      <input
                        type="text"
                        value={newLanguage}
                        onChange={(e) => setNewLanguage(e.target.value)}
                        placeholder="Nepali"
                        className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">Release Year</label>
                      <input
                        type="number"
                        value={newYear}
                        onChange={(e) => setNewYear(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as 'published' | 'draft')}
                        className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">YouTube Video ID (11 chars)</label>
                    <input
                      type="text"
                      value={newVideoId}
                      onChange={(e) => setNewVideoId(e.target.value)}
                      placeholder="e.g. 8Gq51d6aN5c"
                      className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none font-mono"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-glow-red transition-all duration-300 ease-out hover:scale-105 active:scale-95"
                  >
                    Add Song to Catalog
                  </button>
                </form>
              )}

              {/* Tab 3b: Taxonomy Management (Genres + Artists) */}
              {activeTab === 'taxonomy' && (
                <div className="space-y-6">
                  {taxonomyMessage && (
                    <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-200 rounded-2xl text-xs">
                      {taxonomyMessage}
                    </div>
                  )}

                  {/* Create genre */}
                  <form onSubmit={handleCreateGenre} className="p-4 rounded-2xl bg-black border border-white/10 space-y-3">
                    <h4 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-red-500" /> Create Genre
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Name (English)</label>
                        <input
                          type="text"
                          value={genreForm.name}
                          onChange={(e) => setGenreForm({ ...genreForm, name: e.target.value })}
                          placeholder="e.g. Dohori Geet"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Name (नेपाली)</label>
                        <input
                          type="text"
                          value={genreForm.name_ne}
                          onChange={(e) => setGenreForm({ ...genreForm, name_ne: e.target.value })}
                          placeholder="e.g. दोहोरी गीत"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Category</label>
                        <select
                          value={genreForm.category}
                          onChange={(e) => setGenreForm({ ...genreForm, category: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        >
                          {resolveCategories(categories).map((category) => (
                            <option key={category.slug} value={category.slug}>{category.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Description</label>
                        <input
                          type="text"
                          value={genreForm.description}
                          onChange={(e) => setGenreForm({ ...genreForm, description: e.target.value })}
                          placeholder="Optional description"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={taxonomyBusy || !genreForm.name.trim()}
                      className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold transition-all"
                    >
                      {taxonomyBusy ? 'Working…' : 'Create Genre'}
                    </button>
                  </form>

                  {/* Genre list grouped by category */}
                  <div className="space-y-4 max-h-[38vh] overflow-y-auto pr-1">
                    {resolveCategories(categories).map((category) => {
                      const categoryGenres = genres.filter((genre) => genre.category === category.slug);
                      if (categoryGenres.length === 0) return null;
                      return (
                        <div key={category.slug}>
                          <h5 className="text-[10px] font-mono text-neutral-500 uppercase mb-2">
                            {category.label}
                          </h5>
                          <div className="space-y-2">
                            {categoryGenres.map((genre) => (
                              <div key={genre.id} className="p-3 rounded-2xl bg-black border border-white/10 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">
                                    {genre.name} <span className="text-neutral-500 font-normal">({genre.name_ne || '—'})</span>
                                  </p>
                                  <p className="text-[10px] font-mono text-neutral-500">
                                    ID: {genre.id} · slug: {genre.slug} · {genre.songs_count ?? 0} song(s) · {genre.is_active ? 'active' : 'hidden'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <select
                                    value={genre.category}
                                    onChange={(e) => handleGenreCategoryChange(genre, e.target.value)}
                                    disabled={taxonomyBusy}
                                    className="px-2 py-1 rounded-full bg-neutral-900 border border-white/15 text-neutral-300 text-[10px] focus:border-red-500 focus:outline-none"
                                    title="Move genre to another category"
                                  >
                                    {resolveCategories(categories).map((option) => (
                                      <option key={option.slug} value={option.slug}>{option.label}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleGenreToggleActive(genre)}
                                    disabled={taxonomyBusy}
                                    className={`px-2 py-1 rounded-full text-[10px] font-semibold border transition-all disabled:opacity-50 ${
                                      genre.is_active
                                        ? 'bg-red-600/20 text-red-400 border-red-500/40'
                                        : 'bg-neutral-900 text-neutral-400 border-white/10'
                                    }`}
                                    title={genre.is_active ? 'Hide from catalog filters' : 'Restore to catalog filters'}
                                  >
                                    {genre.is_active ? 'Active' : 'Hidden'}
                                  </button>
                                  <button
                                    onClick={() => setEditingGenre(genre)}
                                    disabled={taxonomyBusy}
                                    className="p-1.5 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                                    title="Edit genre name / description"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleGenreDelete(genre)}
                                    disabled={taxonomyBusy}
                                    className="p-1.5 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-50"
                                    title="Delete genre (asks to reassign songs if in use)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Edit genre form */}
                  {editingGenre && (
                    <form onSubmit={handleSaveGenreEdit} className="p-4 rounded-2xl bg-black border border-red-500/30 space-y-3">
                      <h4 className="font-serif text-sm font-bold text-white">Edit Genre #{editingGenre.id}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Name (English)</label>
                          <input
                            type="text"
                            value={editingGenre.name}
                            onChange={(e) => setEditingGenre({ ...editingGenre, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Name (नेपाली)</label>
                          <input
                            type="text"
                            value={editingGenre.name_ne || ''}
                            onChange={(e) => setEditingGenre({ ...editingGenre, name_ne: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Category</label>
                          <select
                            value={editingGenre.category}
                            onChange={(e) => setEditingGenre({ ...editingGenre, category: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                          >
                            {resolveCategories(categories).map((option) => (
                              <option key={option.slug} value={option.slug}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Description</label>
                          <input
                            type="text"
                            value={editingGenre.description || ''}
                            onChange={(e) => setEditingGenre({ ...editingGenre, description: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={taxonomyBusy} className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold">
                          {taxonomyBusy ? 'Saving…' : 'Save Genre'}
                        </button>
                        <button type="button" onClick={() => setEditingGenre(null)} className="px-5 py-2 rounded-full bg-neutral-800 text-white text-xs">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Category management */}
                  <div className="space-y-3 p-4 rounded-2xl bg-black border border-white/10">
                    <h4 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-red-500" /> Categories ({categories.length})
                    </h4>
                    <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        placeholder="New category name"
                        className="px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                        required
                      />
                      <input
                        type="text"
                        value={categoryForm.name_ne}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name_ne: e.target.value })}
                        placeholder="नेपाली (optional)"
                        className="px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        placeholder="Description (optional)"
                        className="px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                      />
                      <button type="submit" disabled={taxonomyBusy || !categoryForm.name.trim()} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold">
                        Add Category
                      </button>
                    </form>
                    <div className="space-y-2 max-h-[22vh] overflow-y-auto pr-1">
                      {resolveCategories(categories).map((resolved, index, arr) => {
                        const category = categories.find((c) => c.slug === resolved.slug);
                        if (!category) return null;
                        return (
                          <div key={category.slug} className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{category.name}</p>
                              <p className="text-[10px] font-mono text-neutral-500">
                                slug: {category.slug} · {category.genres_count} genre(s) · {category.songs_count} song(s) · {category.is_active ? 'active' : 'hidden'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => moveCategory(category, -1)}
                                disabled={taxonomyBusy || index === 0}
                                className="p-1 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 disabled:opacity-30"
                                title="Move up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => moveCategory(category, 1)}
                                disabled={taxonomyBusy || index === arr.length - 1}
                                className="p-1 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 disabled:opacity-30"
                                title="Move down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleCategoryActive(category)}
                                disabled={taxonomyBusy}
                                className={`px-2 py-1 rounded-full text-[10px] font-semibold border disabled:opacity-50 ${
                                  category.is_active ? 'bg-red-600/20 text-red-400 border-red-500/40' : 'bg-neutral-800 text-neutral-400 border-white/10'
                                }`}
                              >
                                {category.is_active ? 'Active' : 'Hidden'}
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category)}
                                disabled={taxonomyBusy}
                                className="p-1.5 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-950/40 disabled:opacity-50"
                                title="Delete category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Artist management */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-red-500" /> Artists ({artists.length})
                      </h4>
                      <input
                        type="text"
                        value={artistSearch}
                        onChange={(e) => setArtistSearch(e.target.value)}
                        placeholder="Filter artists..."
                        className="px-3 py-1.5 rounded-full bg-black border border-white/15 text-white text-[11px] focus:border-red-500 focus:outline-none w-52"
                      />
                    </div>
                    <div className="space-y-2 max-h-[28vh] overflow-y-auto pr-1">
                      {artists
                        .filter((artist) => artist.display_name.toLowerCase().includes(artistSearch.toLowerCase()))
                        .map((artist) => (
                          <div key={artist.id} className="p-3 rounded-2xl bg-black border border-white/10 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{artist.display_name}</p>
                              <p className="text-[10px] font-mono text-neutral-500">
                                ID: {artist.id} · {artist.songs_count ?? 0} song(s) · {artist.verification_status}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => startEditArtist(artist)}
                                disabled={taxonomyBusy}
                                className="p-1.5 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                                title="Edit artist"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleArtistDelete(artist)}
                                disabled={taxonomyBusy}
                                className="p-1.5 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-50"
                                title="Delete artist (asks to reassign/merge songs if in use)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      {artists.filter((artist) => artist.display_name.toLowerCase().includes(artistSearch.toLowerCase())).length === 0 && (
                        <p className="text-xs text-neutral-500 font-mono text-center py-4">No artists match.</p>
                      )}
                    </div>

                    {/* Create / edit artist */}
                    <form onSubmit={handleSaveArtist} className="p-3 rounded-2xl bg-black border border-red-500/30 space-y-3">
                      <h4 className="font-serif text-sm font-bold text-white">
                        {editingArtist ? `Edit Artist: ${editingArtist.display_name}` : 'Create Artist'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Display name</label>
                          <input
                            type="text"
                            value={artistForm.display_name}
                            onChange={(e) => setArtistForm({ ...artistForm, display_name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Name (नेपाली)</label>
                          <input
                            type="text"
                            value={artistForm.display_name_ne}
                            onChange={(e) => setArtistForm({ ...artistForm, display_name_ne: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Biography</label>
                          <input
                            type="text"
                            value={artistForm.biography}
                            onChange={(e) => setArtistForm({ ...artistForm, biography: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Verification</label>
                          <select
                            value={artistForm.verification_status}
                            onChange={(e) => setArtistForm({ ...artistForm, verification_status: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                          >
                            <option value="verified">Verified</option>
                            <option value="official">Official</option>
                            <option value="unverified">Unverified</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={taxonomyBusy || !artistForm.display_name.trim()} className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold">
                          {taxonomyBusy ? 'Saving…' : (editingArtist ? 'Save Artist' : 'Create Artist')}
                        </button>
                        {editingArtist && (
                          <button type="button" onClick={() => { setEditingArtist(null); setArtistForm({ display_name: '', display_name_ne: '', biography: '', verification_status: 'verified' }); }} className="px-5 py-2 rounded-full bg-neutral-800 text-white text-xs">
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Tab 4: Station Management */}
              {activeTab === 'stations' && (
                <div className="space-y-4">
                  {creatingStation && (
                    <form onSubmit={handleCreateStation} className="max-w-lg space-y-4 p-4 rounded-2xl bg-black border border-red-500/30">
                      <h4 className="font-serif text-sm font-bold text-white">Create Station</h4>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Title</label>
                        <input
                          type="text"
                          value={stationForm.title}
                          onChange={(e) => setStationForm({ ...stationForm, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Tagline</label>
                        <input
                          type="text"
                          value={stationForm.tagline}
                          onChange={(e) => setStationForm({ ...stationForm, tagline: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Cover Image URL</label>
                          <input
                            type="url"
                            value={stationForm.cover_image}
                            onChange={(e) => setStationForm({ ...stationForm, cover_image: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Display order</label>
                          <input
                            type="number"
                            value={stationForm.display_order}
                            onChange={(e) => setStationForm({ ...stationForm, display_order: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold">
                          Create Station
                        </button>
                        <button type="button" onClick={() => setCreatingStation(false)} className="px-4 py-1.5 rounded-full bg-neutral-800 text-white text-xs">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {editingStation ? (
                    <form onSubmit={handleSaveStation} className="max-w-lg space-y-4 p-4 rounded-2xl bg-black border border-red-500/30">
                      <h4 className="font-serif text-sm font-bold text-white">Edit Station: {editingStation.title}</h4>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Title</label>
                        <input
                          type="text"
                          value={editingStation.title}
                          onChange={(e) => setEditingStation({ ...editingStation, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Tagline</label>
                        <input
                          type="text"
                          value={editingStation.tagline}
                          onChange={(e) => setEditingStation({ ...editingStation, tagline: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Cover Image URL</label>
                        <input
                          type="url"
                          value={editingStation.cover_image}
                          onChange={(e) => setEditingStation({ ...editingStation, cover_image: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs font-mono"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStation(null)}
                          className="px-4 py-1.5 rounded-full bg-neutral-800 text-white text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-end">
                        <button
                          onClick={() => { setCreatingStation(true); setEditingStation(null); }}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" /> New Station
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
                        {stations.map((st) => (
                          <div key={st.id} className="p-3.5 rounded-2xl bg-black border border-white/10 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={st.cover_image || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80'}
                                alt={st.title}
                                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <h5 className="font-serif text-xs font-bold text-white truncate">{st.title}</h5>
                                <p className="text-[11px] text-neutral-400 truncate">{st.tagline}</p>
                                <p className="text-[10px] font-mono text-neutral-500">{st.songs_count ?? 0} song(s) · order {st.display_order}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => setEditingStation(st)}
                                className="px-3 py-1 rounded-full bg-neutral-900 hover:bg-red-600 hover:text-white text-neutral-300 text-xs transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => openQueue(st)}
                                className="flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-900 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
                                title="Manage the song queue for this station"
                              >
                                <ListMusic className="w-3.5 h-3.5" /> Queue
                              </button>
                              <button
                                onClick={() => handleDeleteStation(st)}
                                className="p-1.5 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                                title="Delete station"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab 5: Moderation Tickets */}
              {activeTab === 'takedowns' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={ticketStatusFilter}
                      onChange={(e) => { setTicketStatusFilter(e.target.value); loadTakedowns({ status: e.target.value }); }}
                      className="px-3 py-1.5 rounded-full bg-black border border-white/15 text-neutral-300 text-[11px] focus:border-red-500 focus:outline-none"
                    >
                      <option value="all">All statuses</option>
                      {(takedownStatuses.length ? takedownStatuses : ['pending', 'under_review', 'content_unpublished', 'resolved_kept', 'rejected']).map((status) => (
                        <option key={status} value={status}>{status.replace('_', ' ')}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                        onBlur={() => loadTakedowns({ search: ticketSearch })}
                        onKeyDown={(e) => { if (e.key === 'Enter') loadTakedowns({ search: ticketSearch }); }}
                        placeholder="Search song, reporter, email..."
                        className="pl-8 pr-3 py-1.5 rounded-full bg-black border border-white/15 text-white text-[11px] focus:border-red-500 focus:outline-none w-56"
                      />
                    </div>
                    <button onClick={() => loadTakedowns()} className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors" title="Refresh tickets">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[46vh] overflow-y-auto">
                    {takedowns.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-8">No moderation reports match.</p>
                    ) : (
                      takedowns.map((ticket) => (
                        <div key={ticket.id} className="p-4 rounded-2xl bg-black border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-red-500 font-bold">
                              TICKET #{ticket.id} • {ticket.reason.toUpperCase()}
                            </span>
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono ${
                              ticket.status === 'pending' ? 'bg-red-600/20 text-red-400 border border-red-500/40' : 'bg-neutral-800 text-neutral-300'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-sm font-serif font-bold text-white">
                            Target Song: {ticket.song_title} ({ticket.artist_name})
                          </p>
                          <p className="text-xs text-neutral-300 bg-neutral-900 p-2.5 rounded-xl border border-white/5">
                            {ticket.details}
                          </p>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            Reporter: {ticket.claimant_name} ({ticket.claimant_email}) · {new Date(ticket.created_at).toLocaleString()}
                          </div>
                          {ticket.resolution_notes && (
                            <div className="text-[11px] text-neutral-400 font-mono">Resolution: {ticket.resolution_notes}</div>
                          )}
                          <input
                            type="text"
                            value={ticketNotes[ticket.id] ?? ''}
                            onChange={(e) => setTicketNotes((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                            placeholder="Optional resolution note..."
                            className="w-full px-3 py-1.5 rounded-full bg-neutral-900 border border-white/15 text-white text-[11px] focus:border-red-500 focus:outline-none"
                          />
                          {ticket.status === 'pending' || ticket.status === 'under_review' ? (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                onClick={() => handleTakedownDecision(ticket.id, 'under_review')}
                                className="px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs"
                              >
                                Mark Under Review
                              </button>
                              <button
                                onClick={() => handleTakedownDecision(ticket.id, 'content_unpublished')}
                                className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                              >
                                Unpublish Song
                              </button>
                              <button
                                onClick={() => handleTakedownDecision(ticket.id, 'resolved_kept')}
                                className="px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold"
                              >
                                Keep Song
                              </button>
                              <button
                                onClick={() => handleTakedownDecision(ticket.id, 'rejected')}
                                className="px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleTakedownDecision(ticket.id, 'under_review')}
                              className="px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs"
                            >
                              Reopen / Under Review
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 6: Security */}
              {activeTab === 'security' && (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4 p-4 rounded-2xl bg-black border border-white/10">
                    <h4 className="font-serif text-sm font-bold text-white">Session Details</h4>
                    <div className="space-y-3 text-sm text-neutral-300">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-neutral-500">Username</span>
                        <span className="font-semibold text-white">{currentUser?.username || username || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-neutral-500">Access level</span>
                        <span className="font-semibold text-red-400">{currentUser?.is_superuser ? 'Superuser' : 'Staff admin'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-neutral-500">Catalog access</span>
                        <span className="font-semibold text-white">{currentUser?.permissions?.can_manage_catalog ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-neutral-500">Audit access</span>
                        <span className="font-semibold text-white">{currentUser?.permissions?.can_view_audit_logs ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                    <div className="pt-2 text-xs text-neutral-400">
                      Password changes keep the current session active and immediately refresh the auth cookie.
                    </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4 p-4 rounded-2xl bg-black border border-white/10">
                    <h4 className="font-serif text-sm font-bold text-white">Change Password</h4>
                    {securityError && (
                      <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs">
                        {securityError}
                      </div>
                    )}
                    {securitySuccess && (
                      <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs">
                        {securitySuccess}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Current password</label>
                      <input
                        type="password"
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none"
                        autoComplete="current-password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">New password</label>
                      <input
                        type="password"
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none"
                        autoComplete="new-password"
                        minLength={10}
                        required
                      />
                      <p className="text-[10px] text-neutral-500 mt-1.5 font-mono leading-relaxed">
                        Min 10 characters · not similar to your username or email · not a common password · not all numbers
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Confirm new password</label>
                      <input
                        type="password"
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none"
                        autoComplete="new-password"
                        minLength={10}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={securityLoading}
                      className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-xs font-bold shadow-glow-red transition-all"
                    >
                      {securityLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 7: Audit Logs */}
              {activeTab === 'audit' && (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-black border border-white/5 text-xs font-mono flex items-center justify-between">
                      <div>
                        <span className="text-red-500 font-bold">[{log.action}]</span>{' '}
                        <span className="text-neutral-300">by {log.actor_username} on {log.target_model}#{log.target_id}</span>
                      </div>
                      <span className="text-neutral-500 text-[10px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
