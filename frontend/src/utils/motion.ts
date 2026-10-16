/**
 * Motion helpers shared by the Reveal/Roller components and the parallax hooks.
 *
 * Everything here is deliberately defensive: when IntersectionObserver is
 * missing (jsdom in the test suite, very old browsers) or the visitor has asked
 * for reduced motion, content must render *already visible* rather than
 * animating or — worse — staying hidden.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function supportsIntersectionObserver(): boolean {
  return typeof window !== 'undefined' && typeof window.IntersectionObserver === 'function';
}

/** True when scroll-driven animation should run at all. */
export function motionEnabled(): boolean {
  return supportsIntersectionObserver() && !prefersReducedMotion();
}

/** Locomotive-style easings, exposed for inline transitions. */
export const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

export type RevealVariant = 'up' | 'down' | 'left' | 'right' | 'fade' | 'zoom';

const VARIANTS: Record<RevealVariant, { x: string; y: string; scale: string; blur: string }> = {
  up: { x: '0px', y: '34px', scale: '1', blur: '5px' },
  down: { x: '0px', y: '-34px', scale: '1', blur: '5px' },
  left: { x: '44px', y: '0px', scale: '1', blur: '4px' },
  right: { x: '-44px', y: '0px', scale: '1', blur: '4px' },
  fade: { x: '0px', y: '0px', scale: '1', blur: '8px' },
  zoom: { x: '0px', y: '18px', scale: '0.94', blur: '3px' },
};

export function variantVars(variant: RevealVariant): Record<string, string> {
  const v = VARIANTS[variant] ?? VARIANTS.up;
  return {
    '--reveal-x': v.x,
    '--reveal-y': v.y,
    '--reveal-scale': v.scale,
    '--reveal-blur': v.blur,
  };
}