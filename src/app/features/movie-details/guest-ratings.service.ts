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

/**
 * What this browser's guest session has rated.
 *
 * Exists because a rating had nowhere to live between page loads. The control held it in
 * component state, so a reload showed an empty star row for a film already scored — and
 * re-rating it was the only way to find out the first attempt had worked.
 *
 * Kept in localStorage as well as fetched, and the local copy is deliberately the winner
 * where the two disagree. Two things make the API an unreliable mirror of a rating just
 * sent: TMDB's rated list is not immediately consistent, and the proxy caches reads. Local
 * writes are always at least as new, so trusting them means the UI is right the moment it
 * loads rather than whenever the server catches up.
 */
@Injectable({ providedIn: 'root' })
export class GuestRatingsService {
  private readonly tmdb = inject(TmdbService);
  private readonly guest = inject(GuestSessionService);

  private readonly ratings = signal<ReadonlyMap<number, number>>(new Map());

  readonly loaded = signal(false);

  /** Session the current ratings belong to, so a swap can be detected. */
  private loadedFor: string | null = null;

  private pending: Observable<ReadonlyMap<number, number>> | null = null;

  readonly count = computed(() => this.ratings().size);

  constructor() {
    /*
     * Follows the session, in both directions.
     *
     * Hydrating here rather than in a field initialiser means the stored map is adopted as
     * soon as a session exists, including the one restored from storage on load — which is
     * what makes a rating visible immediately after a refresh.
     *
     * Extending swaps the id, and the new session has rated nothing. Holding the old map
     * would show scores the current session does not have, a more confusing lie than none.
     */
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

  /** This session's rating for a film, or null if it hasn't rated it. */
  ratingFor(movieId: number | null): number | null {
    if (movieId == null) return null;
    return this.ratings().get(movieId) ?? null;
  }

  /**
   * Reconciles the stored map with TMDB's, once.
   *
   * Safe to call from every rating control that mounts: the first caller starts the request
   * and the rest share it.
   */
  ensureLoaded(): Observable<ReadonlyMap<number, number>> {
    if (this.loaded()) return of(this.ratings());
    if (this.pending) return this.pending;

    this.pending = this.guest.ensure().pipe(
      switchMap((sessionId) =>
        this.fetchAll(sessionId).pipe(map((remote) => ({ sessionId, remote }))),
      ),
      tap(({ sessionId, remote }) => {
        /*
         * Remote first, then local on top. The server knows about ratings from earlier
         * visits this map may have lost; the local copy knows about ones the server has not
         * caught up on. Overlaying local last means the newer of the two always wins.
         */
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

  /** Records a rating just sent, and persists it so a reload keeps it. */
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

        return forkJoin(
          rest.map((page) => this.tmdb.guestRatedMovies(sessionId, page)),
        ).pipe(map((pages) => mergeRatingPages([first, ...pages])));
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
    } catch {
      // Storage can be unavailable in private modes; the map still works for this visit.
    }
  }
}
