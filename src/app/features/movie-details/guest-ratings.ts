import type { Paginated, RatedMovie } from '../../core/models/tmdb.models';
import { RATING_MAX, RATING_MIN, snapRating } from './rating';

export const MAX_RATED_PAGES = 5;

export function toRatingMap(
  results: readonly RatedMovie[] | null | undefined,
): Map<number, number> {
  const map = new Map<number, number>();
  if (!results) return map;

  for (const movie of results) {
    if (typeof movie?.id !== 'number' || typeof movie.rating !== 'number') continue;
    if (!Number.isFinite(movie.rating)) continue;
    if (movie.rating < RATING_MIN || movie.rating > RATING_MAX) continue;

    map.set(movie.id, snapRating(movie.rating));
  }

  return map;
}

export const GUEST_RATINGS_KEY = 'noviflix.guestRatings';

interface StoredRatings {
  sessionId: string;
  entries: [number, number][];
}

export function serialiseRatings(sessionId: string, ratings: ReadonlyMap<number, number>): string {
  const payload: StoredRatings = { sessionId, entries: [...ratings] };
  return JSON.stringify(payload);
}

export function readStoredRatings(raw: string | null, sessionId: string): Map<number, number> {
  const empty = new Map<number, number>();
  if (!raw || !sessionId) return empty;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return empty;

    const { sessionId: storedFor, entries } = parsed as Partial<StoredRatings>;
    if (storedFor !== sessionId || !Array.isArray(entries)) return empty;

    const map = new Map<number, number>();
    for (const entry of entries) {
      if (!Array.isArray(entry) || entry.length !== 2) continue;

      const [id, rating] = entry;
      if (typeof id !== 'number' || typeof rating !== 'number') continue;
      if (rating < RATING_MIN || rating > RATING_MAX) continue;

      map.set(id, snapRating(rating));
    }
    return map;
  } catch {
    return empty;
  }
}

export function mergeRatingPages(pages: readonly Paginated<RatedMovie>[]): Map<number, number> {
  const merged = new Map<number, number>();

  for (const page of pages) {
    for (const [id, rating] of toRatingMap(page?.results)) merged.set(id, rating);
  }

  return merged;
}

export function remainingPages(totalPages: number, cap = MAX_RATED_PAGES): number[] {
  const last = Math.min(Math.max(0, Math.floor(totalPages)), cap);
  if (last <= 1) return [];

  return Array.from({ length: last - 1 }, (_, i) => i + 2);
}
