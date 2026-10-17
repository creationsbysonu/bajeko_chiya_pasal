import React from 'react';

interface BrandMarkProps {
  size?: number;
  className?: string;
  /** Decorative use (e.g. a faint watermark): hides it from assistive tech. */
  decorative?: boolean;
}

/**
 * Bajeko Chiya Pasal brand mark — a steaming glass of milk tea on a saucer,
 * drawn in clean geometry so it stays legible from favicon (16px) up to nav
 * tiles. The warm gold-on-ink palette keeps the nostalgic, heritage feel.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({ size = 28, className = '', decorative = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 96 96"
    fill="none"
    role={decorative ? 'presentation' : 'img'}
    aria-hidden={decorative || undefined}
    aria-label={decorative ? undefined : 'Bajeko Chiya Pasal — बजेको चिया पसल'}
    className={className}
  >
    <defs>
      <linearGradient id="bcp-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F2C879" />
        <stop offset="100%" stopColor="#C77E2C" />
      </linearGradient>
      <radialGradient id="bcp-cup" cx="45%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#3D302A" />
        <stop offset="70%" stopColor="#241B15" />
        <stop offset="100%" stopColor="#140F0C" />
      </radialGradient>
    </defs>

    {/* Rising steam */}
    <g stroke="url(#bcp-gold)" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.55">
      <path d="M37 40c-5-5.5 5-8.5 0-14" />
      <path d="M48 37c-5-5.5 5-8.5 0-14" />
      <path d="M59 40c-5-5.5 5-8.5 0-14" />
    </g>

    {/* Saucer */}
    <ellipse cx="48" cy="76" rx="33" ry="6" fill="#140F0C" stroke="url(#bcp-gold)" strokeWidth="1.6" />
    <path d="M22 74a26 5 0 0 0 52 0" stroke="rgba(232,176,75,0.28)" strokeWidth="1" fill="none" />

    {/* Handle */}
    <path
      d="M69 51c10 1 10 15-1 17"
      fill="none"
      stroke="url(#bcp-gold)"
      strokeWidth="3.4"
      strokeLinecap="round"
    />

    {/* Cup body */}
    <path
      d="M24 46h48l-6 22c-1.6 6-31.6 6-36 0z"
      fill="url(#bcp-cup)"
      stroke="url(#bcp-gold)"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />

    {/* Rim + tea surface */}
    <ellipse cx="48" cy="46" rx="24" ry="4.6" fill="#1A1310" stroke="url(#bcp-gold)" strokeWidth="1.6" />
    <ellipse cx="48" cy="47" rx="19.5" ry="3.1" fill="#C77E2C" opacity="0.4" />
  </svg>
);
