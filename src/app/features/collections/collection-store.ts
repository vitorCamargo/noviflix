import type { MovieSummary } from '../../core/models/tmdb.models';
import type {
  CollectionStore,
  SavedMovie,
  UserCollection,
} from '../../core/models/user-collection.models';

/**
 * Collection rules as plain functions.
 *
 * Everything here is pure and returns new objects rather than mutating: the service holds
 * these in a signal, and a signal handed a mutated array cannot tell that anything changed.
 */

/** Longest title and description accepted, so one entry cannot fill the quota. */
export const TITLE_MAX = 80;
export const DESCRIPTION_MAX = 280;

/**
 * A stable id for a new collection.
 *
 * `crypto.randomUUID` needs a secure context, which a plain-HTTP dev server is not, so the
 * fallback is not academic — without it creating a collection would throw on localhost for
 * anyone not on HTTPS.
 */
export function newCollectionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Snapshot of a film as it goes into a collection.
 *
 * Stored rather than referenced by id alone so a collection renders without a request per
 * film. The trade-off is that a title or poster changed on TMDB will be stale here — worth
 * it for a list that has to open instantly and work offline.
 */
export function toSavedMovie(movie: MovieSummary, now = Date.now()): SavedMovie {
  return {
    id: movie.id,
    title: movie.title,
    posterPath: movie.poster_path ?? null,
    releaseDate: movie.release_date || null,
    voteAverage: movie.vote_average ?? null,
    addedAt: new Date(now).toISOString(),
  };
}

/**
 * An unused name of the form `base 1`, `base 2`, and so on.
 *
 * Quick-create has no form to ask for a name, so it invents one. Numbering past what already
 * exists rather than always starting at one keeps the list navigable — three collections all
 * called the same thing would be indistinguishable in the picker.
 */
export function nextCollectionName(
  existing: readonly string[],
  base: string,
): string {
  const taken = new Set(existing.map((name) => name.trim().toLowerCase()));

  for (let n = 1; n <= existing.length + 1; n++) {
    const candidate = `${base} ${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }

  // Unreachable while the loop runs one past the count, but a name is always returned rather
  // than risking undefined reaching storage.
  return `${base} ${existing.length + 1}`;
}

export function createCollection(
  name: string,
  description: string,
  now = Date.now(),
): UserCollection {
  const stamp = new Date(now).toISOString();

  return {
    id: newCollectionId(),
    name: name.trim(),
    description: description.trim(),
    items: [],
    createdAt: stamp,
    updatedAt: stamp,
  };
}

/**
 * Adds films, skipping any already present.
 *
 * Returns the collection unchanged when nothing new arrives, which keeps `updatedAt`
 * honest — a list that reports being modified every time someone re-adds the same film
 * sorts wrongly and reads as busier than it is.
 */
export function addMovies(
  collection: UserCollection,
  movies: readonly MovieSummary[],
  now = Date.now(),
): UserCollection {
  const present = new Set(collection.items.map((item) => item.id));
  const additions = movies
    .filter((movie) => typeof movie?.id === 'number' && !present.has(movie.id))
    // A single call can carry the same film twice when a selection is built up loosely.
    .filter((movie, index, all) => all.findIndex((m) => m.id === movie.id) === index)
    .map((movie) => toSavedMovie(movie, now));

  if (!additions.length) return collection;

  return {
    ...collection,
    items: [...collection.items, ...additions],
    updatedAt: new Date(now).toISOString(),
  };
}

/** Removes one film. Unchanged if it wasn't there. */
export function removeMovie(
  collection: UserCollection,
  movieId: number,
  now = Date.now(),
): UserCollection {
  const items = collection.items.filter((item) => item.id !== movieId);
  if (items.length === collection.items.length) return collection;

  return { ...collection, items, updatedAt: new Date(now).toISOString() };
}

/** How many of these films the collection already holds. */
export function countPresent(
  collection: UserCollection,
  movies: readonly MovieSummary[],
): number {
  const present = new Set(collection.items.map((item) => item.id));
  return movies.filter((movie) => present.has(movie.id)).length;
}

// --------------------------------------------------------------------- storage

/**
 * Parses the stored store, returning null for anything it does not recognise.
 *
 * Version is checked rather than assumed: a future format read as the current one would
 * either crash or silently drop fields, and losing someone's collections is worse than
 * ignoring a record this build cannot understand.
 */
export function readStore(raw: string | null): UserCollection[] | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;

    const { version, collections } = parsed as Partial<CollectionStore>;
    if (version !== 1 || !Array.isArray(collections)) return null;

    return collections.filter(isCollection).map(normalise);
  } catch {
    return null;
  }
}

export function serialiseStore(collections: readonly UserCollection[]): string {
  const store: CollectionStore = { version: 1, collections: [...collections] };
  return JSON.stringify(store);
}

function isCollection(value: unknown): value is UserCollection {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<UserCollection>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.name === 'string'
  );
}

/**
 * Fills in anything a stored record is missing.
 *
 * Storage is shared with the visitor's own devtools, and records written by an earlier build
 * may lack fields added since. Repairing beats discarding: the collection is theirs.
 */
function normalise(collection: UserCollection): UserCollection {
  const stamp = collection.createdAt ?? new Date(0).toISOString();

  return {
    ...collection,
    description: collection.description ?? '',
    items: Array.isArray(collection.items) ? collection.items.filter(isSavedMovie) : [],
    createdAt: stamp,
    updatedAt: collection.updatedAt ?? stamp,
  };
}

function isSavedMovie(value: unknown): value is SavedMovie {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<SavedMovie>;
  return typeof candidate.id === 'number' && typeof candidate.title === 'string';
}
