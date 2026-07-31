import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { TmdbService } from '../../core/tmdb/tmdb.service';
import type { MovieDetails, MovieSummary } from '../../core/models/tmdb.models';
import {
  PageGrid,
  readCellSize,
  readViewport,
  toGridArea,
} from '../../layout/page-grid/page-grid';
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

/** Drum rows the results grid gives up at the top, for the floating header. */
const RESULTS_TOP_ROWS = 1;
import { HeroTrailer, type TrailerState } from './hero-trailer/hero-trailer';
import { SearchField } from './search-field/search-field';
import { SearchResultsGrid } from '../search/search-results-grid/search-results-grid';
import { SearchStore } from '../search/search-store';
import { assignTiers, tierLabelKey, type PopularityTier } from './popularity';
import { PopularityBadge } from './popularity-badge/popularity-badge';
import {
  RING_CIRCUMFERENCE,
  RING_RADIUS,
  advanceProgress,
  ringOffset,
} from './slide-timer';

/** How many cast members the poster card lists. */
const CAST_LIMIT = 3;

/** Genre chips shown before the rest collapse into a `+N`. */
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
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnDestroy {
  private readonly tmdb = inject(TmdbService);
  private readonly search = inject(SearchStore);
  protected readonly i18n = inject(I18nService);

  /** Results replace the featured composition while a search is running. */
  protected readonly searching = this.search.active;

  protected readonly ringRadius = RING_RADIUS;
  protected readonly ringCircumference = RING_CIRCUMFERENCE;

  /** Static geometry — built once, never recomputed. */
  protected readonly trail = badgeTrail();

  /**
   * Row count is derived here rather than read back off the grid: the grid's
   * pad-fill needs `areas`, and `areas` needs the row count, so taking it from
   * the child would be circular. Both sides compute it from the same viewport
   * and cell size, so they agree.
   */
  private readonly viewport = signal(readViewport());

  protected readonly rows = computed(() =>
    Math.max(1, Math.ceil(this.viewport().height / readCellSize())),
  );

  /** Narrow enough that the full-width arrangement leaves a dead gap. */
  protected readonly compact = computed(
    () => this.viewport().width <= HOME_COMPACT_MAX,
  );

  /** Narrow enough to give up the composition for a vertical stack. */
  protected readonly stacked = computed(
    () => this.viewport().width <= HOME_STACK_MAX,
  );

  protected readonly areas = computed(() =>
    homeAreas(this.rows(), this.compact()),
  );

  /**
   * Card rows the results grid gets, from the height actually available.
   *
   * Computed here rather than in the grid because the page needs the same number
   * to work out how wide it has to be — the grid flows in columns, so its width
   * depends on how many cards each column holds.
   */
  protected readonly cardRows = computed(() =>
    resultRowCount(this.rows() - RESULTS_TOP_ROWS),
  );

  /** Width of the results grid in drums, zero when it isn't showing. */
  private readonly resultsWidth = computed(() =>
    this.searching() && !this.stacked()
      ? resultGridWidth(this.search.slotCount(), this.cardRows())
      : 0,
  );

  /**
   * The page spans whichever is wider: the featured composition, or the results.
   *
   * This is what makes the track scrollable. Without it the page stays viewport
   * width, and since it clips horizontal overflow, every card past the first screen
   * exists but cannot be reached.
   */
  protected readonly minColumns = computed(() =>
    Math.max(
      homeMinColumns(this.compact()),
      this.resultsWidth()
        ? homeResultsColumns(this.rows(), this.compact(), this.resultsWidth())
        : 0,
    ),
  );

  /**
   * Full-height slot for the results grid, kept apart from `areas` because it is
   * viewport-sized rather than part of the centred composition.
   */
  protected readonly resultsArea = computed(() =>
    this.stacked()
      ? null
      : toGridArea(
          homeResultsArea(this.rows(), this.compact(), this.resultsWidth()),
        ),
  );

  /*
   * The half-drum nudges have to be cleared here rather than in the stylesheet.
   * They are bound as inline styles, which outrank any rule in a media query, so
   * a `translate: none` in the mobile block was silently losing — which is why
   * the poster still overlapped the hero when stacked.
   */
  protected readonly posterNudge = computed(() =>
    this.stacked() ? null : POSTER_NUDGE,
  );

  protected readonly carouselNudge = computed(() =>
    this.stacked() ? null : CAROUSEL_NUDGE,
  );

  protected resizeFrame: number | null = null;

  @HostListener('window:resize')
  protected onResize(): void {
    if (this.resizeFrame !== null) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = null;
      this.viewport.set(readViewport());
    });
  }

  /**
   * Drum placement, or nothing at all when stacked.
   *
   * Returning null there matters: `grid-area` is bound inline, and an inline
   * style outranks any rule in a media query — so leaving these in place would
   * pin blocks to desktop drum coordinates inside the stacked two-column grid.
   */
  protected readonly area = (key: keyof ReturnType<typeof homeAreas>) =>
    this.stacked() ? null : toGridArea(this.areas()[key]);

  // ------------------------------------------------------------------- data

  /** Language is part of the key so switching locale refetches translated copy. */
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

  /**
   * Details are fetched only for the movie on screen. The list endpoint gives
   * genre *ids* and no cast, so the visible card needs a second call — but
   * doing it for all twelve up front would be a dozen requests for one card.
   */
  private readonly details = toSignal(
    toObservable(computed(() => ({ id: this.active()?.id, lang: this.lang() }))).pipe(
      switchMap(({ id }) =>
        id
          ? this.tmdb.movie(id).pipe(catchError(() => of(null)))
          : of(null),
      ),
    ),
    { initialValue: null as MovieDetails | null },
  );

  // ---------------------------------------------------------------- display

  protected readonly backdrop = computed(() =>
    this.tmdb.imageUrl(this.active()?.backdrop_path ?? null, 'w1280'),
  );

  protected readonly poster = computed(() =>
    this.tmdb.imageUrl(this.active()?.poster_path ?? null, 'w500'),
  );

  private readonly allGenres = computed(
    () => this.details()?.genres?.map((g) => g.name) ?? [],
  );

  protected readonly genres = computed(() => this.allGenres().slice(0, GENRE_LIMIT));

  /**
   * Genres beyond the visible ones, surfaced as a `+N` chip.
   *
   * Truncating silently would misrepresent the film — a `+2` says there is more
   * without letting the row grow past the card.
   */
  protected readonly extraGenres = computed(() =>
    Math.max(0, this.allGenres().length - GENRE_LIMIT),
  );

  protected readonly cast = computed(
    () => this.details()?.credits?.cast?.slice(0, CAST_LIMIT) ?? [],
  );

  /**
   * Tiers are assigned per batch, not per movie: attention is measured against
   * the other films on offer, so the set is the unit of comparison.
   */
  private readonly tiers = computed(() => assignTiers(this.movies()));

  protected readonly tier = computed<PopularityTier>(() => {
    const id = this.active()?.id;
    return (id != null ? this.tiers().get(id) : undefined) ?? 'lowkey';
  });

  protected readonly tierLabel = computed(() =>
    this.i18n.t(tierLabelKey(this.tier())),
  );

  protected avatarUrl(movie: MovieSummary): string | null {
    return this.tmdb.imageUrl(movie.poster_path, 'w185');
  }

  // ------------------------------------------------------------- navigation

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

  /** Three avatars centred on the active one, wrapping at both ends. */
  protected readonly strip = computed(() => {
    const list = this.movies();
    if (list.length === 0) return [];

    const at = this.index();
    return [-1, 0, 1].map((offset) => {
      const i = (at + offset + list.length) % list.length;
      return { movie: list[i], index: i, isActive: offset === 0 };
    });
  });

  // ---------------------------------------------------------------- trailer

  protected readonly heroHovered = signal(false);
  private readonly trailerState = signal<TrailerState>('idle');

  /** Loading counts as engaged: playback is imminent, so hold the carousel. */
  private readonly trailerEngaged = computed(
    () => this.trailerState() === 'loading' || this.trailerState() === 'playing',
  );

  /**
   * Drives clearing the title and chips off the card while the trailer runs.
   *
   * Only once playback has actually begun — hiding them during `loading` would
   * blank the card for the length of the fetch and read as a glitch.
   */
  protected readonly trailerPlaying = computed(
    () => this.trailerState() === 'playing',
  );

  protected onHeroEnter(event: PointerEvent): void {
    // Touch has no hover; there the button is the only way in.
    if (event.pointerType !== 'mouse') return;
    this.heroHovered.set(true);
  }

  protected onHeroLeave(): void {
    this.heroHovered.set(false);
  }

  protected onTrailerState(state: TrailerState): void {
    this.trailerState.set(state);
  }

  // ------------------------------------------------------------ slide timer

  /** 0 → 1 across one slide's dwell time. Drives the ring around the avatar. */
  protected readonly progress = signal(0);

  protected readonly ringDashOffset = computed(() => ringOffset(this.progress()));

  /** Hovering the strip holds the current movie so it can be studied. */
  private readonly hovering = signal(false);

  private frame: number | null = null;
  private lastFrameAt = 0;

  constructor() {
    // Restart the countdown whenever the movie changes, however it changed —
    // clicking an avatar shouldn't leave a half-elapsed ring behind.
    effect(() => {
      this.index();
      this.progress.set(0);
      this.lastFrameAt = 0;
    });

    effect(() => {
      /*
       * Held while a trailer is engaged as well as while the strip is hovered.
       * Advancing the carousel out from under a playing trailer would discard
       * something the viewer explicitly asked to watch.
       */
      const canRun =
        this.movies().length > 1 &&
        // Nothing to advance while the results are showing — the carousel it
        // drives isn't on screen.
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
      // First frame after a pause establishes the baseline; counting from a
      // stale timestamp would jump the ring forward by the paused duration.
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

/**
 * Auto-advancing carousels are a WCAG 2.2.2 concern, so motion-sensitive users
 * get a static one they drive themselves.
 */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}
