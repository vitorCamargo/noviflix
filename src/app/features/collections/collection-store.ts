import type { MovieSummary } from '../../core/models/tmdb.models';
import type {
  CollectionStore,
  SavedMovie,
  UserCollection,
} from '../../core/models/user-collection.models';

export const TITLE_MAX = 80;
export const DESCRIPTION_MAX = 280;

export function newCollectionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

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

export function nextCollectionName(existing: readonly string[], base: string): string {
  const taken = new Set(existing.map((name) => name.trim().toLowerCase()));

  for (let n = 1; n <= existing.length + 1; n++) {
    const candidate = `${base} ${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }

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

export function addMovies(
  collection: UserCollection,
  movies: readonly MovieSummary[],
  now = Date.now(),
): UserCollection {
  const present = new Set(collection.items.map((item) => item.id));
  const additions = movies
    .filter((movie) => typeof movie?.id === 'number' && !present.has(movie.id))
    .filter((movie, index, all) => all.findIndex((m) => m.id === movie.id) === index)
    .map((movie) => toSavedMovie(movie, now));

  if (!additions.length) return collection;

  return {
    ...collection,
    items: [...collection.items, ...additions],
    updatedAt: new Date(now).toISOString(),
  };
}

export function removeMovie(
  collection: UserCollection,
  movieId: number,
  now = Date.now(),
): UserCollection {
  const items = collection.items.filter((item) => item.id !== movieId);
  if (items.length === collection.items.length) return collection;

  return { ...collection, items, updatedAt: new Date(now).toISOString() };
}

export function countPresent(collection: UserCollection, movies: readonly MovieSummary[]): number {
  const present = new Set(collection.items.map((item) => item.id));
  return movies.filter((movie) => present.has(movie.id)).length;
}

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
