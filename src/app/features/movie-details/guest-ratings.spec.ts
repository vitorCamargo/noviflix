import type { Paginated, RatedMovie } from '../../core/models/tmdb.models';
import {
  MAX_RATED_PAGES,
  mergeRatingPages,
  readStoredRatings,
  remainingPages,
  serialiseRatings,
  toRatingMap,
} from './guest-ratings';

function rated(id: number, rating: number): RatedMovie {
  return { id, rating } as RatedMovie;
}

function page(results: RatedMovie[], totalPages = 1): Paginated<RatedMovie> {
  return { page: 1, results, total_pages: totalPages, total_results: results.length };
}

describe('toRatingMap', () => {
  it('maps each film to the score this session gave it', () => {
    const map = toRatingMap([rated(1, 7), rated(2, 9.5)]);

    expect(map.get(1)).toBe(7);
    expect(map.get(2)).toBe(9.5);
  });

  it('is empty for nothing rated', () => {
    expect(toRatingMap([]).size).toBe(0);
    expect(toRatingMap(null).size).toBe(0);
    expect(toRatingMap(undefined).size).toBe(0);
  });

  it('snaps a score to the nearest half step', () => {
    expect(toRatingMap([rated(1, 7.3)]).get(1)).toBe(7.5);
  });

  it('drops scores outside the range the API accepts', () => {
    const map = toRatingMap([rated(1, 0), rated(2, 11), rated(3, -4)]);
    expect(map.size).toBe(0);
  });

  it('ignores records missing an id or a score', () => {
    const map = toRatingMap([{ rating: 7 } as RatedMovie, { id: 2 } as RatedMovie, rated(3, 8)]);

    expect([...map.keys()]).toEqual([3]);
  });
});

describe('mergeRatingPages', () => {
  it('folds several pages into one lookup', () => {
    const merged = mergeRatingPages([page([rated(1, 7)]), page([rated(2, 8)])]);

    expect(merged.size).toBe(2);
    expect(merged.get(2)).toBe(8);
  });

  it('lets a later page win a repeat', () => {
    const merged = mergeRatingPages([page([rated(1, 7)]), page([rated(1, 9)])]);

    expect(merged.size).toBe(1);
    expect(merged.get(1)).toBe(9);
  });

  it('survives an empty or malformed page', () => {
    const merged = mergeRatingPages([
      page([]),
      { results: undefined } as unknown as Paginated<RatedMovie>,
      page([rated(1, 6)]),
    ]);

    expect(merged.get(1)).toBe(6);
  });
});

describe('serialiseRatings / readStoredRatings', () => {
  const map = new Map([
    [1, 7],
    [2, 9.5],
  ]);

  it('round-trips a lookup for its own session', () => {
    const raw = serialiseRatings('sess-a', map);
    expect(readStoredRatings(raw, 'sess-a')).toEqual(map);
  });

  it('refuses a lookup belonging to a different session', () => {
    const raw = serialiseRatings('sess-a', map);
    expect(readStoredRatings(raw, 'sess-b').size).toBe(0);
  });

  it('is empty with nothing stored or no session', () => {
    expect(readStoredRatings(null, 'sess-a').size).toBe(0);
    expect(readStoredRatings(serialiseRatings('sess-a', map), '').size).toBe(0);
  });

  it('treats malformed storage as absent rather than throwing', () => {
    expect(readStoredRatings('not json', 'sess-a').size).toBe(0);
    expect(readStoredRatings('null', 'sess-a').size).toBe(0);
    expect(readStoredRatings('{"sessionId":"sess-a"}', 'sess-a').size).toBe(0);
  });

  it('drops entries that are not a pair of numbers in range', () => {
    const raw = JSON.stringify({
      sessionId: 'sess-a',
      entries: [[1, 7], ['2', 8], [3], [4, 99], [5, 0], [6, 8]],
    });

    expect([...readStoredRatings(raw, 'sess-a').keys()]).toEqual([1, 6]);
  });

  it('snaps a stored score that drifted off the half step', () => {
    const raw = JSON.stringify({ sessionId: 'sess-a', entries: [[1, 7.3]] });
    expect(readStoredRatings(raw, 'sess-a').get(1)).toBe(7.5);
  });
});

describe('remainingPages', () => {
  it('asks for nothing more when one page was the whole list', () => {
    expect(remainingPages(1)).toEqual([]);
    expect(remainingPages(0)).toEqual([]);
  });

  it('lists the pages after the first', () => {
    expect(remainingPages(3)).toEqual([2, 3]);
  });

  it('stops at the cap', () => {
    expect(remainingPages(500)).toHaveLength(MAX_RATED_PAGES - 1);
    expect(remainingPages(500).at(-1)).toBe(MAX_RATED_PAGES);
  });

  it('ignores a nonsensical total', () => {
    expect(remainingPages(-3)).toEqual([]);
    expect(remainingPages(2.7)).toEqual([2]);
  });
});
