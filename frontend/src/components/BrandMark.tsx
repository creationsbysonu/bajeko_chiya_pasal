import React from 'react';

interface BrandMarkProps {
  size?: number;
  className?: string;
}

/**
 * Purano Dhun brand mark — a chiya glass (kulhad) glowing inside a vinyl
 * record, the round shape doubling as a radio dial. The glass is the warm
 * memory; the record is the music. One component drives the nav, footer,
 * manifest and favicon artwork so branding never drifts again.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 96 96"
    fill="none"
    role="img"
    aria-label="Purano Dhun — पुरानो धुन"
    className={className}
  >
    <defs>
      <radialGradient id="pd-disc" cx="50%" cy="38%" r="72%">
        <stop offset="0%" stopColor="#2B2521" />
        <stop offset="70%" stopColor="#1A1613" />
        <stop offset="100%" stopColor="#100D0B" />
      </radialGradient>
      <linearGradient id="pd-chai" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E8B04B" />
        <stop offset="55%" stopColor="#C77E2C" />
        <stop offset="100%" stopColor="#8A4E16" />
      </linearGradient>
      <linearGradient id="pd-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E3C078" />
        <stop offset="55%" stopColor="#C7A66A" />
        <stop offset="100%" stopColor="#8A6B3A" />
      </linearGradient>
    </defs>

    {/* Vinyl record body */}
    <circle cx="48" cy="48" r="45" fill="url(#pd-disc)" />
    <circle cx="48" cy="48" r="45" stroke="url(#pd-ring)" strokeWidth="3" />
    {/* Grooves */}
    <circle cx="48" cy="48" r="37.5" stroke="#C7A66A" strokeOpacity="0.16" strokeWidth="1" />
    <circle cx="48" cy="48" r="31" stroke="#C7A66A" strokeOpacity="0.12" strokeWidth="1" />
    <circle cx="48" cy="48" r="24.5" stroke="#C7A66A" strokeOpacity="0.16" strokeWidth="1" />

    {/* Label ring */}
    <circle cx="48" cy="50" r="17.5" fill="#241E18" stroke="url(#pd-ring)" strokeWidth="1.6" />

    {/* Chiya kulhad glass */}
    <path
      d="M38.5 41.5h19l-2.3 14.6a5.2 5.2 0 0 1-5.2 4.5h-4a5.2 5.2 0 0 1-5.2-4.5l-2.3-14.6Z"
      fill="url(#pd-chai)"
    />
    {/* Froth / malai top */}
    <ellipse cx="48" cy="41.5" rx="9.5" ry="3.1" fill="#F4E3C2" />
    <ellipse cx="48" cy="41.2" rx="6.4" ry="1.9" fill="#FFF7E6" />
    {/* Glass highlight */}
    <path d="M41.6 44.5l-1.2 8.4a3.4 3.4 0 0 0 3 3.8" stroke="#F6DCAB" strokeOpacity="0.65" strokeWidth="1.6" strokeLinecap="round" />

    {/* Steam — twin memory wisps above the chai */}
    <path
      d="M44.5 34.5c-2-2.6 2-4.4 0-7M51.5 34.5c-2-2.6 2-4.4 0-7"
      stroke="#E8B04B"
      strokeOpacity="0.9"
      strokeWidth="1.8"
      strokeLinecap="round"
    />

    {/* Spindle dot */}
    <circle cx="48" cy="66.5" r="2.1" fill="url(#pd-ring)" />
  </svg>
);
