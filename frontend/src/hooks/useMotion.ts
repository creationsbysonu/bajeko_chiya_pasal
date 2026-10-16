import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../utils/motion';

/** 0 → 1 document scroll position, rAF-throttled. */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const next = max > 0 ? window.scrollY / max : 0;
      setProgress(next < 0 ? 0 : next > 1 ? 1 : next);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return progress;
}

/**
 * Scroll-linked parallax for a single element, written to the `--py` custom
 * property consumed by `.pd-parallax`. Negative strength moves the layer
 * opposite to the scroll for depth. Disabled under reduced motion.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(strength = 0.14) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof window === 'undefined') return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      // -0.5 … 0.5, where 0 means the element is centred in the viewport.
      const offset = (rect.top + rect.height / 2 - viewport / 2) / viewport;
      const shift = -offset * strength * Math.min(rect.height, viewport);
      el.style.setProperty('--py', `${shift.toFixed(2)}px`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [strength]);

  return ref;
}