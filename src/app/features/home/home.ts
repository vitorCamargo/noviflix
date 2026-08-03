import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { AppReadyService } from '../../core/app-ready.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TmdbService } from '../../core/tmdb/tmdb.service';
import type { MovieDetails, MovieSummary } from '../../core/models/tmdb.models';
import { PageGrid, readCellSize, readViewport, toGridArea } from '../../layout/page-grid/page-grid';
import { DrumCard } from '../../shared/drum-card/drum-card';
import { DotField } from './dot-field/dot-field';
import { badgeTrail } from './badge-trail';
import {
  CAROUSEL_NUDGE,
  HOME_COMPACT_MAX,
  HOME_STACK_MAX,
  POSTER_NUDGE,
  homeAreas,
  homeMinColumns,
  homeResultsArea,
  homeResultsColumns,
} from './home-layout';
import { resultGridWidth, resultRowCount } from '../search/results-metrics';
import {
  AVATAR_STEP_MS,
  TRAIL_STEP_MS,
  type HomeBeat,
  beatDelay,
  stepDelay,
} from './home-entrance';

const RESULTS_TOP_ROWS = 1;
import { HeroTrailer, type TrailerState } from './hero-trailer/hero-trailer';
import { SearchField } from './search-field/search-field';
import { SearchResultsGrid } from '../search/search-results-grid/search-results-grid';
import { SearchStore } from '../search/search-store';
import { assignTiers, tierLabelKey, type PopularityTier } from './popularity';
import { PopularityBadge } from './popularity-badge/popularity-badge';
import { RING_CIRCUMFERENCE, RING_RADIUS, advanceProgress, ringOffset } from './slide-timer';

const CAST_LIMIT = 3;

const GENRE_LIMIT = 3;

