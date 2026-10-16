import React from 'react';

interface RollerProps {
  /** Content repeated to fill the band. The whole list is duplicated for a seamless loop. */
  items: React.ReactNode[];
  /** Seconds for one full pass. */
  duration?: number;
  reverse?: boolean;
  /** Rendered between items (dot, star, separator glyph…). */
  separator?: React.ReactNode;
  className?: string;
  /** Accessible description announced instead of the moving text. */
  label?: string;
}

/**
 * Infinite horizontal "roller" / marquee band — the Locomotive-style ticker
 * used here for station names, genres and era labels.
 *
 * The duplicate copy is aria-hidden so screen readers only ever read the list
 * once, and the animation pauses on hover for readability.
 */
export const Roller: React.FC<RollerProps> = ({
  items,
  duration = 42,
  reverse = false,
  separator,
  className = '',
  label,
}) => {
  if (items.length === 0) return null;

  const renderGroup = (duplicate: boolean) => (
    <div className="pd-roller__group" aria-hidden={duplicate ? 'true' : undefined}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="pd-roller__item shrink-0">{item}</span>
          {separator !== undefined && (
            <span className="pd-roller__sep shrink-0" aria-hidden="true">
              {separator}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div
      className={`pd-roller ${reverse ? 'pd-roller--rev' : ''} ${className}`.trim()}
      style={{ '--roller-duration': `${duration}s` } as React.CSSProperties}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
    >
      <div className={`pd-roller__track ${reverse ? 'animate-marquee-rev' : 'animate-marquee'}`}>
        {renderGroup(false)}
        {renderGroup(true)}
      </div>
    </div>
  );
};

export default Roller;