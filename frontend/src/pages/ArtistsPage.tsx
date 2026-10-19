import React, { useEffect, useMemo, useState } from 'react';
import { Mic2 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import type { Artist } from '../types';
import { artistPath, artistsSeo, itemListJsonLd } from '../utils/pageMeta';
import { usePageSeo } from '../hooks/usePageSeo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { JsonLd } from '../components/JsonLd';
import { AppLink } from '../components/AppLink';

/** `/artists` — an A–Z hub that links every artist discography page. */
export const ArtistsPage: React.FC = () => {
  const { locale, t } = useI18n();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .getArtists()
      .then((list) => {
        // Artists without a published song have no prerendered page and no
        // discography to show, so they must not be linked from the hub.
        if (active) setArtists(list.filter((artist) => (artist.songs_count ?? 0) > 0));
      })
      .catch((error) => console.error('Failed to load artists', error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const meta = useMemo(() => artistsSeo(locale), [locale]);
  usePageSeo(meta);

  const groups = useMemo(() => {
    const sorted = [...artists].sort((a, b) => a.display_name.localeCompare(b.display_name));
    const map = new Map<string, Artist[]>();
    for (const artist of sorted) {
      const first = (artist.display_name || '?').trim().charAt(0).toUpperCase();
      const letter = /^[A-Z]$/.test(first) ? first : '#';
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(artist);
    }
    return Array.from(map.entries()).sort(([a], [b]) =>
      a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)
    );
  }, [artists]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd
        data={itemListJsonLd({
          name: 'Nepali artists',
          description: 'Nepali singers, bands and composers on Bajeko Chiya Pasal.',
          path: '/artists',
          items: artists.map((artist) => ({
            name: artist.display_name,
            url: artistPath(artist),
            type: 'Person',
          })),
          inLanguage: locale === 'ne' ? 'ne-NP' : 'en',
        })}
      />

      <Breadcrumbs
        items={[
          { name: t.pages.home, path: '/' },
          { name: locale === 'ne' ? 'कलाकारहरू' : 'Artists', path: '/artists' },
        ]}
      />

      <header className="mb-10 max-w-3xl">
        <p className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
          <Mic2 className="w-3.5 h-3.5 text-red-500" /> {t.pages.artist}
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400">
            {artists.length} {locale === 'ne' ? 'कलाकार' : 'artists'}
          </span>
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-white">
          {locale === 'ne' ? 'नेपाली कलाकारहरू' : 'Nepali Artists'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          {locale === 'ne'
            ? 'गायक, ब्यान्ड र संगीतकारहरूको जीवनी र सम्पूर्ण गीतसूची — नारायण गोपालदेखि आजका नयाँ कलाकारसम्म।'
            : 'Biographies and complete discographies — from Narayan Gopal and Tara Devi to today’s new voices.'}
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([letter, list]) => (
            <section key={letter}>
              <h2 className="mb-3 flex items-center gap-3 text-xs font-mono uppercase tracking-[0.25em] text-neutral-500">
                <span className="text-red-500">{letter}</span>
                <span className="h-px flex-1 bg-white/8" />
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {list.map((artist) => (
                  <li key={artist.id}>
                    <AppLink
                      href={artistPath(artist)}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 transition-colors hover:border-red-500/40 hover:bg-white/[0.06]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white group-hover:text-red-300">
                          {locale === 'ne' ? artist.display_name_ne || artist.display_name : artist.display_name}
                        </span>
                        {artist.display_name_ne && artist.display_name_ne !== artist.display_name && (
                          <span className="mt-0.5 block truncate text-xs text-neutral-500">
                            {locale === 'ne' ? artist.display_name : artist.display_name_ne}
                          </span>
                        )}
                      </span>
                      <span className="flex-shrink-0 text-[11px] font-mono text-neutral-500">
                        {artist.songs_count ?? 0}
                      </span>
                    </AppLink>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
