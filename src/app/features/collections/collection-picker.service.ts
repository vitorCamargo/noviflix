import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import type { MovieSummary } from '../../core/models/tmdb.models';

@Injectable({ providedIn: 'root' })
export class CollectionPickerService {
  private readonly chosen = signal<ReadonlyMap<number, MovieSummary>>(new Map());

  private readonly direct = signal<readonly MovieSummary[]>([]);

  readonly open = signal(false);

  private readonly router = inject(Router);

  constructor() {
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

  readonly pending = computed(() => (this.direct().length ? this.direct() : this.selection()));

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

  openForSelection(): void {
    if (!this.hasSelection()) return;
    this.direct.set([]);
    this.open.set(true);
  }

  openFor(movie: MovieSummary): void {
    this.direct.set([movie]);
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
    this.direct.set([]);
  }

  finish(): void {
    const wasDirect = this.direct().length > 0;

    this.close();
    if (!wasDirect) this.clearSelection();
  }

  reset(): void {
    this.close();
    this.clearSelection();
  }
}
