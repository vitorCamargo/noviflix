import type { MovieSummary } from '../../core/models/tmdb.models';
import type { UserCollection } from '../../core/models/user-collection.models';
import {
  addMovies,
  countPresent,
  createCollection,
  newCollectionId,
  nextCollectionName,
  readStore,
  removeMovie,
  serialiseStore,
  toSavedMovie,
} from './collection-store';

const NOW = Date.parse('2026-07-31T12:00:00Z');
const LATER = NOW + 60_000;

function movie(id: number, title = `Film ${id}`): MovieSummary {
  return {
    id,
    title,
    poster_path: `/p${id}.jpg`,
    release_date: '2026-01-01',
    vote_average: 7.5,
  } as MovieSummary;
}

function withItems(ids: number[]): UserCollection {
  return ids.reduce(
    (collection, id) => addMovies(collection, [movie(id)], NOW),
    createCollection('Nights', 'Films for later', NOW),
  );
}

describe('newCollectionId', () => {
  it('gives a non-empty id', () => {
    expect(newCollectionId().length).toBeGreaterThan(0);
  });

  it('does not repeat', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newCollectionId()));
    expect(ids.size).toBe(50);
  });
});

describe('nextCollectionName', () => {
  it('starts at one when nothing exists', () => {
    expect(nextCollectionName([], 'Collection')).toBe('Collection 1');
  });

  /** Several called the same thing would be indistinguishable in the picker. */
  it('skips names already taken', () => {
    expect(nextCollectionName(['Collection 1'], 'Collection')).toBe('Collection 2');
    expect(nextCollectionName(['Collection 1', 'Collection 2'], 'Collection')).toBe(
      'Collection 3',
    );
  });

  it('fills a gap rather than always taking the highest', () => {
    expect(nextCollectionName(['Collection 2'], 'Collection')).toBe('Collection 1');
  });

  it('ignores case and surrounding space when comparing', () => {
    expect(nextCollectionName(['  collection 1 '], 'Collection')).toBe('Collection 2');
  });

  it('is unaffected by unrelated names', () => {
    expect(nextCollectionName(['Saturday nights'], 'Collection')).toBe('Collection 1');
  });
});

describe('createCollection', () => {
  it('trims the fields and starts empty', () => {
    const collection = createCollection('  Nights  ', '  For later  ', NOW);

    expect(collection.name).toBe('Nights');
    expect(collection.description).toBe('For later');
    expect(collection.items).toEqual([]);
    expect(collection.createdAt).toBe(collection.updatedAt);
  });
});

describe('toSavedMovie', () => {
  /** A snapshot, so a collection renders without a request per film. */
  it('keeps what the tile needs to draw itself', () => {
    const saved = toSavedMovie(movie(1, 'Dune'), NOW);

    expect(saved).toMatchObject({
      id: 1,
      title: 'Dune',
      posterPath: '/p1.jpg',
      voteAverage: 7.5,
    });
  });

  it('records absent artwork and dates as null rather than empty strings', () => {
    const saved = toSavedMovie(
      { id: 2, title: 'X', poster_path: null, release_date: '' } as MovieSummary,
      NOW,
    );

    expect(saved.posterPath).toBeNull();
    expect(saved.releaseDate).toBeNull();
  });
});

describe('addMovies', () => {
  it('appends films and stamps the change', () => {
    const after = addMovies(withItems([1]), [movie(2)], LATER);

    expect(after.items.map((item) => item.id)).toEqual([1, 2]);
    expect(after.updatedAt).toBe(new Date(LATER).toISOString());
  });

  /**
   * The collection is returned untouched, which keeps updatedAt honest — a list reporting a
   * change every time someone re-adds the same film sorts wrongly and looks busier than it is.
   */
  it('returns the same object when nothing is new', () => {
    const before = withItems([1, 2]);
    const after = addMovies(before, [movie(1), movie(2)], LATER);

    expect(after).toBe(before);
  });

  it('adds only the films not already there', () => {
    const after = addMovies(withItems([1]), [movie(1), movie(2)], LATER);
    expect(after.items.map((item) => item.id)).toEqual([1, 2]);
  });

  /** A loosely built selection can carry the same film twice. */
  it('does not add a duplicate within one call', () => {
    const after = addMovies(withItems([]), [movie(3), movie(3)], LATER);
    expect(after.items).toHaveLength(1);
  });

  it('never mutates the collection it was given', () => {
    const before = withItems([1]);
    addMovies(before, [movie(2)], LATER);

    expect(before.items).toHaveLength(1);
  });
});

describe('removeMovie', () => {
  it('drops the film and stamps the change', () => {
    const after = removeMovie(withItems([1, 2]), 1, LATER);

    expect(after.items.map((item) => item.id)).toEqual([2]);
    expect(after.updatedAt).toBe(new Date(LATER).toISOString());
  });

  it('returns the same object when the film was not there', () => {
    const before = withItems([1]);
    expect(removeMovie(before, 99, LATER)).toBe(before);
  });
});

describe('countPresent', () => {
  it('counts how many of these the collection already holds', () => {
    const collection = withItems([1, 2]);
    expect(countPresent(collection, [movie(1), movie(2), movie(3)])).toBe(2);
    expect(countPresent(collection, [movie(9)])).toBe(0);
  });
});

describe('readStore / serialiseStore', () => {
  it('round-trips collections', () => {
    const collections = [withItems([1, 2])];
    expect(readStore(serialiseStore(collections))).toEqual(collections);
  });

  it('is null with nothing stored', () => {
    expect(readStore(null)).toBeNull();
    expect(readStore('')).toBeNull();
  });

  /**
   * A future format read as this one would either crash or silently drop fields, and losing
   * someone's collections is worse than ignoring a record this build cannot understand.
   */
  it('refuses a version it does not know', () => {
    expect(readStore(JSON.stringify({ version: 2, collections: [] }))).toBeNull();
  });

  it('treats malformed storage as absent rather than throwing', () => {
    expect(readStore('not json')).toBeNull();
    expect(readStore('null')).toBeNull();
    expect(readStore('[]')).toBeNull();
    expect(readStore(JSON.stringify({ version: 1 }))).toBeNull();
  });

  it('drops records without a usable id or name', () => {
    const raw = JSON.stringify({
      version: 1,
      collections: [{ id: '', name: 'x' }, { id: 'a' }, { id: 'b', name: 'Keep' }],
    });

    const parsed = readStore(raw);
    expect(parsed?.map((collection) => collection.id)).toEqual(['b']);
  });

  /** Records from an earlier build may lack fields added since; repairing beats discarding. */
  it('repairs a record missing its items or timestamps', () => {
    const raw = JSON.stringify({
      version: 1,
      collections: [{ id: 'a', name: 'Old' }],
    });

    const [collection] = readStore(raw) ?? [];
    expect(collection.items).toEqual([]);
    expect(collection.description).toBe('');
    expect(collection.updatedAt).toBe(collection.createdAt);
  });

  it('drops items that are not films', () => {
    const raw = JSON.stringify({
      version: 1,
      collections: [
        { id: 'a', name: 'Mixed', items: [{ id: 1, title: 'Keep' }, { id: '2' }, null] },
      ],
    });

    const [collection] = readStore(raw) ?? [];
    expect(collection.items).toHaveLength(1);
  });
});
