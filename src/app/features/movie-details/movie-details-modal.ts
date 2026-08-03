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

  protected readonly rating = signal(false);

  protected toggleRating(): void {
    this.rating.update((open) => !open);
  }

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

  protected readonly related = computed(() => this.movie()?.recommendations?.results ?? []);

  protected readonly fullPageUrl = computed(() => `/movie/${this.id()}`);

  constructor() {
    effect(() => {
      this.numericId();
      this.tab.set('facts');
      this.rating.set(false);
    });
  }

  protected select(tab: Tab): void {
    this.tab.set(tab);
  }

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
