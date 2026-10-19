import { useEffect } from 'react';
import { applySeoMeta, type SeoMeta } from '../utils/seo';

/**
 * Apply route-specific metadata once the page has the data it needs.
 *
 * Entity pages (song / artist / station / genre…) cannot know their title or
 * description until the catalog answers, so `App` applies the generic tab
 * metadata first and the page upgrades it when the entity resolves. Passing
 * `null` leaves the tab-level tags untouched (loading / not-found states).
 */
export function usePageSeo(meta: SeoMeta | null): void {
  useEffect(() => {
    if (meta) applySeoMeta(meta);
  }, [meta]);
}
