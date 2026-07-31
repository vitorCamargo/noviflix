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

/**
 * Loads one film, refetching when the id or the language changes.
 *
 * Shared by the pop-up and the page because they arrange the same record
 * differently — duplicating this would mean two places to keep the language
 * dependency and the error handling in step.
 *
 * Must be called from an injection context, which means a field initialiser.
 */
export function createMovieResult(
  movieId: Signal<number | null>,
): Signal<MovieResult> {
  const tmdb = inject(TmdbService);
  const i18n = inject(I18nService);

  // Language is part of the key: TMDB returns localised titles and overviews, so a
  // language change has to refetch rather than leave the previous one on screen.
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
