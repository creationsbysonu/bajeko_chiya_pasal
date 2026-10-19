import React, { useMemo } from 'react';
import { Coffee, Radio, ShieldCheck, Music4, ExternalLink } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import {
  ABOUT_PATH,
  aboutJsonLd,
  aboutSeo,
} from '../utils/pageMeta';
import { usePageSeo } from '../hooks/usePageSeo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { JsonLd } from '../components/JsonLd';
import { AppLink } from '../components/AppLink';

interface AboutPageProps {
  onOpenTakedown?: () => void;
}

/**
 * `/about` — the trust page search engines and listeners look for on an
 * independent music site. It explains what the archive is, how playback is
 * licensed (official YouTube embeds only), who maintains it and how to report a
 * problem. It is intentionally factual: no invented awards, addresses or
 * download claims.
 */
export const AboutPage: React.FC<AboutPageProps> = ({ onOpenTakedown }) => {
  const { locale, t } = useI18n();
  const ne = locale === 'ne';
  const meta = useMemo(() => aboutSeo(locale), [locale]);
  usePageSeo(meta);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd data={aboutJsonLd(locale)} />

      <Breadcrumbs
        items={[
          { name: t.pages.home, path: '/' },
          { name: ne ? 'बारेमा' : 'About', path: ABOUT_PATH },
        ]}
      />

      <header className="mb-10 max-w-3xl">
        <p className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
          <Coffee className="w-3.5 h-3.5 text-red-500" />
          {ne ? 'बजेको चिया पसल' : 'Bajeko Chiya Pasal'}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-white">
          {ne ? 'बजेको चिया पसलको बारेमा' : 'About Bajeko Chiya Pasal'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400 font-nepali">
          {ne
            ? 'बजेको चिया पसल एक स्वतन्त्र नेपाली संगीत रेडियो र गीत संग्रह हो। चिया पसलको कुनाको पुरानो रेडियोजस्तै, यहाँ पुराना नेपाली गीत, लोक दोहोरी, रेडियो नेपालका सम्झना र चाडपर्वका धुनहरू विषयगत संसारमा मिलाइएका छन्।'
            : 'Bajeko Chiya Pasal is an independent Nepali music radio and song archive. Like the old radio in the corner of a tea shop, it gathers old Nepali songs, lok dohori, Radio Nepal memories and festival melodies into themed listening worlds.'}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-2 flex items-center gap-2 font-serif text-lg font-bold text-white">
            <Music4 className="w-4 h-4 text-red-500" />
            {ne ? 'के सुन्न सकिन्छ?' : 'What can you listen to?'}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-400 font-nepali">
            {ne
              ? 'क्याटलगमा नारायण गोपाल, तारा देवी, भक्तराज आचार्य, नेपथ्य र नयाँ पुस्ताका कलाकारसम्मका गीत छन्। विधा, कलाकार, दशक वा चाडपर्व अनुसार श्रेणीबद्ध गरिएको छ।'
              : 'The catalog spans Narayan Gopal, Tara Devi, Bhaktaraj Acharya, Nepathya and newer voices, organised by genre, artist, decade and festival.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <AppLink href="/stations" className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-neutral-200 hover:bg-white/10">
              {t.pages.browseStations}
            </AppLink>
            <AppLink href="/catalog" className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-neutral-200 hover:bg-white/10">
              {t.pages.browseCatalog}
            </AppLink>
            <AppLink href="/artists" className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-neutral-200 hover:bg-white/10">
              {ne ? 'कलाकारहरू' : 'Artists'}
            </AppLink>
            <AppLink href="/decades" className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-neutral-200 hover:bg-white/10">
              {ne ? 'दशक अनुसार' : 'By decade'}
            </AppLink>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-2 flex items-center gap-2 font-serif text-lg font-bold text-white">
            <Radio className="w-4 h-4 text-red-500" />
            {ne ? 'प्लेब्याक कसरी चल्छ?' : 'How does playback work?'}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-400 font-nepali">
            {ne
              ? 'हरेक गीत आधिकारिक युट्युब इम्बेडबाट बज्छ। यस साइटले कुनै अडियो फाइल होस्ट, डाउनलोड वा पुनःप्रसारण गर्दैन — श्रेय र प्लेब्याक सिधै मूल स्रोतमा जान्छ।'
              : 'Every track plays through an official YouTube embed. This site does not host, download or re-stream audio files; credit and playback stay with the original source.'}
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-2 flex items-center gap-2 font-serif text-lg font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-red-500" />
            {ne ? 'स्वामित्व र सुधार' : 'Copyright and corrections'}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-400 font-nepali">
            {ne
              ? 'गीत, शब्द र स्वर सम्बन्धित कलाकार तथा अधिकारधारीहरूको हो। कुनै सामग्री हटाउन वा विवरण सुधार्न अनुरोध भएमा उजुरी फारमबाट जानकारी गराउनुहोस् — हामी समीक्षा गरी आवश्यक कारबाही गर्छौं।'
              : 'Songs, lyrics and recordings belong to their artists and rights holders. To remove a track or correct its details, use the takedown form — every report is reviewed and acted on.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold">
            {onOpenTakedown && (
              <button
                type="button"
                onClick={onOpenTakedown}
                className="rounded-full bg-red-600 px-4 py-1.5 text-white hover:bg-red-500"
              >
                {t.nav.reportCopyright}
              </button>
            )}
            <a
              href="https://github.com/creationsbysonu/bajeko_chiya_pasal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-neutral-200 hover:bg-white/10"
            >
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-2 flex items-center gap-2 font-serif text-lg font-bold text-white">
            <Coffee className="w-4 h-4 text-red-500" />
            {ne ? 'कसले बनाउँछ?' : 'Who maintains it?'}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-400 font-nepali">
            {ne
              ? 'यो परियोजना काठमाडौंमा स्वतन्त्र रूपमा बनाइएको र मर्मत गरिएको हो। साइटको विकास सोनु गुप्ताले गर्नुभएको हो। सुझाव, सुधार वा सहकार्यका लागि विकासकर्ताको साइटमा सम्पर्क गर्न सक्नुहुन्छ।'
              : 'This project is independently built and maintained in Kathmandu. The site is developed by Sonu Gupta; suggestions, corrections and collaborations are welcome through the developer site.'}
          </p>
          <a
            href="https://guptasonu.com.np"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300"
          >
            guptasonu.com.np <ExternalLink className="w-3 h-3" />
          </a>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-5">
        <h2 className="mb-2 font-serif text-lg font-bold text-white">
          {ne ? 'संग्रह कसरी व्यवस्थित छ?' : 'How the archive is organised'}
        </h2>
        <p className="text-sm leading-relaxed text-neutral-400 font-nepali">
          {ne
            ? 'हरेक गीतको एउटा स्थायी पृष्ठ छ जहाँ कलाकार, वर्ष, विधा, दशक र स्रोत उल्लेख गरिएको हुन्छ। कलाकार, विधा, दशक र चाडपर्वका छुट्टै संग्रह पृष्ठहरूले पूरा सङ्ग्रहलाई जोड्छन्, त्यसैले खोज र ब्राउजिङ दुवै सजिलो हुन्छ।'
            : 'Every song has a permanent page with its artist, year, genre, decade and source. Separate collections for artists, genres, decades and festivals connect the whole archive, so it is easy to browse as well as search.'}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400 font-nepali">
          {ne
            ? 'क्याटलग नियमित अद्यावधिक हुन्छ; नयाँ गीत थपिँदा आरएसएस फिड र साइटम्याप पनि अर्को डिप्लोयमा अद्यावधिक हुन्छ।'
            : 'The catalog is updated regularly; new songs also refresh the RSS feed and sitemap on the next deploy.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <AppLink href="/genres" className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-neutral-200 hover:bg-white/10">
            {t.pages.genres}
          </AppLink>
          <AppLink href="/festivals" className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-neutral-200 hover:bg-white/10">
            {ne ? 'चाडपर्वका गीत' : 'Festival playlists'}
          </AppLink>
          <AppLink href="/feed.xml" className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-neutral-200 hover:bg-white/10">
            RSS
          </AppLink>
        </div>
      </section>
    </div>
  );
};
