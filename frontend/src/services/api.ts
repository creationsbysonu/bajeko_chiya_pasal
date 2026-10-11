import {
  Artist, Genre, Song, Station, FavoriteItem,
  AdminStats, TakedownTicket, AuditLogItem, AuthUser
} from '../types';

// On Render the SPA is a static site on its own subdomain, so the API base
// is injected at build time (VITE_API_BASE). Locally it falls back to the
// same-origin "/api" dev-server proxy.
const API_BASE: string = import.meta.env.VITE_API_BASE || '/api';
const CSRF_COOKIE_NAME = 'csrftoken';

let csrfTokenPromise: Promise<string | null> | null = null;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookieValue = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (!cookieValue) {
    return null;
  }

  return decodeURIComponent(cookieValue.split('=').slice(1).join('='));
}

async function ensureCsrfToken(): Promise<string | null> {
  if (typeof document === 'undefined') {
    return null;
  }

  const existing = getCookie(CSRF_COOKIE_NAME);
  if (existing) {
    return existing;
  }

  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(`${API_BASE}/auth/csrf/`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) {
          return null;
        }

        const data = await res.json();
        return data.csrf_token ?? null;
      })
      .catch(() => null)
      .finally(() => {
        csrfTokenPromise = null;
      });
  }

  return csrfTokenPromise;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers ?? {});
  const method = (options.method ?? 'GET').toUpperCase();

  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken);
    }
  }

  return fetch(path, {
    ...options,
    credentials: 'include',
    headers,
  });
}

// Generate or retrieve persistent guest session key
export function getGuestSessionKey(): string {
  let key = localStorage.getItem('purano_dhun_guest_session');
  if (!key) {
    key = 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('purano_dhun_guest_session', key);
  }
  return key;
}

const defaultHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Session-Key': getGuestSessionKey(),
});

