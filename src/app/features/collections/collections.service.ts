import { Injectable, computed, signal } from '@angular/core';
import type { MovieSummary } from '../../core/models/tmdb.models';
import {
  COLLECTION_STORAGE_KEY,
  type UserCollection,
} from '../../core/models/user-collection.models';
import {
  addMovies,
  createCollection,
  nextCollectionName,
  readStore,
  removeMovie,
  serialiseStore,
} from './collection-store';

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private readonly store = signal<readonly UserCollection[]>(readInitial());

  readonly collections = this.store.asReadonly();

  readonly count = computed(() => this.store().length);

  readonly isEmpty = computed(() => this.store().length === 0);

  readonly recent = computed(() =>
    [...this.store()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );

  byId(id: string | null): UserCollection | null {
    if (!id) return null;
    return this.store().find((collection) => collection.id === id) ?? null;
  }

  create(name: string, description: string): UserCollection {
    const collection = createCollection(name, description);
    this.update([...this.store(), collection]);
    return collection;
  }

  createFor(
    movies: readonly MovieSummary[],
    baseName: string,
    description: string,
  ): { collection: UserCollection; added: number } {
    const name = nextCollectionName(
      this.store().map((collection) => collection.name),
      baseName,
    );

    const collection = createCollection(name, description);
    const filled = addMovies(collection, movies);

    this.update([...this.store(), filled]);
    return { collection: filled, added: filled.items.length };
  }

  rename(id: string, name: string, description: string): void {
    this.replace(id, (collection) => ({
      ...collection,
      name: name.trim(),
      description: description.trim(),
      updatedAt: new Date().toISOString(),
    }));
  }

  addTo(id: string, movies: readonly MovieSummary[]): number {
    const before = this.byId(id);
    if (!before) return 0;

    const after = addMovies(before, movies);
    if (after === before) return 0;

    this.replace(id, () => after);
    return after.items.length - before.items.length;
  }

  removeFrom(id: string, movieId: number): void {
    this.replace(id, (collection) => removeMovie(collection, movieId));
  }

  remove(id: string): UserCollection | null {
    const removed = this.byId(id);
    if (!removed) return null;

    this.update(this.store().filter((collection) => collection.id !== id));
    return removed;
  }

  restore(collection: UserCollection): void {
    if (this.byId(collection.id)) return;
    this.update([...this.store(), collection]);
  }

  private replace(id: string, change: (collection: UserCollection) => UserCollection): void {
    let touched = false;

    const next = this.store().map((collection) => {
      if (collection.id !== id) return collection;

      const updated = change(collection);
      if (updated !== collection) touched = true;
      return updated;
    });

    if (touched) this.update(next);
  }

  private update(next: readonly UserCollection[]): void {
    this.store.set(next);

    try {
      localStorage.setItem(COLLECTION_STORAGE_KEY, serialiseStore(next));
    } catch {}
  }
}

function readInitial(): readonly UserCollection[] {
  try {
    return readStore(localStorage.getItem(COLLECTION_STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}
