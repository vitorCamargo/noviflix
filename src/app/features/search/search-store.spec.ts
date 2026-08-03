import type { MovieSummary } from '../../core/models/tmdb.models';
import { mergeUnique } from './search-store';

function movie(id: number, title = `Film ${id}`): MovieSummary {
  return { id, title } as MovieSummary;
}

describe('mergeUnique', () => {
  it('appends a page onto the results already loaded', () => {
    const merged = mergeUnique([movie(1), movie(2)], [movie(3), movie(4)]);
    expect(merged.map((m) => m.id)).toEqual([1, 2, 3, 4]);
  });

  it('drops films already present', () => {
    const merged = mergeUnique([movie(1), movie(2)], [movie(2), movie(3)]);
    expect(merged.map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it('keeps the copy already on screen rather than replacing it', () => {
    const merged = mergeUnique([movie(1, 'First')], [movie(1, 'Second')]);
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe('First');
  });

  it('handles an empty page without disturbing what is loaded', () => {
    expect(mergeUnique([movie(1)], []).map((m) => m.id)).toEqual([1]);
  });

  it('handles a first page onto nothing', () => {
    expect(mergeUnique([], [movie(1), movie(2)]).map((m) => m.id)).toEqual([1, 2]);
  });

  it('does not mutate the array it was given', () => {
    const current = [movie(1)];
    mergeUnique(current, [movie(2)]);
    expect(current).toHaveLength(1);
  });
});
