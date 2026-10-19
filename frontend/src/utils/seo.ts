/**
 * Crawlable routes + document metadata.
 *
 * The app used to be four `<button>` tabs with no URL, so search engines saw a
 * single page. Every screen now owns a real path:
 *
 *   /                       home
 *   /stations               all radio worlds
 *   /stations/:slug         one radio world
 *   /catalog                searchable catalog
 *   /genres                 genre index
 *   /genres/:slug           one genre
 *   /decades/:decade        one decade
 *   /festivals/:slug        one festival playlist
 *   /songs/:id/:slug        one song
 *   /artists/:id/:slug      one artist
 *   /about                  about / trust page
 *   /favorites              personal list (noindex)
 *
 * Vercel answers 200 for unrecognised paths (the SPA rewrite), so anything that
 * does not parse is collapsed to "/" instead of being indexed as a soft-404.
 *
 * Entity metadata and paths live in `pageMeta.ts` so the build-time prerenderer
 * can emit the exact same head tags without loading React.
 */

import {
  DEFAULT_OG_IMAGE,
  NOINDEX_ROBOTS,
  SITE_NAME,
  SITE_URL,
  type SeoMeta,
} from './pageMeta.ts';

export { SITE_NAME, SITE_URL };
export type { SeoMeta };

export type RouteTab = 'home' | 'stations' | 'catalog' | 'favorites';

type Localised = { ne: string; en: string };

interface RouteMeta {
  path: string;
  title: Localised;
  description: Localised;
  /** Home-stored value: favorites is personal state, never a landing page. */
  robots: string;
}

export const ROUTES: Record<RouteTab, RouteMeta> = {
  home: {
    path: '/',
    title: {
      ne: 'बजेको चिया पसल | Bajeko Chiya Pasal — नेपाली संगीत रेडियो, पुराना गीत',
      en: 'Bajeko Chiya Pasal — Nepali Music Radio & Old Nepali Songs | बजेको चिया पसल',
    },
    description: {
      ne: 'Nepali music radio and song catalog — stream timeless Nepali classics, lok dohori, rock and festival songs free. बजेको चिया पसल, नेपाली संगीत, पुराना गीत।',
      en: 'Nepali music radio and song catalog — stream timeless Nepali classics, lok dohori, rock and festival songs free. बजेको चिया पसल, नेपाली संगीत, पुराना गीत।',
    },
    robots:
      'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
  },
  stations: {
    path: '/stations',
    title: {
      ne: '१० रेडियो संसार | बजेको चिया पसल — विषयगत नेपाली रेडियो',
      en: '10 Radio Worlds | Bajeko Chiya Pasal — Themed Nepali Radio Stations',
    },
    description: {
      ne: '१० वटा विषयगत नेपाली रेडियो संसार — चिया पसल, लोक गीत, रक फिल्म गीत, चाडपर्व र थप। एक क्लिकमा बजाउनुहोस्।',
      en: 'Ten themed Nepali radio worlds — tea shop, folk, rock, film songs, festivals and more. Pick a world and press play.',
    },
    robots: 'index,follow,max-image-preview:large,max-snippet:-1',
  },
  catalog: {
    path: '/catalog',
    title: {
      ne: 'नेपाली गीतसूची | बजेको चिया पसल — खोजेर सुन्नुहोस्',
      en: 'Nepali Song Catalog | Bajeko Chiya Pasal — Search & Play',
    },
    description: {
      ne: 'नेपाली गीतसूची — गायक, विधा, दशक र भाषा अनुसार खोजेर सुन्नुहोस्। नारायण गोपाल, तारा देवी, नेपथ्य र कालजयी नेपाली गीतहरू।',
      en: 'Search the Nepali song catalog by artist, genre, decade or language. Classics from Narayan Gopal, Tara Devi, Nepathya and more.',
    },
    robots: 'index,follow,max-image-preview:large,max-snippet:-1',
  },
  favorites: {
    path: '/favorites',
    title: {
      ne: 'मनपरेको गीत | Bajeko Chiya Pasal',
      en: 'Favorites | Bajeko Chiya Pasal',
    },
    description: {
      ne: 'आफ्ना मनपरेको नेपाली गीतहरू एकै ठाउँमा सुन्नुहोस्।',
      en: 'Your saved Nepali songs, all in one place.',
    },
    // Personal, empty for guests and duplicated by no other URL.
    robots: NOINDEX_ROBOTS,
  },
};

/** Every route the app understands. Tab routes are the four navigation items. */
export type AppRoute =
  | { name: RouteTab }
  | { name: 'station'; slug: string }
  | { name: 'song'; id: number }
  | { name: 'artist'; id: number }
  | { name: 'genre'; slug: string }
  | { name: 'genres' }
  | { name: 'artists' }
  | { name: 'decades' }
  | { name: 'festivals' }
  | { name: 'about' }
  | { name: 'decade'; decade: string }
  | { name: 'festival'; slug: string };

const TABS = Object.keys(ROUTES) as RouteTab[];

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function segmentsOf(pathname: string): string[] {
  return pathname
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .filter(Boolean)
    .map(decodeSegment);
}

