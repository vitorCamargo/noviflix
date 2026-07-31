import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, filter, map, of, switchMap, tap } from 'rxjs';
import { I18nService, type Lang } from '../../core/i18n/i18n.service';
import { TmdbService } from '../../core/tmdb/tmdb.service';
import type { MovieSummary } from '../../core/models/tmdb.models';
import { isSearchable, normaliseSearchTerm } from '../../shared/search-term/search-term';
import { TAIL_SLOTS } from './results-metrics';

export type SearchState = 'idle' | 'loading' | 'success' | 'error';

/**
 * TMDB refuses pages past this, so offering them would be offering a dead end.
 * The API still reports the true `total_pages`, which can be far higher.
 */
export const MAX_SEARCH_PAGE = 500;

interface SearchRequest {
  term: string;
  page: number;
  lang: Lang;
}

/**
 * Holds the current search, accumulating pages as they are asked for.
 *
 * A service rather than state inside a component because two unrelated places
 * need it: the field that sets the term, and the page that decides whether to show
 * its own composition or the results. Passing it between them would mean one
 * owning the other.
 *
 * Root-provided so the results survive navigating to a movie and back — losing the
 * search because someone opened a film would be its own bug.
 */
@Injectable({ providedIn: 'root' })
export class SearchStore {
  private readonly tmdb = inject(TmdbService);
  private readonly i18n = inject(I18nService);

  /**
   * Term, page and language as one value.
   *
   * Deliberately a single signal rather than three. A new search changes both the
   * term and the page, and separate signals would emit twice — firing a request
   * for the new term on the *old* page before correcting itself.
   */
  private readonly request = signal<SearchRequest>({
    term: '',
    page: 1,
    lang: this.i18n.lang(),
  });

  readonly query = computed(() => this.request().term);
  readonly page = computed(() => this.request().page);

  readonly results = signal<readonly MovieSummary[]>([]);
  readonly totalResults = signal(0);
  readonly state = signal<SearchState>('idle');

  /** Reported total, clamped to what TMDB will actually serve. */
  readonly totalPages = signal(0);

  /** Whether the page should show results instead of its own content. */
  readonly active = computed(() => this.query().length > 0);

  /** A completed search that found nothing, as opposed to one still running. */
  readonly empty = computed(
    () => this.state() === 'success' && this.results().length === 0,
  );

  readonly failed = computed(() => this.state() === 'error');

  /** First page in flight: nothing on screen yet, so a skeleton is warranted. */
  readonly loadingFirst = computed(
    () => this.state() === 'loading' && this.results().length === 0,
  );

  /** A later page in flight, appended to results already on screen. */
  readonly loadingMore = computed(
    () => this.state() === 'loading' && this.results().length > 0,
  );

  readonly hasMore = computed(() => this.page() < this.totalPages());

  /**
   * Grid slots the results currently need, including the placeholders and the
   * sentinel.
   *
   * The page has to be wide enough for these *before* they render, or the tail
   * would be laid out past the scrollable area and the sentinel would sit
   * somewhere unreachable — so it could never come into view and trigger.
   */
  readonly slotCount = computed(() => {
    const loaded = this.results().length;
    if (!loaded) return 0;
    if (this.loadingMore()) return loaded + TAIL_SLOTS;
    return loaded + (this.hasMore() ? 1 : 0);
  });

  constructor() {
    /*
     * Language is part of the request, not a display concern: TMDB returns
     * localised titles, so switching it restarts from page one. Appending a page
     * of newly-translated results onto pages fetched in the previous language
     * would interleave the two.
     */
    effect(() => {
      const lang = this.i18n.lang();
      untracked(() => {
        const current = this.request();
        if (current.lang === lang) return;
        this.request.set({ ...current, lang, page: 1 });
      });
    });

    toObservable(this.request)
      .pipe(
        // A cleared field is not a failed search; `clear` has already reset the
        // state and there is nothing to ask the API.
        filter((req) => isSearchable(req.term)),
        tap(() => this.state.set('loading')),
        switchMap((req) =>
          this.tmdb.search(req.term, req.page).pipe(
            map((res) => ({ req, res })),
            catchError(() => of({ req, res: null })),
          ),
        ),
        takeUntilDestroyed(),
      )
      /*
       * switchMap discards responses for a term or page that has since changed.
       * Without it a slow early request could land after a fast later one and
       * append a page nobody is looking at any more.
       */
      .subscribe(({ req, res }) => {
        if (!res) {
          this.state.set('error');
          return;
        }

        const incoming = res.results ?? [];

        this.results.update((current) =>
          req.page === 1 ? incoming : mergeUnique(current, incoming),
        );
        this.totalResults.set(res.total_results ?? 0);
        this.totalPages.set(Math.min(res.total_pages ?? 0, MAX_SEARCH_PAGE));
        this.state.set('success');
      });
  }

  /**
   * Starts a new search, or clears everything when the term is empty.
   *
   * Always back to page one with the previous results dropped: keeping them would
   * briefly show one query's films under another's name.
   */
  search(raw: string): void {
    const term = normaliseSearchTerm(raw);

    if (!term) {
      this.clear();
      return;
    }
    if (term === this.query()) return;

    this.results.set([]);
    this.totalPages.set(0);
    this.totalResults.set(0);
    this.request.set({ term, page: 1, lang: this.i18n.lang() });
  }

  /**
   * Asks for the next page.
   *
   * Guarded rather than trusting the caller: the trigger is an intersection
   * observer, which can fire several times while a request is still in flight, and
   * each of those would otherwise skip a page.
   */
  loadMore(): void {
    if (this.state() === 'loading' || !this.hasMore()) return;
    this.request.update((req) => ({ ...req, page: req.page + 1 }));
  }

  /** Retries the page that failed, keeping whatever is already loaded. */
  retry(): void {
    if (!isSearchable(this.query())) return;
    this.request.update((req) => ({ ...req }));
  }

  clear(): void {
    this.request.set({ term: '', page: 1, lang: this.i18n.lang() });
    this.results.set([]);
    this.totalPages.set(0);
    this.totalResults.set(0);
    this.state.set('idle');
  }
}

/**
 * Appends only films not already listed.
 *
 * TMDB can repeat a record across pages, and a repeat is not cosmetic here: the
 * results are tracked by id, and Angular throws on a duplicate tracking key.
 */
export function mergeUnique(
  current: readonly MovieSummary[],
  incoming: readonly MovieSummary[],
): MovieSummary[] {
  const seen = new Set(current.map((movie) => movie.id));
  return [...current, ...incoming.filter((movie) => !seen.has(movie.id))];
}
