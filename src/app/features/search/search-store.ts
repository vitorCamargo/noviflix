import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, filter, map, of, switchMap, tap } from 'rxjs';
import { I18nService, type Lang } from '../../core/i18n/i18n.service';
import { TmdbService } from '../../core/tmdb/tmdb.service';
import type { MovieSummary } from '../../core/models/tmdb.models';
import { isSearchable, normaliseSearchTerm } from '../../shared/search-term/search-term';
import { TAIL_SLOTS } from './results-metrics';

export type SearchState = 'idle' | 'loading' | 'success' | 'error';

export const MAX_SEARCH_PAGE = 500;

interface SearchRequest {
  term: string;
  page: number;
  lang: Lang;
}

@Injectable({ providedIn: 'root' })
export class SearchStore {
  private readonly tmdb = inject(TmdbService);
  private readonly i18n = inject(I18nService);

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

  readonly totalPages = signal(0);

  readonly active = computed(() => this.query().length > 0);

  readonly empty = computed(() => this.state() === 'success' && this.results().length === 0);

  readonly failed = computed(() => this.state() === 'error');

  readonly loadingFirst = computed(() => this.state() === 'loading' && this.results().length === 0);

  readonly loadingMore = computed(() => this.state() === 'loading' && this.results().length > 0);

  readonly hasMore = computed(() => this.page() < this.totalPages());

  readonly slotCount = computed(() => {
    const loaded = this.results().length;
    if (!loaded) return 0;
    if (this.loadingMore()) return loaded + TAIL_SLOTS;
    return loaded + (this.hasMore() ? 1 : 0);
  });

  constructor() {
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

  loadMore(): void {
    if (this.state() === 'loading' || !this.hasMore()) return;
    this.request.update((req) => ({ ...req, page: req.page + 1 }));
  }

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

export function mergeUnique(
  current: readonly MovieSummary[],
  incoming: readonly MovieSummary[],
): MovieSummary[] {
  const seen = new Set(current.map((movie) => movie.id));
  return [...current, ...incoming.filter((movie) => !seen.has(movie.id))];
}
