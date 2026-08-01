import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import type { UserCollection } from '../../../core/models/user-collection.models';
import { DrumCard } from '../../../shared/drum-card/drum-card';

/** Covers shown in the mosaic. Four fills a tidy square without becoming a contact sheet. */
const MOSAIC_SIZE = 4;

/**
 * One collection, as a square of covers on the lattice.
 *
 * Shows what is inside rather than a count alone: a collection is recognised by its films, and four
 * posters say more than "12 films" does. The name sits over the foot of the mosaic, so the covers
 * keep the whole square.
 */
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

  /** Position in the field, shown as a rank the way the reference does. */
  readonly index = input(0);

  readonly open = output<void>();

  protected readonly total = computed(() => this.collection().items.length);

  /**
   * Cover paths, most recently added first.
   *
   * Reversed because the newest additions are what someone is most likely looking for — a
   * collection built up over time would otherwise always show the same four.
   */
  protected readonly covers = computed(() =>
    [...this.collection().items]
      .reverse()
      .filter((item) => item.posterPath)
      .slice(0, MOSAIC_SIZE)
      .map((item) => this.tmdb.imageUrl(item.posterPath, 'w342'))
      .filter((src): src is string => src !== null),
  );
}
