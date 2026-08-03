import { computed, inject, type Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { TmdbService } from '../../core/tmdb/tmdb.service';
import type { MovieDetails } from '../../core/models/tmdb.models';

export interface MovieResult {
  movie: MovieDetails | null;
  failed: boolean;
}

export function createMovieResult(movieId: Signal<number | null>): Signal<MovieResult> {
  const tmdb = inject(TmdbService);
  const i18n = inject(I18nService);

  const request = computed(() => ({ id: movieId(), lang: i18n.lang() }));

  return toSignal(
    toObservable(request).pipe(
      switchMap(({ id }) =>
        id == null
          ? of({ movie: null, failed: false })
          : tmdb.movie(id).pipe(
              switchMap((movie) => of({ movie, failed: false })),
              catchError(() => of({ movie: null, failed: true })),
            ),
      ),
    ),
    { initialValue: { movie: null, failed: false } as MovieResult },
  );
}
