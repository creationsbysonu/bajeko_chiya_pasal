# SEO playbook — Bajeko Chiya Pasal

Live site: <https://bajeko-chiya-pasal.vercel.app/>

This file records what is already automated, what only the owner can do, and
where to add content that earns rankings. Implementation details live in
`DEPLOY.md` §8.

---

## 1. What ships automatically on every deploy

`cd frontend && npm run build` = `tsc -b && vite build && prerender`.

The prerender step reads the public catalog from Supabase and writes:

| Output | Contents |
| --- | --- |
| `dist/index.html` | home page with a real crawlable body |
| `dist/stations.html` + `dist/stations/*.html` | radio world index + 10 stations |
| `dist/catalog.html` | catalog with genre/decade links and top songs |
| `dist/genres.html` + `dist/genres/*.html` | genre index + every genre collection |
| `dist/artists.html` + `dist/artists/*.html` | A–Z artist hub + one page per artist |
| `dist/decades.html` + `dist/decades/*.html` | decade hub + 1960s → 2020s collections |
| `dist/festivals.html` + `dist/festivals/*.html` | festival hub + Dashain, Tihar, Chhath, Teej, … playlists |
| `dist/songs/<id>/<slug>.html` | one page per song |
| `dist/sitemap.xml` | 500+ canonical URLs, regenerated from the catalog |
| `dist/feed.xml` | 50 newest songs (RSS 2.0) |

Each page has a unique `<title>`, meta description, canonical, Open Graph /
Twitter card, one `<h1>`, breadcrumbs, internal links, and JSON-LD
(`MusicRecording` + `VideoObject`, `Person`, `RadioStation`, `CollectionPage` +
`ItemList`, `BreadcrumbList`). `vercel.json` uses `cleanUrls`, so the URLs are
extension-free. `/favorites` is `noindex` and disallowed in `robots.txt`.

Nothing above needs manual regeneration. Adding a song, artist, genre, station
or festival in the admin portal and redeploying is enough. The new content is
not in the sitemap until the next deploy — that is intentional and keeps the
sitemap free of URLs that do not exist yet.

---

## 2. Owner checklist (one time, then quarterly)

1. **Google Search Console** — property type **URL prefix**
   `https://bajeko-chiya-pasal.vercel.app/`.
   Verify with the **HTML tag** method: paste the generated
   `google-site-verification` meta tag into `frontend/index.html`, deploy, click
   Verify. DNS verification is not available for a `*.vercel.app` subdomain.
2. **Submit the sitemap**: Search Console → Sitemaps →
   `https://bajeko-chiya-pasal.vercel.app/sitemap.xml`.
3. **Request indexing** (URL Inspection) for `/`, `/stations`, `/catalog`,
   `/genres`, and one song + one artist page.
4. **Bing Webmaster Tools** — import the verified site from Search Console.
   Bing feeds DuckDuckGo and several AI answer engines.
5. Run **Rich Results Test** on a song, artist and station URL, and **PageSpeed
   Insights** mobile on `/`.
6. Re-check Search Console → Pages after 1–2 weeks: “Discovered – currently not
   indexed” is normal for a new catalog; “Excluded by noindex” should only be
   `/favorites`.

Optional but useful:

- **Google Business Profile** is not applicable (online-only service), but a
  public “About / Contact” page with a real name and email improves trust
  signals. `guptasonu.com.np` is already linked from the footer.
- **Custom domain**: strongly recommended. `*.vercel.app` is a shared domain;
  a real domain makes brand queries and backlinks cleaner. Follow
  `DEPLOY.md` §8 “Custom domain” so every canonical moves together.

---

## 3. Keyword map

The site now has a page for each of these intents:

| Intent | Landing page |
| --- | --- |
| brand / “bajeko chiya pasal” | `/` |
| “Nepali music radio”, “Nepali radio online” | `/` + `/stations` |
| “old Nepali songs”, “purano nepali geet” | `/decades/1960s` … `/decades/2020s` |
| “<song title> song”, “<song> lyrics/listen” | `/songs/<id>/<slug>` |
| “<artist> songs”, “<artist> discography” | `/artists/<id>/<slug>` |
| “Nepali singers”, “Nepali bands” | `/artists` |
| “lok dohori songs”, “Nepali rock”, “ghazal” | `/genres/<slug>` |
| “Nepali music genres” | `/genres` |
| “Dashain songs”, “Tihar songs”, “Chhath songs” | `/festivals/<slug>` |
| “Nepali festival songs” | `/festivals` |
| “Nepali song search” | `/catalog` |

Titles are written as `entity — context | brand`, descriptions are clipped to
~158 characters, and every page carries both the Latin and Devanagari name
where the catalog has them. That covers Romanized searches (“purano nepali
geet”) and Nepali-script searches (पुराना नेपाली गीत) without separate URLs.

---

## 4. Content that would raise the ceiling

Prerendering makes pages discoverable; it does not create authority. The
highest-leverage additions, in order:

1. **Artist biographies** (150–300 words, Nepali + English). They are already
   rendered on artist pages and in `Person` JSON-LD; empty biographies are the
   main thin-content gap.
2. **Song context** — the film, album, year, composer and a sentence about why
   the recording matters. These fields already exist; richer copy on the song
   page is the easiest ranking improvement.
3. **Editorial guides** — “The 25 best Narayan Gopal songs”, “Dashain songs
   through the decades”, “A beginner's guide to lok dohori”. Add them as real
   routes with real copy, not as keyword pages.
4. **Backlinks** — Nepali music communities, Reddit r/Nepal, Facebook groups,
   music blogs, university radio societies. Genuine recommendations only.
5. **Freshness** — publish new songs/festival playlists regularly; the RSS feed
   and sitemap already expose them on the next deploy.

Avoid: keyword-stuffed hidden copy, fake location pages, auto-generated lyrics
you do not have rights to, and buying links. Those can get the domain
deindexed, which is far worse than ranking slowly.

---

## 5. Monitoring

- **Search Console** → Performance: track queries containing “song”, “songs”,
  “radio”, and artist names. Pages tab: watch for soft-404s or canonical
  mismatches.
- **Vercel Analytics** (if enabled) → Core Web Vitals by route.
- **Supabase** → keep the project awake (free tier pauses after ~7 days idle).
  A paused database means the build-time prerender cannot run and every client
  fetch fails.
- Re-run `npm run build` locally after catalog changes and spot-check
  `dist/sitemap.xml` URL count and a random song page.
