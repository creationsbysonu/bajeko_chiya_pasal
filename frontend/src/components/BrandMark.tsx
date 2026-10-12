import React from 'react';

interface BrandMarkProps {
  size?: number;
  className?: string;
}

/**
 * Purano Dhun brand mark — a minimal vinyl record with a central
 * play pointer. Clean geometry keeps it legible at favicon (16px)
 * down to nav tiles, while the warm gradient preserves the
 * nostalgic, heritage feel of the platform.
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
      <radialGradient id="pd-disc" cx="38%" cy="35%" r="72%">
        <stop offset="0%" stopColor="#3D302A" />
        <stop offset="65%" stopColor="#2A1F19" />
        <stop offset="100%" stopColor="#140F0C" />
      </radialGradient>
      <linearGradient id="pd-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E8B04B" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#C77E2C" stopOpacity="0.35" />
      </linearGradient>
      <radialGradient id="pd-center" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#3D302A" />
        <stop offset="70%" stopColor="#231B15" />
        <stop offset="100%" stopColor="#140F0C" />
      </radialGradient>
    </defs>

    {/* Record body */}
    <circle cx="48" cy="48" r="44" fill="url(#pd-disc)" />

    {/* Record ring */}
    <circle cx="48" cy="48" r="44" stroke="url(#pd-ring)" strokeWidth="1.8" />

    {/* Grooves — 3 clean lines */}
    <circle cx="48" cy="48" r="36" stroke="rgba(232,176,75,0.14)" strokeWidth="1" />
    <circle cx="48" cy="48" r="30" stroke="rgba(232,176,75,0.14)" strokeWidth="1" />
    <circle cx="48" cy="48" r="23.5" stroke="rgba(232,176,75,0.14)" strokeWidth="1" />

    {/* Center label */}
    <circle cx="48" cy="48" r="16" fill="url(#pd-center)" />

    {/* Center ring (inner label edge) */}
    <circle cx="48" cy="48" r="12.5" stroke="rgba(232,176,75,0.25)" strokeWidth="1.2" />

    {/* Central play pointer */}
    <path
      d="M48 38 L52 48 L48 58 L44 48 Z"
      fill="#E8B04B"
      opacity="0.95"
    />
    {/* Play pointer highlight */}
    <path
      d="M46.5 41 L48 43 L49.5 41"
      fill="none"
      stroke="#FFF3D6"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
);
