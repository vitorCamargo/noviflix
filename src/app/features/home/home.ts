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
  HOME_MIN_COLUMNS,
  POSTER_NUDGE,
  homeAreas,
} from './home-layout';
import { newestReleaseId, popularityTier, scoreLabel } from './popularity';
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
  imports: [PageGrid, DrumCard, DotField],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnDestroy {
  private readonly tmdb = inject(TmdbService);
  protected readonly i18n = inject(I18nService);

  protected readonly ringRadius = RING_RADIUS;
  protected readonly ringCircumference = RING_CIRCUMFERENCE;

  /** Static geometry — built once, never recomputed. */
  protected readonly trail = badgeTrail();
  protected readonly posterNudge = POSTER_NUDGE;
  protected readonly carouselNudge = CAROUSEL_NUDGE;

  protected readonly minColumns = HOME_MIN_COLUMNS;

  /**
   * Row count is derived here rather than read back off the grid: the grid's
   * pad-fill needs `areas`, and `areas` needs the row count, so taking it from
   * the child would be circular. Both sides compute it from the same viewport
   * and cell size, so they agree.
   */
  private readonly viewportHeight = signal(readViewport().height);

  protected readonly rows = computed(() =>
    Math.max(1, Math.ceil(this.viewportHeight() / readCellSize())),
  );

  protected readonly areas = computed(() => homeAreas(this.rows()));

  protected resizeFrame: number | null = null;

  @HostListener('window:resize')
  protected onResize(): void {
    if (this.resizeFrame !== null) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = null;
      this.viewportHeight.set(readViewport().height);
    });
  }

  protected readonly area = (key: keyof ReturnType<typeof homeAreas>) =>
    toGridArea(this.areas()[key]);

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

  /** Recomputed per batch, so "newest" means newest of what's on offer. */
  private readonly newestId = computed(() => newestReleaseId(this.movies()));

  protected readonly tierLabel = computed(() => {
    const movie = this.active();
    const tier = popularityTier(
      movie?.popularity,
      movie != null && movie.id === this.newestId(),
    );

    const keys = {
      blazing: 'home.tier.blazing',
      lowkey: 'home.tier.lowkey',
      wellKnown: 'home.tier.wellKnown',
      trending: 'home.tier.trending',
    } as const;
    return this.i18n.t(keys[tier]);
  });

  protected readonly score = computed(() =>
    this.active() ? scoreLabel(this.active()!) : null,
  );

  protected readonly voteCount = computed(() =>
    this.i18n.formatNumber(this.active()?.vote_count ?? 0),
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
      const canRun =
        this.movies().length > 1 && !this.hovering() && !prefersReducedMotion();

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
