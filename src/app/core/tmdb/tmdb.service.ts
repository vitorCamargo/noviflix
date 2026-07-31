import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  GuestSession,
  MovieDetails,
  MovieSummary,
  Paginated,
  RatedMovie,
  RatingResponse,
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
      // Cast and related films arrive with the record, so opening the details
      // costs one request rather than three — and switching tabs costs none.
      append_to_response: 'credits,recommendations',
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

  /**
   * A short-lived session identifying an anonymous visitor.
   *
   * TMDB will not accept a rating without one, and it is the only way to rate
   * without asking the visitor to sign in to an account they may not have.
   */
  guestSession(): Observable<GuestSession> {
    return this.get<GuestSession>('/authentication/guest_session/new');
  }

  /**
   * Films this guest session has rated, each with the guest's own score.
   *
   * The only way to recover what someone rated: the score is theirs, not TMDB's average,
   * and nothing else returns it. Without this a reload loses every rating the visitor
   * gave, since the app has no account to read them back from.
   */
  guestRatedMovies(
    guestSessionId: string,
    page = 1,
  ): Observable<Paginated<RatedMovie>> {
    return this.get<Paginated<RatedMovie>>(
      `/guest_session/${guestSessionId}/rated/movies`,
      { page },
    );
  }

  /**
   * Posts a rating, attributed to a guest session.
   *
   * The one write in the app. The proxy permits POST for this path alone — see the
   * note beside its allow-list, since widening that is a security decision rather
   * than a convenience.
   */
  rateMovie(
    id: number | string,
    value: number,
    guestSessionId: string,
  ): Observable<RatingResponse> {
    return this.http.post<RatingResponse>(
      `${this.base}/movie/${id}/rating`,
      { value },
      { params: new HttpParams().set('guest_session_id', guestSessionId) },
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
