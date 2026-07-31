import type { Paginated, RatedMovie } from '../../core/models/tmdb.models';
import { RATING_MAX, RATING_MIN, snapRating } from './rating';

/**
 * Turning TMDB's rated-movies pages into a lookup, kept as plain functions so the
 * filtering rules are testable without a network.
 */

/**
 * Pages fetched at most.
 *
 * The list is paginated at 20 and a guest session realistically holds a handful, but it
 * has no upper bound — a session used heavily could otherwise cost a request per twenty
 * ratings on every page load.
 */
export const MAX_RATED_PAGES = 5;

/**
 * Builds a movie id to rating lookup from a page of results.
 *
 * Scores are range-checked *before* being snapped, and the order matters. Snapping clamps,
 * so a stored 0 — which TMDB uses for absent, not for a score of zero — would come back as
 * the minimum 0.5 and show half a star on a film nobody rated. Checked first, it is
 * dropped. Only then is a legitimate value like 7.3 rounded to something the control can
 * actually represent.
 */
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

/**
 * Serialises the lookup against the session it belongs to.
 *
 * The session id is stored with it so a swapped session cannot inherit the previous one's
 * scores — those stay on TMDB under the old id and are no longer this session's.
 */
export function serialiseRatings(
  sessionId: string,
  ratings: ReadonlyMap<number, number>,
): string {
  const payload: StoredRatings = { sessionId, entries: [...ratings] };
  return JSON.stringify(payload);
}

/**
 * Reads the stored lookup, but only if it belongs to the session asking.
 *
 * Returns an empty map for anything else, including a mismatched session and hand-edited
 * storage — nothing here is trusted, since it is shared with the visitor's own devtools.
 */
export function readStoredRatings(
  raw: string | null,
  sessionId: string,
): Map<number, number> {
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

/** Folds several pages into one lookup, later pages winning on a repeat. */
export function mergeRatingPages(
  pages: readonly Paginated<RatedMovie>[],
): Map<number, number> {
  const merged = new Map<number, number>();

  for (const page of pages) {
    for (const [id, rating] of toRatingMap(page?.results)) merged.set(id, rating);
  }

  return merged;
}

/**
 * Page numbers still to fetch after the first, bounded.
 *
 * Returns an empty list when one page was the whole story, which is the common case.
 */
export function remainingPages(
  totalPages: number,
  cap = MAX_RATED_PAGES,
): number[] {
  const last = Math.min(Math.max(0, Math.floor(totalPages)), cap);
  if (last <= 1) return [];

  return Array.from({ length: last - 1 }, (_, i) => i + 2);
}
