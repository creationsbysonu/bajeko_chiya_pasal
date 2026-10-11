import { Genre } from '../types';

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

export function sortGenresByCategory(genres: Genre[]): Genre[] {
  return [...genres].sort((left, right) => {
    const leftIndex = GENRE_CATEGORY_ORDER.indexOf(left.category as typeof GENRE_CATEGORY_ORDER[number]);
    const rightIndex = GENRE_CATEGORY_ORDER.indexOf(right.category as typeof GENRE_CATEGORY_ORDER[number]);

    const normalizedLeftIndex = leftIndex === -1 ? GENRE_CATEGORY_ORDER.length : leftIndex;
    const normalizedRightIndex = rightIndex === -1 ? GENRE_CATEGORY_ORDER.length : rightIndex;

    if (normalizedLeftIndex !== normalizedRightIndex) {
      return normalizedLeftIndex - normalizedRightIndex;
    }

    return left.name.localeCompare(right.name);
  });
}

export function groupGenresByCategory(genres: Genre[]) {
  const orderedGenres = sortGenresByCategory(genres);

  return GENRE_CATEGORY_ORDER.map((category) => ({
    category,
    label: GENRE_CATEGORY_LABELS[category],
    genres: orderedGenres.filter((genre) => genre.category === category),
  })).filter((group) => group.genres.length > 0);
}