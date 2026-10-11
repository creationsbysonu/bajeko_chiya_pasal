import React, { useState, useEffect } from 'react';
import { X, Lock, LogOut, AlertTriangle, ShieldCheck, FileText, Database, Plus, Search, Radio, Trash2, RefreshCw, ShieldQuestion } from 'lucide-react';
import { api } from '../services/api';
import { AdminStats, TakedownTicket, AuditLogItem, Song, Station, Artist, AuthUser } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCatalogUpdated?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onCatalogUpdated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'stats' | 'songs' | 'addSong' | 'stations' | 'takedowns' | 'audit' | 'security'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [takedowns, setTakedowns] = useState<TakedownTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [songSearch, setSongSearch] = useState('');

  // Add song form state
  const [newTitle, setNewTitle] = useState('');
  const [newTitleNe, setNewTitleNe] = useState('');
  const [newArtistId, setNewArtistId] = useState(1);
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

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const data = await api.getCaptcha();
      setCaptchaQuestion(data.question);
      setCaptchaToken(data.token);
      setCaptchaAnswer('');
    } catch {
      setCaptchaQuestion('');
      setCaptchaToken('');
    } finally {
      setCaptchaLoading(false);
    }
  };

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
      loadCaptcha();
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    setSecurityError(null);
    setSecuritySuccess(null);

    try {
      const res = await api.login(username, password, captchaToken, captchaAnswer);
      if (res.authenticated && res.is_staff) {
        setCurrentUser(res);
        setIsAuthenticated(true);
        loadAdminData();
      } else {
        setLoginError('Admin access requires a staff account.');
        loadCaptcha();
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Invalid administrator credentials.');
      // Captcha is single-use server-side; always fetch a fresh one after a failed attempt
      loadCaptcha();
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

  const loadAdminData = async () => {
    try {
      const [statsData, takedownData, auditData, songsData, stationsData, artistsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminTakedowns(),
        api.getAdminAuditLogs(),
        api.getAdminSongs(),
        api.getAdminStations(),
        api.getAdminArtists(),
      ]);
      setStats(statsData);
      setTakedowns(takedownData);
      setAuditLogs(auditData);
      setSongs(songsData);
      setStations(stationsData);
      setArtists(artistsData);
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  };

  const handleTakedownDecision = async (id: number, statusChoice: string) => {
    try {
      await api.handleTakedownAction(id, statusChoice, `Moderated by admin: ${statusChoice}`);
      loadAdminData();
      onCatalogUpdated?.();
    } catch {
      alert('Failed to update moderation ticket.');
    }
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

  const handleCreateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    setSongSuccessMsg(null);
    try {
      await api.createAdminSong({
        title: newTitle,
        title_ne: newTitleNe,
        artist: newArtistId,
        provider_video_id: newVideoId,
        release_year: parseInt(newYear) || null,
        metadata_verification_status: 'verified',
        publication_status: 'published',
        artwork_url: `https://img.youtube.com/vi/${newVideoId}/hqdefault.jpg`,
      });
      setSongSuccessMsg(`Added track "${newTitle}" successfully!`);
      setNewTitle('');
      setNewTitleNe('');
      setNewVideoId('');
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
        cover_image: editingStation.cover_image,
      });
      setEditingStation(null);
      loadAdminData();
      onCatalogUpdated?.();
    } catch {
      alert('Failed to update station.');
    }
  };

  if (!isOpen) return null;

  const filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
    s.artist_name.toLowerCase().includes(songSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in">
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
                    Sign in with a Django staff or superuser account.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-200 rounded-2xl text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter staff username"
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

                {/* Arithmetic captcha — single-use server-issued challenge */}
                <div>
                  <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">
                    Security Check (Captcha)
                  </label>
                  <div className="flex items-stretch gap-2">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black border border-white/15 min-w-[150px] justify-center">
                      <ShieldQuestion className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="font-mono text-sm text-white select-none">
                        {captchaLoading ? '…' : captchaQuestion || '— — = ?'}
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      placeholder="Answer"
                      autoComplete="off"
                      className="w-24 px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm font-mono text-center focus:border-red-500 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={loadCaptcha}
                      disabled={captchaLoading}
                      className="px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 transition-colors disabled:opacity-50"
                      title="Get a new question"
                      aria-label="Refresh captcha question"
                    >
                      <RefreshCw className={`w-4 h-4 ${captchaLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1.5 font-mono">
                    Single-use challenge issued by the server · brute-force protected
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || captchaLoading || !captchaToken || !captchaAnswer.trim()}
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
                  { id: 'songs', label: `Catalog (${songs.length})`, icon: ShieldCheck },
                  { id: 'addSong', label: 'Add Track', icon: Plus },
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
                  </div>
                </div>
              )}

              {/* Tab 2: Catalog Management (All Songs) */}
              {activeTab === 'songs' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={songSearch}
                      onChange={(e) => setSongSearch(e.target.value)}
                      placeholder="Search tracks by title or artist..."
                      className="w-full pl-10 pr-4 py-2 rounded-full bg-black border border-white/15 text-white text-xs focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredSongs.map((song) => (
                      <div
                        key={song.id}
                        className="p-3.5 rounded-2xl bg-black border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
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
                              {song.artist_name} • {song.release_year || 'Unknown'} • ID: {song.provider_video_id}
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
                            {song.publication_status === 'published' ? 'Published' : 'Archived'}
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
                  <div>
                    <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">Artist</label>
                    <select
                      value={newArtistId}
                      onChange={(e) => setNewArtistId(parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none"
                    >
                      {artists.map((a) => (
                        <option key={a.id} value={a.id}>{a.display_name}</option>
                      ))}
                    </select>
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
                  <div>
                    <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">Release Year</label>
                    <input
                      type="number"
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm focus:border-red-500 focus:outline-none font-mono"
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

              {/* Tab 4: Station Management */}
              {activeTab === 'stations' && (
                <div className="space-y-4">
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
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingStation(st)}
                            className="px-3 py-1 rounded-full bg-neutral-900 hover:bg-red-600 hover:text-white text-neutral-300 text-xs transition-colors flex-shrink-0"
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Moderation Tickets */}
              {activeTab === 'takedowns' && (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                  {takedowns.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-8">No moderation reports logged.</p>
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
                          Reporter: {ticket.claimant_name} ({ticket.claimant_email})
                        </div>
                        {ticket.status === 'pending' && (
                          <div className="flex items-center gap-2 pt-2">
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
                        )}
                      </div>
                    ))
                  )}
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
