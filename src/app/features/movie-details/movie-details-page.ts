import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { I18nService } from '../../core/i18n/i18n.service';
import { TmdbService } from '../../core/tmdb/tmdb.service';
import { PageGrid, readCellSize, readViewport, toGridArea } from '../../layout/page-grid/page-grid';
import { HOME_STACK_MAX } from '../home/home-layout';
import { CAST_LIMIT, CastGrid } from './cast-grid/cast-grid';
import { MovieFacts } from './movie-facts/movie-facts';
import { RatingForm } from './rating-form/rating-form';
import { RELATED_LIMIT, RelatedGrid } from './related-grid/related-grid';
import { createMovieResult } from './movie-request';
import { releaseYear } from './movie-format';
import {
  ASIDE_COLS,
  FACTS_COLS,
  PAGE_START_COL,
  PAGE_START_ROW,
  moviePageLayout,
} from './movie-page-layout';

type Section = 'facts' | 'cast' | 'related';

@Component({
  selector: 'nv-movie-details-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageGrid, RouterLink, MovieFacts, CastGrid, RelatedGrid, RatingForm],
  templateUrl: './movie-details-page.html',
  styleUrl: './movie-details-page.scss',
})
export class MovieDetailsPage {
  private readonly tmdb = inject(TmdbService);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);

  private readonly params = toSignal(this.route.paramMap, { initialValue: null });

  protected readonly id = computed(() => this.params()?.get('id') ?? '');

  private readonly numericId = computed(() => {
    const raw = Number(this.id());
    return Number.isInteger(raw) && raw > 0 ? raw : null;
  });

  private readonly result = createMovieResult(this.numericId);

  protected readonly movie = computed(() => this.result().movie);
  protected readonly failed = computed(() => this.result().failed);

  protected readonly loading = computed(
    () => this.numericId() != null && !this.movie() && !this.failed(),
  );

  private readonly viewport = signal(readViewport());

  private readonly rows = computed(() =>
    Math.max(1, Math.floor(this.viewport().height / readCellSize())),
  );

  protected readonly stacked = computed(() => this.viewport().width <= HOME_STACK_MAX);

  private readonly layout = computed(() =>
    moviePageLayout(
      this.rows(),
      Math.min(this.cast().length, CAST_LIMIT),
      Math.min(this.related().length, RELATED_LIMIT),
    ),
  );

  protected readonly cardRows = computed(() => this.layout().rows);

  protected readonly minColumns = computed(() => (this.stacked() ? 18 : this.layout().totalCols));

  protected readonly area = computed(() =>
    this.stacked()
      ? null
      : toGridArea({
          row: PAGE_START_ROW,
          rowEnd: Math.max(PAGE_START_ROW + 1, this.rows() + 1),
          col: PAGE_START_COL,
          colEnd: this.layout().totalCols,
        }),
  );

  private resizeFrame: number | null = null;

  @HostListener('window:resize')
  protected onResize(): void {
    if (this.resizeFrame !== null) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = null;
      this.viewport.set(readViewport());
    });
  }

  protected readonly asideCols = ASIDE_COLS;
  protected readonly factsCols = FACTS_COLS;

  protected readonly poster = computed(() =>
    this.tmdb.imageUrl(this.movie()?.poster_path ?? null, 'w500'),
  );

  protected readonly year = computed(() => releaseYear(this.movie()));

  protected readonly genres = computed(
    () => this.movie()?.genres?.map((genre) => genre.name) ?? [],
  );

  protected readonly overview = computed(() => this.movie()?.overview?.trim() || null);

  protected readonly cast = computed(() => this.movie()?.credits?.cast ?? []);

  protected readonly related = computed(() => this.movie()?.recommendations?.results ?? []);

  protected readonly tab = signal<Section>('facts');

  protected readonly tabs = [
    { id: 'facts' as const, key: 'movie.tab.facts' as const },
    { id: 'cast' as const, key: 'movie.tab.cast' as const },
    { id: 'related' as const, key: 'movie.tab.related' as const },
  ];

  protected shows(section: Section): boolean {
    return !this.stacked() || this.tab() === section;
  }

  protected select(section: Section): void {
    this.tab.set(section);
  }

  constructor() {
    effect(() => {
      this.numericId();
      this.tab.set('facts');
    });
  }
}
