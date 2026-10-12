import { Genre, GenreCategory } from '../types';

// Fallback order/labels used before the server's dynamic registry loads, and for
// any legacy category slug that no longer exists in the registry.
export const GENRE_CATEGORY_ORDER = [
  'classical_traditional',
  'folk',
  'popular',
  'regional',
  'special',
] as const;

export const GENRE_CATEGORY_LABELS: Record<string, string> = {
  classical_traditional: 'Classical & Traditional',
  folk: 'Folk & Lok Dohori',
  popular: 'Popular & Contemporary',
  regional: 'Regional & Indigenous',
  special: 'Festive & Seasonal',
};

export interface ResolvedCategory {
  slug: string;
  label: string;
  display_order: number;
}

/**
 * Build the category ordering/labels from the live registry, falling back to
 * the shipped defaults for any category the server hasn't sent (or that was
 * created dynamically but isn't yet loaded).
 */
export function resolveCategories(categories: GenreCategory[] = []): ResolvedCategory[] {
  const bySlug = new Map(categories.map((category) => [category.slug, category]));

  const resolved = categories.map((category) => ({
    slug: category.slug,
    label: category.name,
    display_order: category.display_order,
  }));

  // Keep any known default that is somehow missing from the registry payload.
  GENRE_CATEGORY_ORDER.forEach((slug, index) => {
    if (!bySlug.has(slug)) {
      resolved.push({
        slug,
        label: GENRE_CATEGORY_LABELS[slug],
        display_order: index + 1,
      });
    }
  });

  return resolved.sort((a, b) => a.display_order - b.display_order || a.label.localeCompare(b.label));
}

export function categoryLabel(slug: string, categories: GenreCategory[] = []): string {
  const fromServer = categories.find((category) => category.slug === slug);
  if (fromServer) return fromServer.name;
  return GENRE_CATEGORY_LABELS[slug] ?? slug;
}

export function sortGenresByCategory(genres: Genre[], categories: GenreCategory[] = []): Genre[] {
  const order = resolveCategories(categories).map((category) => category.slug);

  return [...genres].sort((left, right) => {
    const leftIndex = order.indexOf(left.category);
    const rightIndex = order.indexOf(right.category);

    const normalizedLeftIndex = leftIndex === -1 ? order.length : leftIndex;
    const normalizedRightIndex = rightIndex === -1 ? order.length : rightIndex;

    if (normalizedLeftIndex !== normalizedRightIndex) {
      return normalizedLeftIndex - normalizedRightIndex;
    }

    return left.name.localeCompare(right.name);
  });
}

export function groupGenresByCategory(genres: Genre[], categories: GenreCategory[] = []) {
  const orderedGenres = sortGenresByCategory(genres, categories);

  return resolveCategories(categories).map((category) => ({
    category: category.slug,
    label: category.label,
    genres: orderedGenres.filter((genre) => genre.category === category.slug),
  })).filter((group) => group.genres.length > 0);
}
