import React from 'react';

/**
 * Hand-drawn line illustrations for the tea-shop theme. They use
 * `currentColor` so they tint with the theme (crimson accent in the shop
 * panel) and carry no fills or emoji.
 */

interface GlyphProps {
  className?: string;
}

/**
 * A steaming cup of milk tea. The wisps animate via `.pd-steam` (see
 * index.css); under reduced motion they simply rest still.
 */
export const SteamCup: React.FC<GlyphProps> = ({ className = '' }) => (
  <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true" role="presentation">
    <g
      className="pd-steam"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    >
      <path d="M38 40c-5-5.5 5-8.5 0-14" />
      <path d="M48 37c-5-5.5 5-8.5 0-14" />
      <path d="M58 40c-5-5.5 5-8.5 0-14" />
    </g>

    {/* saucer */}
    <ellipse cx="48" cy="77" rx="32" ry="5.5" stroke="currentColor" strokeWidth="1.8" opacity="0.45" />

    {/* handle */}
    <path
      d="M68 51c10 1 10 15-1 17"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      fill="none"
    />

    {/* cup body + rim */}
    <path
      d="M26 46h44l-5.5 21c-1.4 5.5-31.6 5.5-33 0z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
      fill="none"
    />
    <ellipse cx="48" cy="46" rx="22" ry="4.2" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

/**
 * A thin ornamental rule with a centred diamond and end dots — used to
 * separate the shop header from the counter and the counter from the footer.
 */
export const TeaLeafDivider: React.FC<GlyphProps> = ({ className = '' }) => (
  <svg
    viewBox="0 0 320 24"
    fill="none"
    preserveAspectRatio="none"
    className={className}
    aria-hidden="true"
    role="presentation"
  >
    <path d="M6 12h118" stroke="currentColor" strokeWidth="1" opacity="0.28" />
    <path d="M196 12h118" stroke="currentColor" strokeWidth="1" opacity="0.28" />
    <g transform="translate(160 12)" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.7">
      <path d="M0 -6.5 6.5 0 0 6.5 -6.5 0Z" />
      <circle cx="0" cy="0" r="1.4" fill="currentColor" stroke="none" />
    </g>
    <circle cx="136" cy="12" r="1.5" fill="currentColor" opacity="0.45" />
    <circle cx="184" cy="12" r="1.5" fill="currentColor" opacity="0.45" />
  </svg>
);

/**
 * A faint, slowly rotating dashed ring — a quiet sun/mandala motif that sits
 * behind the shop emblem for depth.
 */
export const BrewRing: React.FC<GlyphProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true" role="presentation">
    <circle
      cx="60"
      cy="60"
      r="52"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="2 8"
      strokeLinecap="round"
    />
    <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
  </svg>
);
