import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { MovieCard } from '../movie-card/movie-card';
import { SearchStore } from '../search-store';
import { CollectionPickerService } from '../../collections/collection-picker.service';
import { TAIL_SLOTS } from '../results-metrics';

/**
 * Distance ahead of the sentinel at which the next page is fetched.
 *
 * Generous on purpose: the point of loading continuously is that the grid never
 * appears to end, and waiting for the last card to be on screen guarantees a
 * visible stall while the request runs.
 */
const PREFETCH_MARGIN_PX = 600;

/** Placeholder tiles for a first search — roughly a TMDB page. */
const SKELETON_COUNT = 12;

/**
 * The results view: a continuous grid of cards, and the states either side of
 * having results — searching, nothing found, request failed.
 *
 * Reads the store directly rather than taking results as an input. There is one
 * search at a time and this is the only thing that renders it, so an input would
 * just be a second name for the same state.
 */
@Component({
  selector: 'nv-search-results-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MovieCard],
  templateUrl: './search-results-grid.html',
  styleUrl: './search-results-grid.scss',
})
export class SearchResultsGrid implements OnDestroy {
  protected readonly i18n = inject(I18nService);
  private readonly store = inject(SearchStore);
  private readonly picker = inject(CollectionPickerService);

  protected readonly results = this.store.results;
  protected readonly query = this.store.query;
  protected readonly totalResults = this.store.totalResults;
  protected readonly empty = this.store.empty;
  protected readonly failed = this.store.failed;
  protected readonly loadingFirst = this.store.loadingFirst;
  protected readonly loadingMore = this.store.loadingMore;
  protected readonly hasMore = this.store.hasMore;

  /**
   * Card rows, supplied by the page rather than measured here.
   *
   * The page has to know this number too, to work out how wide it must be for the
   * whole grid to be reachable, so it owns it and passes it down. Two independent
   * derivations of the same thing would eventually disagree, and the symptom is
   * cards that render past the scrollable edge.
   */
  readonly rows = input(2);

  protected readonly skeletons = Array.from({ length: SKELETON_COUNT }, (_, i) => i);
  protected readonly tail = Array.from({ length: TAIL_SLOTS }, (_, i) => i);

  /** Only rendered while there is a further page, so it can't fire at the end. */
  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');

  private observer: IntersectionObserver | null = null;

  constructor() {
    /*
     * Re-observes whenever the sentinel is created or destroyed, which happens
     * every time the last page is reached or a new search begins.
     *
     * The viewport is the root rather than the scrolling element: on desktop the
     * grid sits inside a horizontally-scrolled track and on mobile the page itself
     * scrolls, and viewport intersection accounts for either without this needing
     * to know which one is moving.
     */
    effect(() => {
      const target = this.sentinel()?.nativeElement;
      this.observer?.disconnect();

      if (!target || typeof IntersectionObserver === 'undefined') return;

      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) this.store.loadMore();
        },
        { rootMargin: `${PREFETCH_MARGIN_PX}px` },
      );
      this.observer.observe(target);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  /**
   * Count announcement, for assistive tech only.
   *
   * The visible count was removed, but a screen reader otherwise gets no signal
   * that a search happened at all — the grid simply changes underneath it.
   */
  protected readonly announcement = computed(() => {
    if (this.loadingFirst()) return this.i18n.t('search.searching');
    if (this.failed()) return this.i18n.t('search.failed');
    if (!this.totalResults()) return '';
    return this.i18n.t('search.resultCount', {
      count: this.totalResults(),
      query: this.query(),
    });
  });

  protected retry(): void {
    this.store.retry();
  }

}
