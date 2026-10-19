import React from 'react';
import { navigate } from '../utils/seo';

interface AppLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

/**
 * A real `<a href>` that keeps SPA behaviour for plain left-clicks.
 *
 * Crawlers get the URL (unlike a `<button>`), while modified clicks still open a
 * new tab because the handler bails out for meta/ctrl/shift/alt and non-primary
 * buttons. External and hash links are never intercepted.
 */
export const AppLink: React.FC<AppLinkProps> = ({ href, onClick, ...rest }) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== 0) return;
    if (!href.startsWith('/') || href.startsWith('//')) return;
    event.preventDefault();
    navigate(href);
  };

  return <a href={href} onClick={handleClick} {...rest} />;
};
