import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import type { UserCollection } from '../../../core/models/user-collection.models';
import { DrumCard } from '../../../shared/drum-card/drum-card';

/** Posters shown in the mosaic. Four fills a tidy square without becoming a contact sheet. */
const MOSAIC_SIZE = 4;

/**
 * One collection, as a card on the lattice.
 *
 * Shows a mosaic of the first few posters rather than a count alone: a collection is
 * recognised by what is in it, and four thumbnails say more than "12 films" does.
 */
@Component({
  selector: 'nv-collection-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DrumCard, RouterLink],
  templateUrl: './collection-card.html',
  styleUrl: './collection-card.scss',
})
export class CollectionCard {
  private readonly tmdb = inject(TmdbService);
  protected readonly i18n = inject(I18nService);

  readonly collection = input.required<UserCollection>();

  protected readonly items = computed(() => this.collection().items);

  /**
   * Poster paths for the mosaic, most recently added first.
   *
   * Reversed because the newest additions are what someone is most likely to be looking
   * for — a collection built up over time would otherwise always show the same four.
   */
  protected readonly posters = computed(() =>
    [...this.items()]
      .reverse()
      .filter((item) => item.posterPath)
      .slice(0, MOSAIC_SIZE)
      .map((item) => this.tmdb.imageUrl(item.posterPath, 'w185')),
  );

  protected readonly total = computed(() => this.items().length);
}
