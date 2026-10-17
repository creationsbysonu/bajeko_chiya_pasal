import React from 'react';

/**
 * Hand-drawn festival glyphs.
 *
 * Every festival gets a single-weight line drawing in the same 24×24 grid as
 * the rest of the app's iconography. They replace the old festival emoji so the
 * catalog reads like a curated cultural archive rather than a templated page:
 * one consistent stroke, no fills, no colour emoji.
 *
 * Add a festival by dropping a new entry keyed by its `slug`.
 */
interface FestivalGlyphProps {
  /** Festival slug, e.g. "dashain". Falls back to a generic music mark. */
  slug?: string | null;
  className?: string;
  strokeWidth?: number;
}

const ART: Record<string, React.ReactNode> = {
  // Dashain — kite (चङ्गा) with tail
  dashain: (
    <>
      <path d="M12 2.5 19.5 9.5 12 16.5 4.5 9.5Z" />
      <path d="M12 2.5v14M4.5 9.5h15" />
      <path d="M12 16.5c0 2-2 2.4-2 4.5" />
      <path d="M10 18.8l1.6-1.3M10.8 20.6l1.6-1.3" />
    </>
  ),
  // Tihar — diyo (oil lamp) with flame
  tihar: (
    <>
      <path d="M12 3.2c1.7 2.3 2.4 3.4 2.4 4.6a2.4 2.4 0 1 1-4.8 0c0-1.2.7-2.3 2.4-4.6Z" />
      <path d="M5 12h14c0 3.3-3.1 6-7 6s-7-2.7-7-6Z" />
    </>
  ),
  // Teej — five-petal flower
  teej: (
    <>
      <circle cx="12" cy="6.6" r="3.1" />
      <circle cx="17.1" cy="10.3" r="3.1" />
      <circle cx="15.1" cy="16.4" r="3.1" />
      <circle cx="8.9" cy="16.4" r="3.1" />
      <circle cx="6.9" cy="10.3" r="3.1" />
      <circle cx="12" cy="12" r="1.9" />
    </>
  ),
  // Nepali New Year — rising sun over the horizon
  chitrabhan: (
    <>
      <path d="M3.5 17.5h17" />
      <path d="M6.5 17.5a5.5 5.5 0 0 1 11 0" />
      <path d="M12 3.5v2.2M5.4 7.2l1.6 1.6M18.6 7.2l-1.6 1.6" />
    </>
  ),
  // Sonam Lhosar — Himalayan peaks with sun
  'sonam-lhosar': (
    <>
      <path d="M2.5 18.5 8.5 10.5l4 4.5 2.6-3.6 6.4 7.1Z" />
      <circle cx="16.8" cy="5.4" r="2.1" />
    </>
  ),
  // Buddha Jayanti — dharma wheel
  'buddha-jayanti': (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.8" />
      <path d="M12 3.5v5.7M12 14.8v5.7M3.5 12h5.7M14.8 12h5.7M6 6l4 4M14 14l4 4M18 6l-4 4M10 14l-4 4" />
    </>
  ),
  // Maha Shivaratri — trishul
  'maha-shivaratri': (
    <>
      <path d="M12 2.5v19" />
      <path d="M8 4.5v4a4 4 0 0 0 8 0v-4" />
      <path d="M8 4.5 6.5 6.2M16 4.5l1.5 1.7" />
    </>
  ),
  // Chhath — sun over the river
  chhath: (
    <>
      <circle cx="12" cy="8.6" r="4" />
      <path d="M12 2.2v1.5M3.8 8.6h1.6M18.6 8.6h1.6M6.2 3.2l1.1 1.1M17.8 3.2l-1.1 1.1" />
      <path d="M3 15.6c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
      <path d="M3 19.4c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
    </>
  ),
  // Maghe Sankranti — ear of grain
  'maghe-sankranti': (
    <>
      <path d="M12 21.5V8" />
      <path d="M12 8c0-2.2 1.6-3.5 3-4 .3 2.4-1 4-3 4ZM12 8c0-2.2-1.6-3.5-3-4-.3 2.4 1 4 3 4Z" />
      <path d="M12 12.6c0-2.2 1.6-3.5 3-4 .3 2.4-1 4-3 4ZM12 12.6c0-2.2-1.6-3.5-3-4-.3 2.4 1 4 3 4Z" />
      <path d="M12 17.2c0-2.2 1.6-3.5 3-4 .3 2.4-1 4-3 4ZM12 17.2c0-2.2-1.6-3.5-3-4-.3 2.4 1 4 3 4Z" />
    </>
  ),
  // Holi — colour splash
  holi: (
    <>
      <path d="M12 3.2S6.6 9.6 6.6 13.8a5.4 5.4 0 0 0 10.8 0C17.4 9.6 12 3.2 12 3.2Z" />
      <circle cx="9.8" cy="13.2" r="1" />
      <circle cx="14" cy="12.2" r="1" />
      <circle cx="12.1" cy="16.2" r="1" />
    </>
  ),
  // Ram Navami — bow and arrow
  'ram-navami': (
    <>
      <path d="M7 3.5c8 3.6 8 13.4 0 17" />
      <path d="M7 3.5v17" />
      <path d="M4 12h16" />
      <path d="M20 12l-2.2-1.4M20 12l-2.2 1.4" />
      <path d="M5.6 12l1.7-1.2M5.6 12l1.7 1.2" />
    </>
  ),
  // Janai Purnima — sacred thread
  'janai-purnima': (
    <>
      <circle cx="12" cy="8.4" r="3.4" />
      <circle cx="12" cy="15.2" r="3.4" />
      <path d="M12 18.8v2.7" />
      <path d="M10.6 20.6l1.4 1.1 1.4-1.1" />
    </>
  ),
  // Krishna Janmashtami — bansuri (flute)
  'krishna-janmashtami': (
    <>
      <path d="M4 19.5C9 16.4 16 10 20 6.8" />
      <circle cx="8.4" cy="15.9" r=".95" />
      <circle cx="12" cy="12.9" r=".95" />
      <circle cx="15.6" cy="9.9" r=".95" />
      <path d="M18.8 6.6l2 1.2M19.6 5.3l1.4 2.2" />
    </>
  ),
  // Gaura Parva — circle dance
  'gaura-parva': (
    <>
      <circle cx="12" cy="12" r="7.4" strokeDasharray="1.4 3.4" />
      <circle cx="12" cy="12" r="2.1" />
    </>
  ),
  // Gai Jatra — cow head
  'gai-jatra': (
    <>
      <path d="M6.5 7C4.4 5.4 4.2 3 6.2 2.6c1.7-.3 2.7 1 2.9 2.9" />
      <path d="M17.5 7c2.1-1.6 2.3-4 .3-4.4-1.7-.3-2.7 1-2.9 2.9" />
      <path d="M9.1 6.4c0 6.4 5.8 6.4 5.8 0" />
      <circle cx="10.6" cy="8" r=".7" />
      <circle cx="13.4" cy="8" r=".7" />
      <path d="M10.6 11c.5.9 2.3.9 2.8 0" />
    </>
  ),
  // Indra Jatra — festival chariot
  'indra-jatra': (
    <>
      <rect x="5" y="6" width="14" height="6" rx="1.2" />
      <path d="M8.3 12v3.2M15.7 12v3.2" />
      <circle cx="8.3" cy="17.6" r="2.4" />
      <circle cx="15.7" cy="17.6" r="2.4" />
      <path d="M12 6V2.6" />
    </>
  ),
  // Bisket Jatra — lingo pole with banners
  'bisket-jatra': (
    <>
      <path d="M12 2.6v18.9" />
      <path d="M12 4.2 6 6.6l6 2.4ZM12 4.2l6 2.4-6 2.4Z" />
      <path d="M8 21.5h8" />
      <path d="M9.6 21.5l2.4-1.6 2.4 1.6" />
    </>
  ),
  // Tamu Lhosar — madal drum
  'tamu-lhosar': (
    <>
      <path d="M7 4.6c-2.6 2.9-2.6 11.9 0 14.8" />
      <path d="M17 4.6c2.6 2.9 2.6 11.9 0 14.8" />
      <path d="M7 4.6c3.1 1.9 6.9 1.9 10 0" />
      <path d="M7 19.4c3.1-1.9 6.9-1.9 10 0" />
      <path d="M7.6 8.2c2.9 1.2 6 1.2 8.8 0" />
      <path d="M7.6 15.8c2.9-1.2 6-1.2 8.8 0" />
    </>
  ),
  // Gyalpo Lhosar — prayer flags
  'gyalpo-lhosar': (
    <>
      <path d="M2.5 5.5Q12 11 21.5 5.5" />
      <path d="M7 7.4v4.2l2.5-2.1Z" />
      <path d="M11.5 8.3v4.6l2.6-2.3Z" />
      <path d="M16 7.4v4.2l2.5-2.1Z" />
    </>
  ),
  // Yomari Punhi — yomari dumpling
  'yomari-punhi': (
    <>
      <path d="M12 2.8c2.4 4 5.9 6.8 5.9 11.2a5.9 5.9 0 0 1-11.8 0C6.1 9.6 9.6 6.8 12 2.8Z" />
      <path d="M12 2.8 10.2 5M12 2.8 13.8 5" />
      <path d="M9.2 13.4c1.6-1 4-1 5.6 0" />
    </>
  ),
  // Christmas — star
  christmas: (
    <path d="M12 2.6l2.5 6.6 6.9.2-5.5 4.2 1.9 6.6L12 16.4l-5.8 3.8 1.9-6.6L2.6 9.4l6.9-.2Z" />
  ),
  // Eid — crescent and star
  eid: (
    <>
      <path d="M15.6 4.4a8 8 0 1 0 0 15.2 6.2 6.2 0 1 1 0-15.2Z" />
      <path d="M18 7l.6 1.6 1.7.1-1.4 1.1.5 1.7L18 10.5l-1.4 1 .5-1.7-1.4-1.1 1.7-.1Z" />
    </>
  ),
  // Udhauli / Ubhauli — sprouting season
  'udhauli-ubhauli': (
    <>
      <path d="M12 21.5V9" />
      <path d="M12 12c-3.2 0-5.4-2.1-5.4-5.4 3.2 0 5.4 2.1 5.4 5.4Z" />
      <path d="M12 14.6c3.2 0 5.4-2.1 5.4-5.4-3.2 0-5.4 2.1-5.4 5.4Z" />
    </>
  ),
  // Fallback — a record spinning with a music note
  __default: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M15.4 3.5v6.2" />
      <circle cx="13.9" cy="9.7" r="1.5" />
    </>
  ),
};

export const FestivalGlyph: React.FC<FestivalGlyphProps> = ({
  slug,
  className = '',
  strokeWidth = 1.5,
}) => {
  const art = (slug && ART[slug]) || ART.__default;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {art}
    </svg>
  );
};

export default FestivalGlyph;
