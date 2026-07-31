import type { MovieSummary } from '../../core/models/tmdb.models';

/**
 * Status a movie carries on the home card.
 *
 * These aren't bands on a single axis. Popularity alone produces one label for
 * everything in a batch of current releases, because TMDB scores them all
 * similarly high. So the tiers read three independent signals:
 *
 *  - recency    → how new it is
 *  - attention  → how much of the batch's popularity it commands
 *  - reception  → what its score says, given enough votes to mean anything
 *
 * Crossing those gives labels that describe genuinely different situations: a
 * quiet film people love is not the same as a loud film people dislike, and
 * neither is "less popular".
 */
export type PopularityTier =
  | 'blazing'
  | 'trending'
  | 'acclaimed'
  | 'hiddenGem'
  | 'wellKnown'
  | 'divisive'
  | 'lowkey';

/** Enough votes for a score to be worth reading at all. */
const ACCLAIM_VOTES = 300;
const ACCLAIM_SCORE = 7.5;

const DIVISIVE_VOTES = 150;
const DIVISIVE_SCORE = 6;

/** A gem is well-liked but has not broken through. */
const GEM_ATTENTION = 0.4;
const GEM_SCORE = 6.8;
const GEM_VOTES = 40;

const TRENDING_ATTENTION = 0.75;
const KNOWN_ATTENTION = 0.35;

export interface TierSignals {
  /** Position within the batch's popularity range: 0 = quietest, 1 = loudest. */
  attention: number;
  voteAverage: number;
  voteCount: number;
  isNewestRelease: boolean;
}

/**
 * First match wins, and the order encodes what the design considers most worth
 * saying: that something just landed beats how loud it is, and what people
 * think of it beats both.
 */
export function resolveTier(signals: TierSignals): PopularityTier {
  const { attention, voteAverage, voteCount, isNewestRelease } = signals;

  if (isNewestRelease) return 'blazing';

  if (voteCount >= ACCLAIM_VOTES && voteAverage >= ACCLAIM_SCORE) {
    return 'acclaimed';
  }

  // Guard on a non-zero score: an unrated film reads as 0.0, which would
  // otherwise look like unanimous dislike.
  if (voteCount >= DIVISIVE_VOTES && voteAverage > 0 && voteAverage < DIVISIVE_SCORE) {
    return 'divisive';
  }

  if (
    attention <= GEM_ATTENTION &&
    voteAverage >= GEM_SCORE &&
    voteCount >= GEM_VOTES
  ) {
    return 'hiddenGem';
  }

  if (attention >= TRENDING_ATTENTION) return 'trending';
  if (attention >= KNOWN_ATTENTION) return 'wellKnown';
  return 'lowkey';
}

/**
 * Attention as a rank within the batch rather than an absolute cutoff.
 *
 * TMDB's popularity is unbounded and rescaled over time, so any fixed threshold
 * drifts out of usefulness — and for a set of films all in cinemas at once, they
 * land on the same side of it. Ranking within what's on offer always spreads.
 */
export function attentionRanks(
  movies: readonly Pick<MovieSummary, 'id' | 'popularity'>[],
): Map<number, number> {
  const ranks = new Map<number, number>();
  if (movies.length === 0) return ranks;

  if (movies.length === 1) {
    ranks.set(movies[0].id, 1);
    return ranks;
  }

  const ordered = [...movies].sort(
    (a, b) => (a.popularity ?? 0) - (b.popularity ?? 0),
  );

  ordered.forEach((movie, index) => {
    ranks.set(movie.id, index / (ordered.length - 1));
  });
  return ranks;
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

/** Tier for every movie in a batch, keyed by id. */
export function assignTiers(
  movies: readonly MovieSummary[],
): Map<number, PopularityTier> {
  const ranks = attentionRanks(movies);
  const newest = newestReleaseId(movies);
  const tiers = new Map<number, PopularityTier>();

  for (const movie of movies) {
    tiers.set(
      movie.id,
      resolveTier({
        attention: ranks.get(movie.id) ?? 0,
        voteAverage: movie.vote_average ?? 0,
        voteCount: movie.vote_count ?? 0,
        isNewestRelease: movie.id === newest,
      }),
    );
  }
  return tiers;
}

/** Translation key for a tier's label. */
export function tierLabelKey(tier: PopularityTier) {
  return `home.tier.${tier}` as const;
}
