# Purano Dhun (पुरानो धुन) — Nepali Music Radio & Nostalgia Platform

> **नेपाली संगीत, पुराना सम्झना।**  
> *Nepali Music, Timeless Memories.*

An original, production-oriented Nepali music discovery and radio platform inspired by Nepal’s musical heritage, vintage transistor radios, steaming tea shops (*chiya pasal*), highway bus journeys (*bus yatra*), festival celebrations, and immortal melodies.

---

## 📻 Core Highlights & Features

- **Themed Radio Worlds (१० मौलिक सांगीतिक परिवेशहरू)**:
  1. **Purano Radio (पुरानो रेडियो)**: Golden era Radio Nepal classics (Narayan Gopal, Tara Devi, Aruna Lama).
  2. **Chiya Pasal (चिया पसल)**: Morning acoustic strums, steaming tea, and peaceful reflection.
  3. **Bus Yatra (बस यात्रा)**: Highway travel anthems echoing across mountain bends.
  4. **Lok Dohori (लोक दोहोरी)**: Conversational folk duets, madal rhythms, and village life.
  5. **Prem Geet (प्रेम गीत)**: Timeless romantic ballads and poetic expressions.
  6. **Biraha (विरह)**: Soul-stirring melancholic reflections and nostalgic late nights.
  7. **Nepali Rock (नेपाली रक)**: Pioneering rock & folk-rock movements (Nepathya, 1974 AD).
  8. **Naya Dhun (नयाँ धुन)**: Contemporary indie melodies and modern storytelling.
  9. **Dashain Tihar (दशैं तिहार)**: Seasonal festive atmosphere featuring Malshree and Deusi Bhailo.
  10. **Himalayan Acoustic (हिमालयन एकौस्टिक)**: Peaceful bamboo bansuri flute and sarangi meditation.

- **Vintage Radio Tuner & Dial**:
  - Interactive analog radio chassis with MW (530-1600 kHz), SW (3.9-11.8 MHz), and FM (88-108 MHz) scales.
  - Glowing analog tuner needle that dynamically responds to selected stations.
  - One-touch pushbutton station selector presets.

- **Audio Engine & Player Integration**:
  - **Strict Copyright Compliance**: Powered exclusively through the official YouTube IFrame Player API. No audio extraction, media redistribution, or downloading.
  - Persistent bottom playback bar with scrubbable seek bar, volume control, mute, shuffle, and 3-way repeat mode (off, one, all).
  - Expandable cinematic player modal.
  - Queue drawer showing Up Next tracks and recently played history.
  - Keyboard shortcuts: `Space` (Play/Pause), `N` (Next track), `P` (Previous track), `M` (Mute/Unmute).
  - Infinite retry prevention and friendly fallback when an embed is regionally restricted.

- **Full Catalog Discovery & Search**:
  - Unified search supporting both **Devanagari Unicode** (e.g., `मोहनी लाग्ला है`) and **Romanized Nepali** (e.g., `Mohani Lagla Hai`).
  - Multi-dimensional filters: Genre, Decade (1960s to 2020s), Language (Nepali, Newari, Tamang, etc.), and Verification status.
  - Sort by release year, play count, or title.

- **Bilingual Internationalization (i18n)**:
  - Native Devanagari Nepali and English translation dictionary with one-click language toggle.

- **PWA & Offline Capability**:
  - Web App Manifest and custom Service Worker caching application shell and icons.
  - Honest offline fallback notice (`offline.html`) informing users that live YouTube audio streams require internet.

- **Content Governance & Takedown Portal**:
  - Public submission form for rights holders and visitors to report copyright claims, broken links, or metadata corrections with instant tracking tickets.
  - Protected admin review with audit trails and soft-unpublishing capabilities.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React |
| **Backend** | Python 3.13, Django 5.2, Django REST Framework |
| **Database** | PostgreSQL in production (SQLite fallback in local dev) |
| **Playback** | Official YouTube IFrame Player API |
| **Testing** | Vitest + React Testing Library (frontend), pytest + Django test client (backend) |

---

## 🚀 Quick Start Guide

