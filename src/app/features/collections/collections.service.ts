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

/**
 * The visitor's collections, held in a signal and mirrored to localStorage.
 *
 * Local by design, per the spec — there is no account to attach them to. That also makes
 * them the one thing that survives a guest session being swapped, since nothing here is
 * keyed by the session id.
 *
 * Every mutation goes through `update`, so there is exactly one place that writes to storage
 * and no path that changes the signal without persisting.
 */
@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private readonly store = signal<readonly UserCollection[]>(readInitial());

  readonly collections = this.store.asReadonly();

  readonly count = computed(() => this.store().length);

  readonly isEmpty = computed(() => this.store().length === 0);

  /** Newest first, which is the order the list page shows. */
  readonly recent = computed(() =>
    [...this.store()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );

  byId(id: string | null): UserCollection | null {
    if (!id) return null;
    return this.store().find((collection) => collection.id === id) ?? null;
  }

  /**
   * The most recently created collection's id.
   *
   * The collections page follows it, so a collection made from the dialog is the one on screen
   * afterwards. The dialog lives at the app root and knows nothing about that page, so the fact
   * travels through the store they already share rather than through a wire between them.
   */
  private readonly created = signal<string | null>(null);

  readonly lastCreated = this.created.asReadonly();

  /** Creates a collection and returns it, so the caller can show it. */
  create(name: string, description: string): UserCollection {
    const collection = createCollection(name, description);
    this.update([...this.store(), collection]);
    this.created.set(collection.id);
    return collection;
  }

  /**
   * Creates a collection with a generated name and puts these films straight in.
   *
   * The quick path from the add menu: naming it there would mean a form on top of a menu, and the
   * point of that button is to get the film somewhere in one press. The name and description can
   * be edited afterwards — the form on the collections page is still where a deliberate one gets
   * made, with both fields required as the spec asks.
   */
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
    this.created.set(filled.id);
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

  /**
   * Adds films to one collection, skipping any it already holds.
   *
   * Returns how many were actually added, so the caller can say "3 added" rather than
   * implying it saved films that were already there.
   */
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

  /**
   * Deletes a collection and hands it back, so the caller can offer it again.
   *
   * Returning the whole thing rather than nothing is what makes the undo possible without a
   * separate bin to keep it in: whoever asked for the deletion holds the only copy, and drops it
   * when the offer expires.
   */
  remove(id: string): UserCollection | null {
    const removed = this.byId(id);
    if (!removed) return null;

    this.update(this.store().filter((collection) => collection.id !== id));
    return removed;
  }

  /**
   * Puts a deleted collection back, untouched.
   *
   * Position is not restored because there is none to restore: the list is ordered by when each
   * was last changed, and this one has not changed — so it lands where it was.
   */
  restore(collection: UserCollection): void {
    if (this.byId(collection.id)) return;
    this.update([...this.store(), collection]);
  }

  private replace(
    id: string,
    change: (collection: UserCollection) => UserCollection,
  ): void {
    let touched = false;

    const next = this.store().map((collection) => {
      if (collection.id !== id) return collection;

      const updated = change(collection);
      if (updated !== collection) touched = true;
      return updated;
    });

    // Skipped when nothing changed, so a no-op does not rewrite storage or wake every
    // computed reading the list.
    if (touched) this.update(next);
  }

  private update(next: readonly UserCollection[]): void {
    this.store.set(next);

    try {
      localStorage.setItem(COLLECTION_STORAGE_KEY, serialiseStore(next));
    } catch {
      // Storage can be unavailable in private modes, or full. The collections still work
      // for this visit; losing them on reload beats losing the interaction now.
    }
  }
}

function readInitial(): readonly UserCollection[] {
  try {
    return readStore(localStorage.getItem(COLLECTION_STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}
