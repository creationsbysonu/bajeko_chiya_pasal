import React, { useEffect, useRef, useState } from 'react';
import { motionEnabled, RevealVariant, supportsIntersectionObserver, variantVars } from '../../utils/motion';

type RevealTag = 'div' | 'section' | 'article' | 'header' | 'footer' | 'li' | 'span' | 'aside';

interface RevealProps {
  children: React.ReactNode;
  /** Element to render. Defaults to a block <div>. */
  as?: RevealTag;
  variant?: RevealVariant;
  /** Extra classes appended after the motion classes. */
  className?: string;
  /** Milliseconds to wait before starting, for staggering siblings. */
  delay?: number;
  /** Distance sensitivity for the observer trigger. */
  rootMargin?: string;
  threshold?: number;
  /** Un-reveal again when scrolled back out (default: reveal once). */
  repeat?: boolean;
  /** Masked headline treatment — children slide up from behind a clip. */
  mask?: boolean;
  style?: React.CSSProperties;
  id?: string;
}

/**
 * Scroll-triggered entrance animation.
 *
 * Starts visible when IntersectionObserver is unavailable or the visitor
 * prefers reduced motion, so content is never trapped behind an animation.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  as = 'div',
  variant = 'up',
  className = '',
  delay = 0,
  rootMargin = '0px 0px -8% 0px',
  threshold = 0.12,
  repeat = false,
  mask = false,
  style,
  id,
}) => {
  const animate = motionEnabled();
  const [shown, setShown] = useState(() => !animate);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!animate) return;
    const el = ref.current;
    if (!el || typeof window === 'undefined' || !supportsIntersectionObserver()) return;

    let seen = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          seen = true;
          setShown(true);
          if (!repeat) observer.disconnect();
        } else if (repeat && seen) {
          setShown(false);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animate, repeat, rootMargin, threshold]);

  const classes = [
    className,
    mask ? 'pd-line-mask' : 'pd-reveal',
    shown ? 'is-in' : '',
    // Belt and braces: if motion is disabled we must never sit at opacity 0.
    !animate ? 'is-in' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const inlineVars: Record<string, string> = mask
    ? { '--line-delay': `${delay}ms` }
    : { ...variantVars(variant), '--reveal-delay': `${delay}ms` };

  const Tag = as as React.ElementType;

  return (
    <Tag
      id={id}
      ref={ref as React.Ref<never>}
      className={classes}
      style={{ ...(inlineVars as React.CSSProperties), ...(style || {}) }}
    >
      {children}
    </Tag>
  );
};

export default Reveal;