export const api = {
  // Stations
  async getStations(): Promise<Station[]> {
    const res = await fetch(`${API_BASE}/stations/`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to fetch stations');
    return res.json();
  },

  async getStationDetail(slug: string): Promise<Station> {
    const res = await fetch(`${API_BASE}/stations/${slug}/`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch station: ${slug}`);
    return res.json();
  },

  // Songs Catalog & Search
  async getSongs(params: {
    search?: string;
    genre?: string;
    decade?: string;
    language?: string;
    verification?: string;
    ordering?: string;
    page?: number;
  } = {}): Promise<{ count: number; next: string | null; previous: string | null; results: Song[] }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.genre) query.set('genre', params.genre);
    if (params.decade) query.set('decade', params.decade);
    if (params.language) query.set('language', params.language);
    if (params.verification) query.set('verification', params.verification);
    if (params.ordering) query.set('ordering', params.ordering);
    if (params.page) query.set('page', params.page.toString());

    const res = await fetch(`${API_BASE}/songs/?${query.toString()}`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to fetch catalog songs');
    return res.json();
  },

  async getSongDetail(id: number): Promise<Song> {
    const res = await fetch(`${API_BASE}/songs/${id}/`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to fetch song details');
    return res.json();
  },

  // Metadata taxonomies
  async getGenres(): Promise<Genre[]> {
    const res = await fetch(`${API_BASE}/genres/`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to fetch genres');
    return res.json();
  },

  async getArtists(): Promise<Artist[]> {
    const res = await fetch(`${API_BASE}/artists/`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to fetch artists');
    return res.json();
  },

  async getDecades(): Promise<{ decade: string; count: number }[]> {
    const res = await fetch(`${API_BASE}/decades/`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to fetch decades');
    return res.json();
  },

  async getLanguages(): Promise<{ language: string; count: number }[]> {
    const res = await fetch(`${API_BASE}/languages/`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to fetch languages');
    return res.json();
  },

  async getFeatured(): Promise<{ stations: Station[]; songs: Song[] }> {
    const res = await fetch(`${API_BASE}/featured/`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to fetch featured content');
    return res.json();
  },

  // Favorites
  async getFavorites(): Promise<FavoriteItem[]> {
    const res = await fetch(`${API_BASE}/favorites/`, { headers: defaultHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async addFavorite(songId: number): Promise<FavoriteItem> {
    const res = await apiFetch(`${API_BASE}/favorites/`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ song_id: songId, session_key: getGuestSessionKey() }),
    });
    if (!res.ok) throw new Error('Failed to save favorite');
    return res.json();
  },

  async removeFavorite(songId: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/favorites/?song_id=${songId}`, {
      method: 'DELETE',
      headers: defaultHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove favorite');
  },

  // Playback Event Logging
  async logPlaybackEvent(event: {
    event_type: 'start' | 'complete' | 'skip' | 'error';
    song?: number;
    station?: number;
    error_message?: string;
  }): Promise<void> {
    try {
      await apiFetch(`${API_BASE}/playback-events/`, {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify({
          ...event,
          session_id: getGuestSessionKey(),
        }),
      });
    } catch {
      // Non-blocking telemetry
    }
  },

  // Takedown / Copyright notice
  async submitTakedown(data: {
    song: number;
    claimant_name: string;
    claimant_email: string;
    reason: string;
    details: string;
  }): Promise<{ message: string; ticket_id: number }> {
    const res = await apiFetch(`${API_BASE}/takedown-request/`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit notice');
    return res.json();
  },

  // Admin APIs
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/admin/stats/`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Admin authentication required');
    return res.json();
  },

  async getAdminTakedowns(): Promise<TakedownTicket[]> {
    const res = await fetch(`${API_BASE}/admin/takedowns/`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Admin access required');
    return res.json();
  },

  async handleTakedownAction(id: number, status: string, notes: string): Promise<TakedownTicket> {
    const res = await fetch(`${API_BASE}/admin/takedowns/${id}/action/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolution_notes: notes }),
    });
    if (!res.ok) throw new Error('Failed to apply moderation action');
    return res.json();
  },

  async getAdminAuditLogs(): Promise<AuditLogItem[]> {
    const res = await fetch(`${API_BASE}/admin/audit-logs/`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Admin access required');
    return res.json();
  },

  async getAdminSongs(): Promise<Song[]> {
    const res = await fetch(`${API_BASE}/admin/songs/`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch admin songs');
    return res.json();
  },

  async createAdminSong(data: any): Promise<Song> {
    const res = await apiFetch(`${API_BASE}/admin/songs/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create song');
    return res.json();
  },

  async updateAdminSong(id: number, data: any): Promise<Song> {
    const res = await apiFetch(`${API_BASE}/admin/songs/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update song');
    return res.json();
  },

  async deleteAdminSong(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE}/admin/songs/${id}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to unpublish song');
  },

  async getAdminArtists(): Promise<Artist[]> {
    const res = await fetch(`${API_BASE}/admin/artists/`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch artists');
    return res.json();
  },

  async createAdminArtist(data: any): Promise<Artist> {
    const res = await apiFetch(`${API_BASE}/admin/artists/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create artist');
    return res.json();
  },

  async getAdminStations(): Promise<Station[]> {
    const res = await fetch(`${API_BASE}/admin/stations/`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch stations');
    return res.json();
  },

  async updateAdminStation(id: number, data: any): Promise<Station> {
    const res = await apiFetch(`${API_BASE}/admin/stations/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update station');
    return res.json();
  },

  // Auth APIs
  async getCaptcha(): Promise<{ question: string; token: string }> {
    const res = await fetch(`${API_BASE}/auth/captcha/`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to load captcha');
    return res.json();
  },

  async login(
    username: string,
    password: string,
    captchaToken: string,
    captchaAnswer: string,
  ): Promise<AuthUser> {
    const res = await apiFetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        captcha_token: captchaToken,
        captcha_answer: captchaAnswer,
      }),
    });
    if (!res.ok) {
      let message = 'Invalid credentials';
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch {
        // keep default message
      }
      throw new Error(message);
    }
    return res.json();
  },

  async logout(): Promise<void> {
    await apiFetch(`${API_BASE}/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async getCurrentUser(): Promise<AuthUser> {
    const res = await fetch(`${API_BASE}/auth/user/`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return { authenticated: false };
    return res.json();
  },

  async changeAdminPassword(data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ message: string; user: AuthUser }> {
    const res = await apiFetch(`${API_BASE}/auth/change-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let message = 'Failed to change password';
      try {
        const payload = await res.json();
        if (payload?.error) {
          message = payload.error;
          if (Array.isArray(payload.details) && payload.details.length > 0) {
            message += ': ' + payload.details.join(' ');
          }
        }
      } catch {
        // keep generic message
      }
      throw new Error(message);
    }
    return res.json();
  },
};
