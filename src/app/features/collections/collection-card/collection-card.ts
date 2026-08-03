import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import type { UserCollection } from '../../../core/models/user-collection.models';
import { DrumCard } from '../../../shared/drum-card/drum-card';

const MOSAIC_SIZE = 4;

@Component({
  selector: 'nv-collection-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DrumCard],
  templateUrl: './collection-card.html',
  styleUrl: './collection-card.scss',
})
export class CollectionCard {
  private readonly tmdb = inject(TmdbService);
  protected readonly i18n = inject(I18nService);

  readonly collection = input.required<UserCollection>();

  readonly index = input(0);

  readonly open = output<void>();

  protected readonly total = computed(() => this.collection().items.length);

  protected readonly covers = computed(() =>
    [...this.collection().items]
      .reverse()
      .filter((item) => item.posterPath)
      .slice(0, MOSAIC_SIZE)
      .map((item) => this.tmdb.imageUrl(item.posterPath, 'w342'))
      .filter((src): src is string => src !== null),
  );
}
