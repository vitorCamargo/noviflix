import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, forkJoin, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { TmdbService } from '../../core/tmdb/tmdb.service';
import { GuestSessionService } from './guest-session.service';
import {
  GUEST_RATINGS_KEY,
  mergeRatingPages,
  readStoredRatings,
  remainingPages,
  serialiseRatings,
  toRatingMap,
} from './guest-ratings';

@Injectable({ providedIn: 'root' })
export class GuestRatingsService {
  private readonly tmdb = inject(TmdbService);
  private readonly guest = inject(GuestSessionService);

  private readonly ratings = signal<ReadonlyMap<number, number>>(new Map());

  readonly loaded = signal(false);

  private loadedFor: string | null = null;

  private pending: Observable<ReadonlyMap<number, number>> | null = null;

  readonly count = computed(() => this.ratings().size);

  constructor() {
    effect(() => {
      const id = this.guest.session()?.id ?? null;

      untracked(() => {
        if (id === this.loadedFor) return;

        this.pending = null;
        this.loadedFor = null;
        this.loaded.set(false);
        this.ratings.set(id ? this.read(id) : new Map());
      });
    });
  }

  ratingFor(movieId: number | null): number | null {
    if (movieId == null) return null;
    return this.ratings().get(movieId) ?? null;
  }

  ensureLoaded(): Observable<ReadonlyMap<number, number>> {
    if (this.loaded()) return of(this.ratings());
    if (this.pending) return this.pending;

    this.pending = this.guest.ensure().pipe(
      switchMap((sessionId) =>
        this.fetchAll(sessionId).pipe(map((remote) => ({ sessionId, remote }))),
      ),
      tap(({ sessionId, remote }) => {
        const merged = new Map(remote);
        for (const [id, rating] of this.ratings()) merged.set(id, rating);

        this.ratings.set(merged);
        this.write(sessionId, merged);
        this.loadedFor = sessionId;
        this.loaded.set(true);
        this.pending = null;
      }),
      map(() => this.ratings()),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.pending;
  }

  remember(movieId: number, rating: number): void {
    const next = new Map(this.ratings());
    next.set(movieId, rating);
    this.ratings.set(next);

    const sessionId = this.guest.session()?.id;
    if (sessionId) this.write(sessionId, next);
  }

  private fetchAll(sessionId: string): Observable<Map<number, number>> {
    return this.tmdb.guestRatedMovies(sessionId, 1).pipe(
      switchMap((first) => {
        const rest = remainingPages(first.total_pages ?? 1);

        if (!rest.length) return of(toRatingMap(first.results));

        return forkJoin(rest.map((page) => this.tmdb.guestRatedMovies(sessionId, page))).pipe(
          map((pages) => mergeRatingPages([first, ...pages])),
        );
      }),
    );
  }

  private read(sessionId: string): Map<number, number> {
    try {
      return readStoredRatings(localStorage.getItem(GUEST_RATINGS_KEY), sessionId);
    } catch {
      return new Map();
    }
  }

  private write(sessionId: string, ratings: ReadonlyMap<number, number>): void {
    try {
      localStorage.setItem(GUEST_RATINGS_KEY, serialiseRatings(sessionId, ratings));
    } catch {}
  }
}
