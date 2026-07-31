import { filterByName } from './collection-filter';

describe('filterByName', () => {
  const items = [
    { name: 'Saturday nights' },
    { name: 'Rewatch pile' },
    { name: 'documentaries' },
  ];

  it('returns everything for an empty query', () => {
    expect(filterByName(items, '')).toEqual(items);
    expect(filterByName(items, '   ')).toEqual(items);
    expect(filterByName(items, null)).toEqual(items);
    expect(filterByName(items, undefined)).toEqual(items);
  });

  /** Matching anywhere, not only at the start: "nights" should find "Saturday nights". */
  it('matches inside the name', () => {
    expect(filterByName(items, 'nights')).toEqual([{ name: 'Saturday nights' }]);
  });

  it('ignores case', () => {
    expect(filterByName(items, 'DOCUMENT')).toEqual([{ name: 'documentaries' }]);
  });

  it('ignores surrounding space in the query', () => {
    expect(filterByName(items, '  pile  ')).toEqual([{ name: 'Rewatch pile' }]);
  });

  it('is empty when nothing matches', () => {
    expect(filterByName(items, 'zzz')).toEqual([]);
  });

  it('handles an empty list', () => {
    expect(filterByName([], 'anything')).toEqual([]);
  });
});
