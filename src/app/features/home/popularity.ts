import type { MovieSummary } from '../../core/models/tmdb.models';

export type PopularityTier = 'blazing' | 'trending' | 'wellKnown' | 'lowkey';

/**
 * TMDB's `popularity` is an unbounded, opaque float — a raw "312.4" tells a
 * viewer nothing. Bucketing it into named tiers is the same move the reference
 * design makes, and it degrades gracefully as TMDB rescales the metric.
 *
 * `blazing` is the exception: it isn't a popularity band at all but "the newest
 * thing here", which is a different and more useful claim than a big number.
 */
export function popularityTier(
  popularity: number | undefined,
  isNewestRelease = false,
): PopularityTier {
  if (isNewestRelease) return 'blazing';

  const value = popularity ?? 0;
  if (value >= 200) return 'trending';
  if (value >= 40) return 'wellKnown';
  return 'lowkey';
}

/**
 * Id of the most recently released movie in the set, or null if none carry a
 * usable date.
 *
 * Ties resolve to the first seen, which keeps the badge stable across renders
 * rather than flickering between same-day releases.
 */
export function newestReleaseId(
  movies: readonly Pick<MovieSummary, 'id' | 'release_date'>[],
): number | null {
  let bestId: number | null = null;
  let bestDate = '';

  for (const movie of movies) {
    const date = movie.release_date;
    // ISO dates sort lexicographically, so no parsing is needed.
    if (!date || date <= bestDate) continue;
    bestDate = date;
    bestId = movie.id;
  }
  return bestId;
}

/** Vote average rounded to one decimal, or null when nobody has voted. */
export function scoreLabel(movie: Pick<MovieSummary, 'vote_average' | 'vote_count'>) {
  if (!movie.vote_count || !movie.vote_average) return null;
  return movie.vote_average.toFixed(1);
}
