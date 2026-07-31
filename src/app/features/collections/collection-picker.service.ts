import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import type { MovieSummary } from '../../core/models/tmdb.models';

/**
 * Films chosen for adding to a collection, and whether the picker is open.
 *
 * A service rather than component state because three unrelated places take part: the result
 * cards that mark films, the bar that reports the count, and the picker overlay that lands
 * them somewhere. Threading that through the tree would make each one know about the others.
 *
 * Selections are held as whole films, not ids. A collection stores a snapshot of the title,
 * poster and score, so the id alone would mean fetching each film again at the moment of
 * saving — and the results grid already has everything needed.
 */
@Injectable({ providedIn: 'root' })
export class CollectionPickerService {
  private readonly chosen = signal<ReadonlyMap<number, MovieSummary>>(new Map());

  /** Films the picker will add. Empty unless it was opened for one film directly. */
  private readonly direct = signal<readonly MovieSummary[]>([]);

  readonly open = signal(false);

  private readonly router = inject(Router);

  constructor() {
    /*
     * A selection belongs to the list it was made on, so navigating away drops it.
     *
     * The pop-up counts as navigating: it is a named outlet, so opening, closing or switching
     * films inside it all end a navigation. Without this the bar would keep offering films that
     * are no longer on screen — most visibly over a related-films row, where none of the marked
     * cards appear at all.
     */
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.reset());
  }

  readonly selection = computed(() => [...this.chosen().values()]);

  readonly count = computed(() => this.chosen().size);

  readonly hasSelection = computed(() => this.chosen().size > 0);

  /**
   * What a confirm would add: the direct films when opened for one, otherwise the selection.
   *
   * Kept separate so opening the picker from a film's own page doesn't quietly sweep up
   * whatever happens to be selected back on the results grid.
   */
  readonly pending = computed(() =>
    this.direct().length ? this.direct() : this.selection(),
  );

  isSelected(movieId: number): boolean {
    return this.chosen().has(movieId);
  }

  toggle(movie: MovieSummary): void {
    const next = new Map(this.chosen());

    if (next.has(movie.id)) next.delete(movie.id);
    else next.set(movie.id, movie);

    this.chosen.set(next);
  }

  clearSelection(): void {
    this.chosen.set(new Map());
  }

  /** Opens the picker for the current selection. */
  openForSelection(): void {
    if (!this.hasSelection()) return;
    this.direct.set([]);
    this.open.set(true);
  }

  /**
   * Opens the picker for one film, ignoring any selection elsewhere.
   *
   * Used by a film's own details pop-up, where the subject is that film and not whatever happens
   * to be marked on the grid behind the overlay.
   */
  openFor(movie: MovieSummary): void {
    this.direct.set([movie]);
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
    this.direct.set([]);
  }

  /**
   * Closes the picker after a successful add, and unmarks what landed.
   *
   * Leaving films marked would invite adding them twice, and the second attempt would silently do
   * nothing since they are already there.
   *
   * A direct add leaves the selection alone: it was never the subject, so films marked elsewhere
   * have not been placed anywhere and should stay marked.
   */
  finish(): void {
    const wasDirect = this.direct().length > 0;

    this.close();
    if (!wasDirect) this.clearSelection();
  }

  /** Drops everything, marked films included. Used when the ground moves under the selection. */
  reset(): void {
    this.close();
    this.clearSelection();
  }
}
