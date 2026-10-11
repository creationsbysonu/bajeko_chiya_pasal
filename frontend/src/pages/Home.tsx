import React, { useState } from 'react';
import { Hero } from '../components/Hero';
import { StationCard } from '../components/StationCard';
import { SongCard } from '../components/SongCard';
import { Station, Song, Genre } from '../types';
import { useI18n } from '../context/I18nContext';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { groupGenresByCategory } from '../utils/genreTaxonomy';

interface HomeProps {
  stations: Station[];
  featuredSongs: Song[];
  genres: Genre[];
  decades: { decade: string; count: number }[];
  onSelectGenre: (genreSlug: string) => void;
  onSelectDecade: (decade: string) => void;
  onExploreCatalog: () => void;
}

export const Home: React.FC<HomeProps> = ({
  stations,
  featuredSongs,
  genres,
  decades,
  onSelectGenre,
  onSelectDecade,
  onExploreCatalog,
}) => {
  const { locale, t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const genreGroups = groupGenresByCategory(genres);

  const faqs = [
    {
      q: 'पुरानो धुन के हो र यो कसरी काम गर्दछ?',
      q_en: 'What is Purano Dhun and how does it operate?',
      a: 'पुरानो धुन एक मौलिक नेपाली संगीत रेडियो प्लेटफर्म हो। यहाँ विभिन्न सांगीतिक परिवेश (जस्तै चिया पसल, पुरानो रेडियो, बस यात्रा) छनौट गरी निरन्तर कालजयी गीतहरू सुन्न सकिन्छ। सम्पूर्ण प्लेब्याक आधिकारिक युट्युब प्लेयर इम्बेड मार्फत हुन्छ।',
      a_en: 'Purano Dhun is an original Nepali music radio experience designed around nostalgic themes (tea shops, vintage radio, highway buses). All playback is powered strictly via official YouTube embeds without unauthorized streaming or audio extraction.',
    },
    {
      q: 'के गीत सुन्न खाता खोल्नु अनिवार्य छ?',
      q_en: 'Is an account mandatory to listen?',
      a: 'छैन। अतिथि प्रयोगकर्ताको रूपमा जो कोहीले पनि बिना दर्ता जुनसुकै स्टेसन वा गीत सुन्न र मनपर्ने सूचीमा थप्न सक्नुहुन्छ।',
      a_en: 'No. Anonymous guest listening is fully supported. You can tune in, shuffle stations, and save favorites immediately.',
    },
    {
      q: 'कुनै भिडियो नबजेमा वा प्रतिलिपि अधिकार सम्बन्धी उजुरी भएमा के गर्ने?',
      q_en: 'What if a video is unavailable or requires copyright moderation?',
      a: 'पृष्ठको माथि वा तल रहेको "प्रतिलिपि अधिकार तथा उजुरी" फारम मार्फत जानकारी गराउन सक्नुहुन्छ। हाम्रो टोलीले तत्काल समीक्षा गरी आवश्यक परेमा सामग्री हटाउनेछ।',
      a_en: 'You can submit an immediate report via the Content & Takedown form. Our administration promptly reviews tickets and unpublishes disputed content.',
    },
    {
      q: 'के अफलाइन हुँदा गीत बज्छ?',
      q_en: 'Can songs play when offline?',
      a: 'इन्टरफेस र क्याटलग अफलाइन सुरक्षित हुन्छ, तर युट्युबको आधिकारिक इम्बेड अडियो सुन्न सक्रिय इन्टरनेट जडान चाहिन्छ।',
      a_en: 'The app shell and catalog UI are cached via PWA, but live audio streaming requires an active internet connection per YouTube embed terms.',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero with Integrated Vintage Radio Tuner */}
      <Hero stations={stations} onExploreCatalog={onExploreCatalog} />

      {/* 2. Grandfather's Tea Shop & Heritage Story Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl p-6 md:p-10">
          {/* Soothing photographic backdrop */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80"
              alt="Baje ko Chiya Pasal"
              className="w-full h-full object-cover brightness-[0.22] contrast-[1.1]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/60" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold font-nepali tracking-wider">
                <span>बजेको चिया पसल • परम्परागत सम्झना</span>
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-black text-white drop-shadow-sm">
                {locale === 'ne' 
                  ? 'चियाको चुस्की, पुरानो रेडियो र पहाडी सम्झना' 
                  : 'Steaming Milk Tea, Vintage Transistors & Mountain Memories'}
              </h2>
              <p className="text-sm text-cream-200/90 font-nepali leading-relaxed font-medium">
                {locale === 'ne'
                  ? 'बिहानीको चिसो कुइरो, भट्टीको कोइलामा उम्लिँदै गरेको दूध चिया, र काठको टेबुलमा बजिरहेको नारायण गोपाल वा तारा देवीको धुन। पुरानो धुन केवल एउटा संगीत एप होइन, यो हाम्रो बाल्यकाल र अग्रजहरूको आत्मीय सम्झनाको संगम हो।'
                  : 'Morning hill fog, hot cardamom milk tea simmering on copper kettles, and a wooden transistor playing the timeless melodies of Narayan Gopal and Tara Devi. Purano Dhun is a living tribute to Nepal\'s collective nostalgia.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
              <button
                onClick={() => onSelectGenre('adhunik-geet')}
                className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wide shadow-glow-red border border-red-500/50 transition-all duration-300 ease-out hover:scale-105 active:scale-95"
              >
                {locale === 'ne' ? 'आधुनिक गीत सुन्नुहोस्' : 'Listen to Golden Classics'}
              </button>
              <button
                onClick={() => onSelectGenre('folk-instrumental')}
                className="px-6 py-3 rounded-full bg-transparent hover:bg-white/5 text-white font-medium text-xs border border-white/15 hover:border-white/30 transition-all duration-200 ease-out hover:scale-105 active:scale-95"
              >
                {locale === 'ne' ? 'सारङ्गी र बाँसुरी धुन' : 'Sarangi & Flute Heritage'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Themed Radio Worlds Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
              <span>THEMED RADIO WORLDS</span>
            </div>
            <h2 className="font-serif text-3xl font-black text-white drop-shadow-sm">
              {t.stations.heading}
            </h2>
            <p className="text-xs text-neutral-500 font-nepali mt-1">
              {t.stations.subheading}
            </p>
          </div>
          <span className="text-[11px] font-mono text-neutral-600">
            {stations.length} stations
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {stations.map((st) => (
            <StationCard key={st.slug} station={st} />
          ))}
        </div>
      </section>

      {/* 4. Featured Verified Songs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
              <span>FEATURED SONGS</span>
            </div>
            <h2 className="font-serif text-3xl font-black text-white drop-shadow-sm">
              {locale === 'ne' ? 'विशेष कालजयी धुनहरू' : 'Featured Masterpieces'}
            </h2>
            <p className="text-xs text-neutral-500 font-nepali mt-1">
              {locale === 'ne' ? 'प्रमाणित अभिलेख र आधिकारिक युट्युब इम्बेड सहित' : 'Curated classic recordings with verified metadata'}
            </p>
          </div>

          <button
            onClick={onExploreCatalog}
            className="text-xs font-bold text-red-400 hover:text-red-300 underline font-mono flex items-center gap-1.5"
          >
            <span>View All ({featuredSongs.length}+)</span>
            <span>→</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredSongs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>

      {/* 5. Browse by Decade */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            <span>EXPLORE BY ERA</span>
          </div>
          <h2 className="font-serif text-2xl font-black text-white drop-shadow-sm">
            {locale === 'ne' ? 'दशक अनुसार संगीत खोज्नुहोस्' : 'Explore by Musical Era'}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {decades.map((d) => (
            <button
              key={d.decade}
              onClick={() => onSelectDecade(d.decade)}
              className="p-4 rounded-2xl bg-black/60 hover:bg-red-600 text-center transition-all duration-300 ease-out hover:scale-105 active:scale-95 border border-white/10 hover:border-red-500/50 shadow-md group"
            >
              <span className="font-serif text-lg font-bold block text-white group-hover:text-white">
                {d.decade}
              </span>
              <span className="text-[11px] font-mono text-neutral-500 group-hover:text-white/70 transition-colors">
                {d.count} songs
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 6. Browse by Genre Taxonomy */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            <span>BROWSE GENRES</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-white drop-shadow-sm">
            {locale === 'ne' ? 'सांगीतिक विधा वर्गीकरण' : 'Browse Musical Genres'}
          </h2>
        </div>

        <div className="space-y-6">
          {genreGroups.map((group) => (
            <div key={group.category} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-neutral-500">
                  {group.label}
                </h3>
                <span className="text-[10px] font-mono text-neutral-600">
                  {group.genres.length} genres
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {group.genres.map((g) => (
                  <button
                    key={g.slug}
                    onClick={() => onSelectGenre(g.slug)}
                    className="p-3.5 rounded-xl bg-black hover:bg-white/4 border border-white/8 hover:border-white/20 text-left transition-all duration-200 ease-out hover:scale-105 active:scale-95 group"
                  >
                    <h4 className="font-serif text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
                      {locale === 'ne' ? g.name_ne || g.name : g.name}
                    </h4>
                    <p className="text-[10px] text-red-400 font-mono mt-0.5 font-bold">
                      {group.label.toUpperCase()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            <span>FAQ</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-cream-100">
            {locale === 'ne' ? 'प्रायः सोधिने प्रश्नहरू' : 'Frequently Asked Questions'}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-white/3 border border-white/8 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-medium text-white hover:text-red-400 font-nepali transition-colors duration-150"
                >
                  <span>{locale === 'ne' ? faq.q : faq.q_en}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-neutral-400 font-nepali leading-relaxed border-t border-white/5 pt-3">
                    {locale === 'ne' ? faq.a : faq.a_en}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
