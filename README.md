# Purano Dhun (पुरानो धुन) — Nepali Music Radio & Nostalgia Platform

> **नेपाली संगीत, पुराना सम्झना।**  
> *Nepali Music, Timeless Memories.*

An original, production-oriented Nepali music discovery and radio platform inspired by Nepal’s musical heritage, vintage transistor radios, steaming tea shops (*chiya pasal*), highway bus journeys (*bus yatra*), festival celebrations, and immortal melodies.

---

## Core Highlights & Features

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
  - **Mobile-First & Background Playback**: responsive layout with iPhone notch/home-indicator safe areas, thumb-friendly touch targets, and 16px form fields (no iOS focus zoom). Audio keeps playing when you lock the phone or switch apps — the player re-syncs on `visibilitychange`/`pageshow`, and the **Media Session API** puts artwork, title/artist, and play/pause/next/previous/seek controls on the Android/iOS lock screen, notification shade, and Bluetooth headsets.
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

## Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React (Vercel) |
| **Backend** | Supabase RPCs — SQL functions (`SECURITY DEFINER`) with deny-all RLS; no app server |
| **Database** | Supabase PostgreSQL (free tier, no 90-day wipe) |
| **Auth** | Supabase Auth (anonymous sessions for listeners, allowlisted admins for the portal) |
| **Playback** | Official YouTube IFrame Player API |
| **Testing** | Vitest + React Testing Library (frontend), PGlite SQL harness exercising every RPC (backend) |

The Django/Render/Docker stack this project originally shipped with has been
replaced: see **[DEPLOY.md](DEPLOY.md)** for the Supabase + Vercel setup.

---

## Quick Start

### 1. Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local      # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run test                       # component tests
npm run build                      # typecheck + production build
npm run dev                        # http://localhost:5173
```

### 2. Database + backend functions

Apply `supabase/migrations/*.sql` then `supabase/seed.sql` to your Supabase
project (SQL Editor or `supabase db push`), enable Anonymous sign-ins, and
allowlist an admin — the full walkthrough with exact steps is in
**[DEPLOY.md](DEPLOY.md)**.

Fully local alternative: `supabase start && supabase db reset` (Supabase CLI).

### 3. Verify the backend SQL (replaces the old Django test suite)

```bash
cd supabase
npm install
npm run verify    # applies migrations + seed to in-process Postgres, runs
                  # ~99 assertions across every public/admin RPC, RLS lockdown,
                  # auth gating, audit trails, internal-RPC lockdown and abuse
                  # limits — no Docker needed
```

---

## Production deployment

Push to GitHub, then follow **[DEPLOY.md](DEPLOY.md)**:

1. **Supabase** — create project, run the 6 migrations + seed, enable
   anonymous sign-ins, create/allowlist the admin user.
2. **Vercel** — import repo, root directory `frontend`, set
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, deploy.
3. CI (`.github/workflows/ci.yml`) runs the SQL harness and the frontend
   tests + build on every push.

Free-tier notes (Supabase pausing after 7 days idle, Vercel Hobby limits) are
documented at the bottom of DEPLOY.md.

---

## Administrative Access

Admins sign in through the **Admin Portal** with a Supabase Auth account that
appears in the `public.admins` allowlist (DEPLOY.md §4). Every `admin_*` RPC
checks that allowlist server-side and writes an audit trail; direct table
access is denied to browser roles by row-level security.

---

## Project Structure

```
purano-dhun/
├── frontend/
│   ├── src/
│   │   ├── components/         # Navigation, Player, RadioTuner, Cards, Modals, Footer
│   │   ├── context/            # PlayerContext (YouTube API), I18nContext
│   │   ├── locales/            # en.ts, ne.ts translation dictionaries
│   │   ├── pages/              # Home, Catalog, RadioWorlds, Favorites
│   │   ├── services/           # api.ts (Supabase RPC client)
│   │   └── types/              # TypeScript models
│   ├── public/                 # PWA manifest, service worker, offline fallback, SVG icons
│   └── vercel.json             # SPA rewrite rule
├── supabase/
│   ├── migrations/             # schema, public RPCs, admin RPCs, RLS
│   ├── seed.sql                # full catalog seed (generated)
│   ├── tools/generate_seed.py  # re-exports seed from the legacy SQLite catalog
│   └── verify.mjs              # PGlite RPC test harness (CI gate)
├── DEPLOY.md                   # Supabase + Vercel deployment guide
├── .env.example
├── README.md
├── SECURITY.md
├── PRIVACY.md
├── TERMS.md
└── COPYRIGHT.md
```
