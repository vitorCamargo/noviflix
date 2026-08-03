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

const PREFETCH_MARGIN_PX = 600;

const SKELETON_COUNT = 12;

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

  readonly rows = input(2);

  protected readonly skeletons = Array.from({ length: SKELETON_COUNT }, (_, i) => i);
  protected readonly tail = Array.from({ length: TAIL_SLOTS }, (_, i) => i);

  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');

  private observer: IntersectionObserver | null = null;

  constructor() {
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
