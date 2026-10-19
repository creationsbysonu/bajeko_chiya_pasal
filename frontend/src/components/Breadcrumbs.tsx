import React from 'react';
import { ChevronRight } from 'lucide-react';
import { AppLink } from './AppLink';

export interface Crumb {
  name: string;
  path: string;
}

/**
 * Visible breadcrumb trail. Every page that emits BreadcrumbList JSON-LD
 * renders this component with the same items, so the markup and the structured
 * data can never disagree (which is what Google checks).
 */
export const Breadcrumbs: React.FC<{ items: Crumb[] }> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-neutral-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.path}-${index}`} className="flex items-center gap-1 min-w-0">
              {isLast ? (
                <span aria-current="page" className="truncate max-w-[16rem] text-neutral-400">
                  {item.name}
                </span>
              ) : (
                <AppLink
                  href={item.path}
                  className="hover:text-red-400 transition-colors whitespace-nowrap"
                >
                  {item.name}
                </AppLink>
              )}
              {!isLast && <ChevronRight className="w-3 h-3 text-neutral-700 flex-shrink-0" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
