import type { MovieSummary } from '../../core/models/tmdb.models';

export type PopularityTier =
  'blazing' | 'trending' | 'acclaimed' | 'hiddenGem' | 'wellKnown' | 'divisive' | 'lowkey';

const ACCLAIM_VOTES = 300;
const ACCLAIM_SCORE = 7.5;

const DIVISIVE_VOTES = 150;
const DIVISIVE_SCORE = 6;

const GEM_ATTENTION = 0.4;
const GEM_SCORE = 6.8;
const GEM_VOTES = 40;

const TRENDING_ATTENTION = 0.75;
const KNOWN_ATTENTION = 0.35;

export interface TierSignals {
  attention: number;
  voteAverage: number;
  voteCount: number;
  isNewestRelease: boolean;
}

export function resolveTier(signals: TierSignals): PopularityTier {
  const { attention, voteAverage, voteCount, isNewestRelease } = signals;

  if (isNewestRelease) return 'blazing';

  if (voteCount >= ACCLAIM_VOTES && voteAverage >= ACCLAIM_SCORE) {
    return 'acclaimed';
  }

  if (voteCount >= DIVISIVE_VOTES && voteAverage > 0 && voteAverage < DIVISIVE_SCORE) {
    return 'divisive';
  }

  if (attention <= GEM_ATTENTION && voteAverage >= GEM_SCORE && voteCount >= GEM_VOTES) {
    return 'hiddenGem';
  }

  if (attention >= TRENDING_ATTENTION) return 'trending';
  if (attention >= KNOWN_ATTENTION) return 'wellKnown';
  return 'lowkey';
}

export function attentionRanks(
  movies: readonly Pick<MovieSummary, 'id' | 'popularity'>[],
): Map<number, number> {
  const ranks = new Map<number, number>();
  if (movies.length === 0) return ranks;

  if (movies.length === 1) {
    ranks.set(movies[0].id, 1);
    return ranks;
  }

  const ordered = [...movies].sort((a, b) => (a.popularity ?? 0) - (b.popularity ?? 0));

  ordered.forEach((movie, index) => {
    ranks.set(movie.id, index / (ordered.length - 1));
  });
  return ranks;
}

export function newestReleaseId(
  movies: readonly Pick<MovieSummary, 'id' | 'release_date'>[],
): number | null {
  let bestId: number | null = null;
  let bestDate = '';

  for (const movie of movies) {
    const date = movie.release_date;
    if (!date || date <= bestDate) continue;
    bestDate = date;
    bestId = movie.id;
  }
  return bestId;
}

export function assignTiers(movies: readonly MovieSummary[]): Map<number, PopularityTier> {
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

export function tierLabelKey(tier: PopularityTier) {
  return `home.tier.${tier}` as const;
}
