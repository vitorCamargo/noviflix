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

/** Posters in the thumbnail. Four fills a tidy square without becoming a contact sheet. */
const MOSAIC_SIZE = 4;

/**
 * One collection, as a row in the list beside the films.
 *
 * A row rather than the tile it used to be: the list is now a column of choices next to what the
 * choice reveals, so each entry needs a name and a size more than it needs a poster the size of a
 * film. The thumbnail stays because a collection is recognised by what is in it.
 */
@Component({
  selector: 'nv-collection-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './collection-row.html',
  styleUrl: './collection-row.scss',
})
export class CollectionRow {
  private readonly tmdb = inject(TmdbService);
  protected readonly i18n = inject(I18nService);

  readonly collection = input.required<UserCollection>();

  /** Whether this is the collection whose films are on show. */
  readonly current = input(false);

  readonly choose = output<void>();

  protected readonly total = computed(() => this.collection().items.length);

  /**
   * Poster paths for the thumbnail, most recently added first.
   *
   * Reversed because the newest additions are what someone is most likely looking for — a
   * collection built up over time would otherwise always show the same four.
   */
  protected readonly posters = computed(() =>
    [...this.collection().items]
      .reverse()
      .filter((item) => item.posterPath)
      .slice(0, MOSAIC_SIZE)
      .map((item) => this.tmdb.imageUrl(item.posterPath, 'w185'))
      .filter((src): src is string => src !== null),
  );
}
