import React from 'react';
import { Station } from '../types';
import { StationCard } from '../components/StationCard';
import { useI18n } from '../context/I18nContext';
import { JsonLd } from '../components/JsonLd';
import { SITE_URL } from '../utils/seo';

interface RadioWorldsPageProps {
  stations: Station[];
}

export const RadioWorldsPage: React.FC<RadioWorldsPageProps> = ({ stations }) => {
  const { locale, t } = useI18n();
  const ne = locale === 'ne';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Describes the ten worlds as a single browsable collection in the
          displayed language — the same list the grid below renders. */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: ne ? t.stations.heading : 'Radio Worlds',
          url: `${SITE_URL}/stations`,
          inLanguage: ne ? 'ne-NP' : 'en',
          isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: stations.length,
            itemListElement: stations.map((station, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'RadioStation',
                name: ne ? station.title_ne || station.title : station.title,
                description: ne
                  ? station.tagline_ne || station.tagline
                  : station.tagline,
                genre: station.title,
                url: `${SITE_URL}/stations`,
              },
            })),
          },
        }}
      />

      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">
          <span>THEMED RADIO WORLDS</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2">
          {t.stations.heading}
        </h1>
        <p className="text-xs text-neutral-500 font-nepali">
          {t.stations.subheading}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stations.map((station) => (
          <StationCard key={station.slug} station={station} />
        ))}
      </div>
    </div>
  );
};
