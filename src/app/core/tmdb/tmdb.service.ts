import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  MovieDetails,
  MovieSummary,
  Paginated,
  Video,
} from '../models/tmdb.models';

type ImageSize =
  | 'w92'
  | 'w154'
  | 'w185'
  | 'w300'
  | 'w342'
  | 'w500'
  | 'w780'
  | 'w1280'
  | 'original';

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.tmdb.baseUrl;

  /** Poster/backdrop URL, or null so templates can fall back cleanly. */
  imageUrl(path: string | null | undefined, size: ImageSize = 'w780'): string | null {
    return path ? `${environment.tmdb.imageBaseUrl}/${size}${path}` : null;
  }

  nowPlaying(page = 1): Observable<MovieSummary[]> {
    return this.get<Paginated<MovieSummary>>('/movie/now_playing', { page }).pipe(
      map((res) => res.results ?? []),
    );
  }

  /**
   * Keyword search, returning the page envelope rather than just the results.
   *
   * The envelope is the point: `page` and `total_pages` are what pagination is
   * built from, so unwrapping to a bare array here — as `nowPlaying` does, since
   * nothing pages through it — would throw away the only numbers the caller
   * needs.
   */
  search(query: string, page = 1): Observable<Paginated<MovieSummary>> {
    return this.get<Paginated<MovieSummary>>('/search/movie', {
      query,
      page,
      include_adult: false,
    });
  }

  /**
   * Full record for one movie, with credits folded in.
   *
   * `append_to_response` keeps this to a single round trip — genres and cast
   * both come back, rather than a detail call plus a credits call. Only ever
   * fetched for the movie on screen.
   */
  movie(id: number | string): Observable<MovieDetails> {
    return this.get<MovieDetails>(`/movie/${id}`, {
      append_to_response: 'credits',
    });
  }

  /**
   * Clips attached to a movie — trailers, teasers, featurettes.
   *
   * Separate from `movie()` rather than appended to it: this is only needed when
   * someone actually asks to watch something, and folding it into the detail
   * call would fetch a video list for every card the carousel passes through.
   */
  videos(id: number | string): Observable<Video[]> {
    return this.get<{ results: Video[] }>(`/movie/${id}/videos`).pipe(
      map((res) => res.results ?? []),
    );
  }

  private get<T>(path: string, params: Record<string, string | number | boolean> = {}) {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      httpParams = httpParams.set(key, String(value));
    }
    return this.http.get<T>(`${this.base}${path}`, { params: httpParams });
  }
}