function positiveId(value: string | undefined): number | null {
  if (!value) return null;
  const id = Number.parseInt(value.split('-')[0], 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Parse the address bar into a route. Returns `null` for paths this app does
 * not own so callers can collapse them to `/` (the Vercel rewrite makes every
 * unknown path a 200 response).
 */
export function parseRoute(pathname: string): AppRoute | null {
  const segments = segmentsOf(pathname);
  if (segments.length === 0) return { name: 'home' };

  if (segments.length === 1) {
    const [first] = segments;
    if (TABS.includes(first as RouteTab)) return { name: first as RouteTab };
    if (first === 'genres') return { name: 'genres' };
    if (first === 'artists') return { name: 'artists' };
    if (first === 'decades') return { name: 'decades' };
    if (first === 'festivals') return { name: 'festivals' };
    if (first === 'about') return { name: 'about' };
    return null;
  }

  if (segments.length === 2) {
    const [first, second] = segments;
    if (first === 'stations' && second) return { name: 'station', slug: second };
    if (first === 'genres' && second) return { name: 'genre', slug: second };
    if (first === 'festivals' && second) return { name: 'festival', slug: second };
    if (first === 'decades' && second) return { name: 'decade', decade: second };
    // Slug-less variants are accepted so old/shared links keep working; the
    // page canonicalises to the current title.
    if (first === 'songs' || first === 'artists') {
      const id = positiveId(second);
      return id ? { name: first === 'songs' ? 'song' : 'artist', id } : null;
    }
    return null;
  }

  if (segments.length === 3) {
    const [first, second] = segments;
    if (first !== 'songs' && first !== 'artists') return null;
    const id = positiveId(second);
    if (!id) return null;
    return { name: first === 'songs' ? 'song' : 'artist', id };
  }

  return null;
}

/** Which navigation tab a route belongs to (used for active link styling). */
export function routeTab(route: AppRoute): RouteTab {
  if (route.name === 'home' || route.name === 'stations' || route.name === 'catalog' || route.name === 'favorites') {
    return route.name;
  }
  // About is a brand/trust page, not a catalog surface. Highlighting Home is
  // less misleading than lighting up the catalog tab.
  if (route.name === 'about') return 'home';
  if (route.name === 'station') return 'stations';
  return 'catalog';
}

/** `"/catalog/"` → `catalog`, unknown paths → `home`. */
export function pathToTab(pathname: string): RouteTab {
  const route = parseRoute(pathname);
  return route ? routeTab(route) : 'home';
}

export function tabToPath(tab: RouteTab): string {
  return ROUTES[tab].path;
}

/**
 * Programmatic navigation for links that are real `<a href>` elements: push the
 * path, then notify the app through `popstate` so there is exactly one code
 * path that moves the UI between screens.
 *
 * Modified clicks are left alone by callers, so "open in new tab" still works.
 */
export function navigate(path: string): void {
  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function navigateTo(tab: RouteTab): void {
  navigate(tabToPath(tab));
}

/** True when the address bar shows a path we do not own. */
export function isUnknownPath(pathname: string): boolean {
  return parseRoute(pathname) === null;
}

// ---------------------------------------------------------------------------
// <head> rewriting
// ---------------------------------------------------------------------------

function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(attribute: 'name' | 'property', key: string): void {
  document.head.querySelectorAll(`meta[${attribute}="${key}"]`).forEach((el) => el.remove());
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Rewrite every ranking-relevant tag in `<head>`.
 *
 * Social scrapers do not run JavaScript, so `og:*` here only affects engines
 * that render — the static values in `index.html`, and the prerendered values
 * emitted by `scripts/prerender.ts`, are what Facebook, Slack and Discord read.
 */
export function applySeoMeta(meta: SeoMeta): void {
  document.title = meta.title;
  upsertMeta('name', 'description', meta.description);
  upsertMeta('name', 'robots', meta.robots);
  upsertLink('canonical', meta.canonical);

  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:url', meta.canonical);
  upsertMeta('property', 'og:type', meta.ogType);

  if (meta.ogImage) {
    upsertMeta('property', 'og:image', meta.ogImage);
    upsertMeta('name', 'twitter:image', meta.ogImage);
    if (meta.ogImage === DEFAULT_OG_IMAGE) {
      upsertMeta('property', 'og:image:width', '1200');
      upsertMeta('property', 'og:image:height', '630');
    } else {
      // Artwork dimensions vary per song/station, so a stale 1200×630 pair
      // would be a lie for most of them.
      removeMeta('property', 'og:image:width');
      removeMeta('property', 'og:image:height');
    }
  }
  if (meta.ogImageAlt) {
    upsertMeta('property', 'og:image:alt', meta.ogImageAlt);
    upsertMeta('name', 'twitter:image:alt', meta.ogImageAlt);
  }

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);
}

/**
 * Rewrites every ranking-relevant tag for the four tab routes and language.
 */
export function applyRouteSeo(tab: RouteTab, locale: 'ne' | 'en' = 'ne'): void {
  const route = ROUTES[tab];
  applySeoMeta({
    title: route.title[locale === 'en' ? 'en' : 'ne'],
    description: route.description[locale === 'en' ? 'en' : 'ne'],
    canonical: SITE_URL + route.path,
    robots: route.robots,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: `${SITE_NAME} — Nepali music radio`,
  });
}
