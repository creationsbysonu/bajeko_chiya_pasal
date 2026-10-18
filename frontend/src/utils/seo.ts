/**
 * Crawlable routes + the document metadata each one needs.
 *
 * The app used to be four `<button>` tabs with no URL, so search engines saw a
 * single page: no distinct titles, no canonicals, no sitemap entries and no
 * internal links to follow. Every tab now owns a real path (Vercel already
 * rewrites all paths to index.html), and switching tab rewrites `<title>`,
 * the description, the canonical and the robots directive so each route
 * competes for its own queries instead of cannibalising `/`.
 *
 * Keep this file in sync with `public/sitemap.xml` and `vercel.json`.
 */

export type RouteTab = 'home' | 'stations' | 'catalog' | 'favorites';

/** Production origin — canonicals, sitemap and social cards all hardcode it. */
export const SITE_URL = 'https://bajeko-chiya-pasal.vercel.app';
export const SITE_NAME = 'Bajeko Chiya Pasal';

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
      ne: 'बजेको चिया पसल | Bajeko Chiya Pasal — नेपाली संगीत, पुराना सम्झना',
      en: 'Bajeko Chiya Pasal | Nepali Music Radio & Nostalgia — बजेको चिया पसल',
    },
    description: {
      ne: 'बजेको चिया पसल — नेपाली संगीत रेडियो। चिया पसल, पुरानो रेडियो, बस यात्रा जस्ता विषयमा कालजयी नेपाली गीतहरू निरन्तर बजाउनुहोस्।',
      en: 'Bajeko Chiya Pasal — a Nepali music radio. Stream timeless Nepali classics through themed stations: tea shop, vintage radio, bus journey and more.',
    },
    robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
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
      ne: 'आफ्ना मनपरेको नेपाली गीतहरू एकै ठाउँमा सुनुहोस्।',
      en: 'Your saved Nepali songs, all in one place.',
    },
    // Personal, empty for guests and duplicated by no other URL.
    robots: 'noindex,follow',
  },
};

const TABS = Object.keys(ROUTES) as RouteTab[];

/** `"/catalog/"` → `catalog`, unknown paths → `home`. */
export function pathToTab(pathname: string): RouteTab {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return TABS.find((tab) => ROUTES[tab].path === clean) ?? 'home';
}

export function tabToPath(tab: RouteTab): string {
  return ROUTES[tab].path;
}

/**
 * Programmatic navigation for links that are real `<a href>` elements (footer,
 * in-content CTAs): push the path, then notify the app through `popstate` so
 * there is exactly one code path that moves the UI between screens.
 *
 * Modified clicks are left alone by callers, so "open in new tab" still works.
 */
export function navigateTo(tab: RouteTab): void {
  const path = tabToPath(tab);
  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/** True when the address bar shows a path we do not own. The Vercel rewrite
 * answers 200 for every path, so `/whatever` would otherwise be an indexed
 * soft-404 duplicating the home page.
 */
export function isUnknownPath(pathname: string): boolean {
  return !TABS.some((tab) => ROUTES[tab].path === (pathname.replace(/\/+$/, '') || '/'));
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
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
 * Rewrites every ranking-relevant tag in `<head>` for the active route and
 * language. Social scrapers do not run JavaScript, so `og:*` here only affects
 * engines that render — the static values in `index.html` are what Facebook,
 * Slack and Discord read (keep both aligned).
 */
export function applyRouteSeo(tab: RouteTab, locale: 'ne' | 'en' = 'ne'): void {
  const route = ROUTES[tab];
  const canonical = SITE_URL + route.path;
  const lang = locale === 'en' ? 'en' : 'ne';

  document.title = route.title[lang];
  upsertMeta('name', 'description', route.description[lang]);
  upsertMeta('name', 'robots', route.robots);
  upsertLink('canonical', canonical);

  upsertMeta('property', 'og:title', route.title[lang]);
  upsertMeta('property', 'og:description', route.description[lang]);
  upsertMeta('property', 'og:url', canonical);
}