@Component({
  selector: 'nv-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageGrid,
    DrumCard,
    DotField,
    PopularityBadge,
    HeroTrailer,
    SearchField,
    SearchResultsGrid,
    RouterLink,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnDestroy {
  private readonly tmdb = inject(TmdbService);
  private readonly appReady = inject(AppReadyService);
  private readonly search = inject(SearchStore);
  protected readonly i18n = inject(I18nService);

  protected readonly searching = this.search.active;

  protected readonly entering = this.appReady.revealed;

  protected delay(beat: HomeBeat): string {
    return `${beatDelay(beat)}ms`;
  }

  protected trailDelay(index: number): string {
    return `${stepDelay('badge', index, TRAIL_STEP_MS)}ms`;
  }

  protected avatarDelay(index: number): string {
    return `${stepDelay('carousel', index, AVATAR_STEP_MS)}ms`;
  }

  protected readonly swapSide = signal<'' | 'a' | 'b'>('');

  private lastSwapIndex: number | null = null;

  protected readonly ringRadius = RING_RADIUS;
  protected readonly ringCircumference = RING_CIRCUMFERENCE;

  protected readonly trail = badgeTrail();

  private readonly viewport = signal(readViewport());

  protected readonly rows = computed(() =>
    Math.max(1, Math.ceil(this.viewport().height / readCellSize())),
  );

  protected readonly compact = computed(() => this.viewport().width <= HOME_COMPACT_MAX);

  protected readonly stacked = computed(() => this.viewport().width <= HOME_STACK_MAX);

  protected readonly areas = computed(() => homeAreas(this.rows(), this.compact()));

  private readonly wholeRows = computed(() =>
    Math.max(1, Math.floor(this.viewport().height / readCellSize())),
  );

  protected readonly cardRows = computed(() => resultRowCount(this.wholeRows() - RESULTS_TOP_ROWS));

  private readonly resultsWidth = computed(() =>
    this.searching() && !this.stacked()
      ? resultGridWidth(this.search.slotCount(), this.cardRows())
      : 0,
  );

  protected readonly minColumns = computed(() =>
    Math.max(
      homeMinColumns(this.compact()),
      this.resultsWidth()
        ? homeResultsColumns(this.rows(), this.compact(), this.resultsWidth())
        : 0,
    ),
  );

  protected readonly resultsArea = computed(() =>
    this.stacked()
      ? null
      : toGridArea(homeResultsArea(this.rows(), this.compact(), this.resultsWidth())),
  );

  protected readonly posterNudge = computed(() => (this.stacked() ? null : POSTER_NUDGE));

  protected readonly carouselNudge = computed(() => (this.stacked() ? null : CAROUSEL_NUDGE));

  protected resizeFrame: number | null = null;

  @HostListener('window:resize')
  protected onResize(): void {
    if (this.resizeFrame !== null) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = null;
      this.viewport.set(readViewport());
    });
  }

  protected readonly area = (key: keyof ReturnType<typeof homeAreas>) =>
    this.stacked() ? null : toGridArea(this.areas()[key]);

  private readonly lang = computed(() => this.i18n.lang());

  private readonly nowPlaying = toSignal(
    toObservable(this.lang).pipe(
      switchMap(() => this.tmdb.nowPlaying().pipe(catchError(() => of([])))),
    ),
    { initialValue: [] as MovieSummary[] },
  );

  protected readonly movies = computed(() => this.nowPlaying().slice(0, 12));

  protected readonly index = signal(0);

  protected readonly active = computed<MovieSummary | null>(
    () => this.movies()[this.index()] ?? null,
  );

  private readonly details = toSignal(
    toObservable(computed(() => ({ id: this.active()?.id, lang: this.lang() }))).pipe(
      switchMap(({ id }) => (id ? this.tmdb.movie(id).pipe(catchError(() => of(null))) : of(null))),
    ),
    { initialValue: null as MovieDetails | null },
  );

  protected readonly backdrop = computed(() =>
    this.tmdb.imageUrl(this.active()?.backdrop_path ?? null, 'w1280'),
  );

  protected readonly poster = computed(() =>
    this.tmdb.imageUrl(this.active()?.poster_path ?? null, 'w500'),
  );

  private readonly allGenres = computed(() => this.details()?.genres?.map((g) => g.name) ?? []);

  protected readonly genres = computed(() => this.allGenres().slice(0, GENRE_LIMIT));

  protected readonly extraGenres = computed(() =>
    Math.max(0, this.allGenres().length - GENRE_LIMIT),
  );

  protected readonly cast = computed(
    () => this.details()?.credits?.cast?.slice(0, CAST_LIMIT) ?? [],
  );

  protected readonly score = computed(() => {
    const value = this.active()?.vote_average;
    return value ? value.toFixed(1) : null;
  });

  protected readonly modalLink = computed(() => {
    const id = this.active()?.id;
    return id == null ? null : [{ outlets: { modal: ['movie', id] } }];
  });

  private readonly tiers = computed(() => assignTiers(this.movies()));

  protected readonly tier = computed<PopularityTier>(() => {
    const id = this.active()?.id;
    return (id != null ? this.tiers().get(id) : undefined) ?? 'lowkey';
  });

  protected readonly tierLabel = computed(() => this.i18n.t(tierLabelKey(this.tier())));

  protected avatarUrl(movie: MovieSummary): string | null {
    return this.tmdb.imageUrl(movie.poster_path, 'w185');
  }

  protected prev(): void {
    const total = this.movies().length;
    if (!total) return;
    this.index.update((i) => (i - 1 + total) % total);
  }

  protected next(): void {
    const total = this.movies().length;
    if (!total) return;
    this.index.update((i) => (i + 1) % total);
  }

  protected select(i: number): void {
    this.index.set(i);
  }

  protected readonly strip = computed(() => {
    const list = this.movies();
    if (list.length === 0) return [];

    const at = this.index();
    return [-1, 0, 1].map((offset) => {
      const i = (at + offset + list.length) % list.length;
      return { movie: list[i], index: i, isActive: offset === 0 };
    });
  });

  protected readonly heroHovered = signal(false);
  private readonly trailerState = signal<TrailerState>('idle');

  private readonly trailerEngaged = computed(
    () => this.trailerState() === 'loading' || this.trailerState() === 'playing',
  );

  protected readonly trailerPlaying = computed(() => this.trailerState() === 'playing');

  protected onHeroEnter(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this.heroHovered.set(true);
  }

  protected onHeroLeave(): void {
    this.heroHovered.set(false);
  }

  protected onTrailerState(state: TrailerState): void {
    this.trailerState.set(state);
  }

  protected readonly progress = signal(0);

  protected readonly ringDashOffset = computed(() => ringOffset(this.progress()));

  private readonly hovering = signal(false);

  private frame: number | null = null;
  private lastFrameAt = 0;

  constructor() {
    effect(() => {
      const index = this.index();

      untracked(() => {
        if (this.lastSwapIndex !== null && index !== this.lastSwapIndex) {
          this.swapSide.set(this.swapSide() === 'a' ? 'b' : 'a');
        }
        this.lastSwapIndex = index;
      });
    });

    effect(() => {
      const arrived = this.nowPlaying();

      untracked(() => {
        if (arrived.length) this.appReady.markReady();
      });
    });

    effect(() => {
      this.index();
      this.progress.set(0);
      this.lastFrameAt = 0;
    });

    effect(() => {
      const canRun =
        this.movies().length > 1 &&
        !this.searching() &&
        !this.hovering() &&
        !this.trailerEngaged() &&
        !prefersReducedMotion();

      if (canRun) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    if (this.resizeFrame !== null) cancelAnimationFrame(this.resizeFrame);
  }

  protected pause(): void {
    this.hovering.set(true);
  }

  protected resume(): void {
    this.hovering.set(false);
  }

  private startTimer(): void {
    if (this.frame !== null) return;
    this.lastFrameAt = 0;

    const step = (now: number) => {
      const elapsed = this.lastFrameAt ? now - this.lastFrameAt : 0;
      this.lastFrameAt = now;

      const next = advanceProgress(this.progress(), elapsed);

      if (next >= 1) {
        this.frame = null;
        this.next();
        return;
      }

      this.progress.set(next);
      this.frame = requestAnimationFrame(step);
    };

    this.frame = requestAnimationFrame(step);
  }

  private stopTimer(): void {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
    this.lastFrameAt = 0;
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}
