import {
  assignTiers,
  attentionRanks,
  newestReleaseId,
  resolveTier,
  tierLabelKey,
  type TierSignals,
} from './popularity';
import type { MovieSummary } from '../../core/models/tmdb.models';

const signals = (over: Partial<TierSignals> = {}): TierSignals => ({
  attention: 0.5,
  voteAverage: 6.5,
  voteCount: 100,
  isNewestRelease: false,
  ...over,
});

describe('resolveTier', () => {
  it('puts recency above everything else', () => {
    const tier = resolveTier(
      signals({ isNewestRelease: true, attention: 0, voteAverage: 9, voteCount: 5000 }),
    );
    expect(tier).toBe('blazing');
  });

  it('names a well-reviewed film with enough votes acclaimed', () => {
    expect(resolveTier(signals({ voteAverage: 7.8, voteCount: 400 }))).toBe('acclaimed');
  });

  /** A great score off twelve votes says nothing, so volume gates it. */
  it('does not call a thinly-voted film acclaimed', () => {
    expect(resolveTier(signals({ voteAverage: 9.2, voteCount: 12 }))).not.toBe(
      'acclaimed',
    );
  });

  it('names a poorly-scored film with many votes divisive', () => {
    expect(resolveTier(signals({ voteAverage: 5.1, voteCount: 900 }))).toBe('divisive');
  });

  /**
   * An unrated film reports 0.0, which would otherwise look like unanimous
   * dislike rather than absent data.
   */
  it('does not read an unrated film as divisive', () => {
    expect(resolveTier(signals({ voteAverage: 0, voteCount: 900 }))).not.toBe(
      'divisive',
    );
  });

  it('names a liked but quiet film a hidden gem', () => {
    expect(
      resolveTier(signals({ attention: 0.2, voteAverage: 7.1, voteCount: 120 })),
    ).toBe('hiddenGem');
  });

  it('does not call a quiet, poorly-liked film a gem', () => {
    expect(
      resolveTier(signals({ attention: 0.2, voteAverage: 5.5, voteCount: 120 })),
    ).toBe('lowkey');
  });

  it('grades the remainder by attention', () => {
    const base = { voteAverage: 6.5, voteCount: 100 };
    expect(resolveTier(signals({ ...base, attention: 0.9 }))).toBe('trending');
    expect(resolveTier(signals({ ...base, attention: 0.5 }))).toBe('wellKnown');
    expect(resolveTier(signals({ ...base, attention: 0.1 }))).toBe('lowkey');
  });
});

describe('attentionRanks', () => {
  it('spreads a batch across the full range', () => {
    const ranks = attentionRanks([
      { id: 1, popularity: 10 },
      { id: 2, popularity: 500 },
      { id: 3, popularity: 250 },
    ]);

    expect(ranks.get(1)).toBe(0);
    expect(ranks.get(3)).toBeCloseTo(0.5);
    expect(ranks.get(2)).toBe(1);
  });

  /**
   * The reason this is relative at all: a batch of current releases all score
   * high on TMDB's absolute scale, so fixed cutoffs give every film one label.
   */
  it('still spreads when every value is high and close together', () => {
    const ranks = attentionRanks([
      { id: 1, popularity: 980 },
      { id: 2, popularity: 1010 },
      { id: 3, popularity: 995 },
    ]);

    expect(new Set(ranks.values()).size).toBe(3);
    expect(Math.min(...ranks.values())).toBe(0);
    expect(Math.max(...ranks.values())).toBe(1);
  });

  it('treats a lone movie as the top of its own batch', () => {
    expect(attentionRanks([{ id: 7, popularity: 3 }]).get(7)).toBe(1);
  });

  it('handles an empty batch and missing popularity', () => {
    expect(attentionRanks([]).size).toBe(0);
    const ranks = attentionRanks([
      { id: 1, popularity: undefined as unknown as number },
      { id: 2, popularity: 5 },
    ]);
    expect(ranks.get(1)).toBe(0);
  });
});

describe('newestReleaseId', () => {
  it('picks the latest date', () => {
    const id = newestReleaseId([
      { id: 1, release_date: '2026-01-05' },
      { id: 2, release_date: '2026-03-20' },
      { id: 3, release_date: '2025-12-31' },
    ]);
    expect(id).toBe(2);
  });

  /** Stability matters — a flickering badge would be worse than none. */
  it('keeps the first of equal dates', () => {
    const id = newestReleaseId([
      { id: 7, release_date: '2026-03-20' },
      { id: 8, release_date: '2026-03-20' },
    ]);
    expect(id).toBe(7);
  });

  it('ignores entries with no date', () => {
    expect(
      newestReleaseId([
        { id: 1, release_date: '' },
        { id: 2, release_date: '2020-01-01' },
      ]),
    ).toBe(2);
  });

  it('is null when nothing has a date', () => {
    expect(newestReleaseId([{ id: 1, release_date: '' }])).toBeNull();
    expect(newestReleaseId([])).toBeNull();
  });
});

describe('assignTiers', () => {
  const movie = (over: Partial<MovieSummary>): MovieSummary =>
    ({
      id: 0,
      title: 'x',
      original_title: 'x',
      overview: '',
      poster_path: null,
      backdrop_path: null,
      release_date: '2026-01-01',
      vote_average: 6.5,
      vote_count: 100,
      popularity: 100,
      ...over,
    }) as MovieSummary;

  it('covers every movie in the batch', () => {
    const tiers = assignTiers([
      movie({ id: 1, popularity: 10 }),
      movie({ id: 2, popularity: 900 }),
    ]);
    expect(tiers.size).toBe(2);
  });

  /** The whole point of the rework: a realistic batch yields varied labels. */
  it('produces more than one status for a plausible batch', () => {
    const tiers = assignTiers([
      movie({ id: 1, popularity: 1200, release_date: '2026-07-20' }),
      movie({ id: 2, popularity: 900, vote_average: 7.9, vote_count: 800 }),
      movie({ id: 3, popularity: 600, vote_average: 5.2, vote_count: 500 }),
      movie({ id: 4, popularity: 300, vote_average: 7.2, vote_count: 90 }),
      movie({ id: 5, popularity: 120, vote_average: 5.9, vote_count: 20 }),
      movie({ id: 6, popularity: 80, vote_average: 6.4, vote_count: 60 }),
    ]);

    expect(new Set(tiers.values()).size).toBeGreaterThanOrEqual(4);
  });

  it('is empty for an empty batch', () => {
    expect(assignTiers([]).size).toBe(0);
  });
});

describe('tierLabelKey', () => {
  it('maps a tier onto its translation key', () => {
    expect(tierLabelKey('hiddenGem')).toBe('home.tier.hiddenGem');
  });
});
