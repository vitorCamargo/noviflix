import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import type { MovieSummary } from '../../../core/models/tmdb.models';
import { DrumCard } from '../../../shared/drum-card/drum-card';
import { CollectionPickerService } from '../../collections/collection-picker.service';

@Component({
  selector: 'nv-movie-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DrumCard],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.scss',
})
export class MovieCard {
  private readonly tmdb = inject(TmdbService);
  private readonly picker = inject(CollectionPickerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);

  readonly movie = input.required<MovieSummary>();

  protected readonly selected = computed(() => this.picker.isSelected(this.movie().id));

  protected toggleSelect(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.picker.toggle(this.movie());
  }

  protected readonly poster = computed(() => this.tmdb.imageUrl(this.movie().poster_path, 'w342'));

  protected readonly score = computed(() => {
    const value = this.movie().vote_average;
    if (!value) return null;
    return value.toFixed(1);
  });

  protected readonly year = computed(() => {
    const date = this.movie().release_date;
    return date ? date.slice(0, 4) : null;
  });

  private readonly modalTree = computed(() =>
    this.router.createUrlTree([{ outlets: { modal: ['movie', this.movie().id] } }], {
      relativeTo: this.route.root,
    }),
  );

  protected readonly modalHref = computed(() => this.router.serializeUrl(this.modalTree()));

  protected openDetails(event: MouseEvent): void {
    event.stopPropagation();

    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;

    event.preventDefault();
    void this.router.navigateByUrl(this.modalTree());
  }
}
