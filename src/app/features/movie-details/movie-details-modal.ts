import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { I18nService } from '../../core/i18n/i18n.service';
import { TmdbService } from '../../core/tmdb/tmdb.service';
import { OverlayPanel } from '../../shared/overlay-panel/overlay-panel';
import { CastGrid } from './cast-grid/cast-grid';
import { MovieFacts } from './movie-facts/movie-facts';
import { RatingForm } from './rating-form/rating-form';
import { RelatedGrid } from './related-grid/related-grid';
import { createMovieResult } from './movie-request';
import { releaseYear } from './movie-format';
import { CollectionPickerService } from '../collections/collection-picker.service';

type Tab = 'facts' | 'cast' | 'related';

/**
 * Details as an overlay, driven by the named `modal` route outlet.
 *
 * The layout is composed here rather than inside a child component, because it is
 * built from OverlayPanel's own slots — a toolbar, filters in the top bar, an aside
 * and a body. Content projection only selects direct children, so a wrapper
 * component's markup would land in the body and leave the aside empty.
 *
 * Tabs rather than one long column: the overlay has a fixed height, so stacked, the
 * cast and related films would sit below a fold that gives no hint they exist.
 * Everything they show arrives with the record, so switching costs no request.
 */
@Component({
  selector: 'nv-movie-details-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OverlayPanel, MovieFacts, CastGrid, RelatedGrid, RatingForm],
  templateUrl: './movie-details-modal.html',
  styleUrl: './movie-details-modal.scss',
})
export class MovieDetailsModal {
  private readonly tmdb = inject(TmdbService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly picker = inject(CollectionPickerService);
  protected readonly i18n = inject(I18nService);

  private readonly params = toSignal(this.route.paramMap, { initialValue: null });

  protected readonly id = computed(() => this.params()?.get('id') ?? '');

  /**
   * The id as a number, or null when the URL carries something that isn't one.
   *
   * Route params are strings and this one comes from the address bar, so it can be
   * anything — passing a non-numeric id to the API would produce a confusing failure
   * rather than the plain "not found" the panel can show.
   */
  protected readonly numericId = computed(() => {
    const raw = Number(this.id());
    return Number.isInteger(raw) && raw > 0 ? raw : null;
  });

  private readonly result = createMovieResult(this.numericId);

  protected readonly movie = computed(() => this.result().movie);
  protected readonly failed = computed(() => this.result().failed);

  protected readonly loading = computed(
    () => this.numericId() != null && !this.movie() && !this.failed(),
  );

  protected readonly tab = signal<Tab>('facts');

  /** Whether the left column is showing the rating form instead of the film. */
  protected readonly rating = signal(false);

  protected toggleRating(): void {
    this.rating.update((open) => !open);
  }

  /**
   * Opens the picker for this film alone.
   *
   * Deliberately not the current selection: someone looking at one film's details means that
   * film, and quietly sweeping up whatever is still marked on the results grid behind the
   * overlay would add things they had stopped thinking about.
   */
  protected addToCollection(): void {
    const film = this.movie();
    if (film) this.picker.openFor(film);
  }

  protected readonly tabs = [
    { id: 'facts' as const, key: 'movie.tab.facts' as const },
    { id: 'cast' as const, key: 'movie.tab.cast' as const },
    { id: 'related' as const, key: 'movie.tab.related' as const },
  ];

  protected readonly poster = computed(() =>
    this.tmdb.imageUrl(this.movie()?.poster_path ?? null, 'w500'),
  );

  protected readonly year = computed(() => releaseYear(this.movie()));

  protected readonly genres = computed(
    () => this.movie()?.genres?.map((genre) => genre.name) ?? [],
  );

  protected readonly overview = computed(() => this.movie()?.overview?.trim() || null);

  protected readonly cast = computed(() => this.movie()?.credits?.cast ?? []);

  protected readonly related = computed(
    () => this.movie()?.recommendations?.results ?? [],
  );

  /** Plain URL, so the anchor behaves like one for middle-click and new tabs. */
  protected readonly fullPageUrl = computed(() => `/movie/${this.id()}`);

  constructor() {
    // A different film starts on the first tab. Keeping the previous one would open
    // some films on a cast list and others on their figures, for no reason the viewer
    // could see.
    effect(() => {
      this.numericId();
      this.tab.set('facts');
      // Also closes the rating form: it belongs to the film that was open, and
      // leaving it up would offer to rate one film with another's name above it.
      this.rating.set(false);
    });
  }

  protected select(tab: Tab): void {
    this.tab.set(tab);
  }

  /**
   * Navigates to the full page, discarding the whole current URL.
   *
   * This can't be a routerLink. Commands resolve against the route the link lives in,
   * and that route *is* the modal outlet — so even an outlets object was applied
   * inside it, producing `(modal:movie/1/movie/1)` and no navigation the router
   * recognised. navigateByUrl replaces the entire tree, which drops the modal segment
   * for free.
   *
   * Modifier clicks are left alone so the browser can still open a new tab.
   */
  protected openFull(event: MouseEvent): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    event.preventDefault();
    void this.router.navigateByUrl(this.fullPageUrl());
  }

  protected close(): void {
    void this.router.navigate([{ outlets: { modal: null } }]);
  }
}