### Option A — Docker (recommended)

Everything runs in containers; no local Python/Node setup needed.

**Development** (hot reload included):

```bash
docker compose up
# Frontend: http://localhost:5173  (API auto-proxied to the backend)
# Backend:  http://localhost:8000
```

- Backend uses SQLite via a bind mount, so an existing `backend/db.sqlite3`
  (seeded catalog, admin account) keeps working. Fresh databases are seeded
  automatically on first boot.
- Stop any locally-run dev servers on ports 8000/5173 first, or override
  `BACKEND_PORT` / `FRONTEND_PORT`.

**Production** (nginx + gunicorn + PostgreSQL):

```bash
cp .env.example .env          # set DJANGO_SECRET_KEY + POSTGRES_PASSWORD
docker compose -f docker-compose.prod.yml up --build -d
# App: http://localhost:80  (override with HTTP_PORT in .env)

docker compose -f docker-compose.prod.yml exec backend \
  python manage.py createsuperuser
```

When you put real HTTPS in front (certbot / cloud proxy / PaaS), set in
`.env`: `DJANGO_SSL_REDIRECT=True`, plus your real domain in
`DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`.

Logs: `docker compose logs -f` (dev) or `docker compose -f
docker-compose.prod.yml logs -f` (prod). Stop with `Ctrl+C` (dev) or
`docker compose -f docker-compose.prod.yml down` (prod).

### Option B — Manual setup (no Docker)

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Seed catalog with authentic songs and stations
python manage.py seed_catalog

# Run backend tests
python manage.py test radio_core

# Start development server
python manage.py runserver 0.0.0.0:8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run frontend tests
npm run test

# Build production bundle
npm run build

# Start frontend dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## ☁️ Deploy on Render (recommended PaaS)

The repo ships a `render.yaml` blueprint that provisions everything:

1. Push this repo to GitHub (CI runs backend tests, frontend tests + build,
   and both Docker image builds on every push).
2. On [render.com](https://render.com): **New → Blueprint → select the repo**.
   Render reads `render.yaml` and creates:
   - **purano-dhun-api** — Django (gunicorn) from `backend/Dockerfile`
   - **purano-dhun** — the React SPA as a static site
   - **purano-dhun-db** — managed PostgreSQL (auto-wired via `DATABASE_URL`)
3. After the first deploy, create the admin via the API service's Shell:
   `python manage.py createsuperuser`

Notes:
- Free plan: services spin down after ~15 min idle (~60s cold start), and
  **free Postgres is wiped every 90 days** — switch the database plan to
  "paid" (or back up with `pg_dump`) for anything you care about.
- Renaming services? Update the `onrender.com` URLs in `render.yaml`
  (`DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`,
  `VITE_API_BASE`) to the real hostnames.
- Custom domain later: add it in the Render dashboard; the settings already
  honor `X-Forwarded-Proto` for HTTPS.

---

## 🔑 Administrative Access

- Create a Django staff or superuser account, then sign in through **Admin Portal** or visit `/django-admin/`.
- The API session is cookie-based and CSRF-protected, so admin actions stay tied to the logged-in browser session.

---

## 📂 Project Structure

```
bajeko_chiya_pasal/
├── backend/
│   ├── manage.py
│   ├── purano_dhun_backend/    # Django project settings and URLs
│   ├── radio_core/             # Models, serializers, views, admin, seed command, tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Navigation, Player, RadioTuner, Cards, Modals, Footer
│   │   ├── context/            # PlayerContext (YouTube API), I18nContext
│   │   ├── locales/            # en.ts, ne.ts translation dictionaries
│   │   ├── pages/              # Home, Catalog, RadioWorlds, Favorites
│   │   ├── services/           # api.ts (DRF client)
│   │   └── types/              # TypeScript models
│   ├── public/                 # PWA manifest, service worker, offline fallback, SVG icons
│   └── package.json
├── docs/                       # Architectural specifications
├── .env.example
├── README.md
├── SECURITY.md
├── PRIVACY.md
├── TERMS.md
└── COPYRIGHT.md
```
