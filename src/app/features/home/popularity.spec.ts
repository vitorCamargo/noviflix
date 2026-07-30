import { newestReleaseId, popularityTier, scoreLabel } from './popularity';

describe('popularityTier', () => {
  it('buckets low values as lowkey', () => {
    expect(popularityTier(0)).toBe('lowkey');
    expect(popularityTier(39.9)).toBe('lowkey');
  });

  it('buckets mid values as well known', () => {
    expect(popularityTier(40)).toBe('wellKnown');
    expect(popularityTier(199)).toBe('wellKnown');
  });

  it('buckets high values as trending', () => {
    expect(popularityTier(200)).toBe('trending');
    expect(popularityTier(5000)).toBe('trending');
  });

  /** TMDB omits the field on some records rather than sending zero. */
  it('treats a missing value as lowkey', () => {
    expect(popularityTier(undefined)).toBe('lowkey');
  });

  it('lets the newest release outrank every popularity band', () => {
    expect(popularityTier(0, true)).toBe('blazing');
    expect(popularityTier(9999, true)).toBe('blazing');
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
    const id = newestReleaseId([
      { id: 1, release_date: '' },
      { id: 2, release_date: '2020-01-01' },
    ]);
    expect(id).toBe(2);
  });

  it('is null when nothing has a date', () => {
    expect(newestReleaseId([{ id: 1, release_date: '' }])).toBeNull();
    expect(newestReleaseId([])).toBeNull();
  });
});

describe('scoreLabel', () => {
  it('renders one decimal place', () => {
    expect(scoreLabel({ vote_average: 7.348, vote_count: 210 })).toBe('7.3');
  });

  it('keeps a trailing zero so widths stay stable', () => {
    expect(scoreLabel({ vote_average: 8, vote_count: 12 })).toBe('8.0');
  });

  it('is null when nobody has voted', () => {
    expect(scoreLabel({ vote_average: 0, vote_count: 0 })).toBeNull();
    expect(scoreLabel({ vote_average: 6.5, vote_count: 0 })).toBeNull();
  });
});
