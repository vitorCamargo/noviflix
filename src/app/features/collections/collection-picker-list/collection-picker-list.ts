import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { MovieSummary } from '../../../core/models/tmdb.models';
import type { UserCollection } from '../../../core/models/user-collection.models';
import { ToastService } from '../../../shared/toast/toast.service';
import { CollectionsService } from '../collections.service';
import { countPresent } from '../collection-store';
import { filterByName } from '../collection-filter';

/**
 * The contents of the add-to-collection panel: a filter, a create row, then the collections.
 *
 * Its own component because two places show the same list — a selection of films, and a single film
 * from its own details pop-up. The frame differs; the list does not.
 */
@Component({
  selector: 'nv-collection-picker-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './collection-picker-list.html',
  styleUrl: './collection-picker-list.scss',
})
export class CollectionPickerList {
  protected readonly i18n = inject(I18nService);
  private readonly collections = inject(CollectionsService);
  private readonly toast = inject(ToastService);

  /** Films this menu will place. */
  readonly movies = input<readonly MovieSummary[]>([]);

  /** Raised once something has been added, so the frame can dismiss itself. */
  readonly done = output<void>();

  private readonly search = viewChild<ElementRef<HTMLInputElement>>('search');

  protected readonly query = signal('');

  protected readonly matches = computed(() =>
    filterByName(this.collections.recent(), this.query()),
  );

  protected readonly hasAny = computed(() => this.collections.count() > 0);

  /** Focused by the frame once it has rendered, so typing narrows a long list straight away. */
  focusSearch(): void {
    this.search()?.nativeElement.focus();
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  /**
   * How many of these films the collection already holds.
   *
   * Shown per row so the result is never a surprise: adding four films to a collection holding
   * three of them would otherwise report "1 added" with no explanation.
   */
  protected present(collection: UserCollection): number {
    return countPresent(collection, this.movies());
  }

  protected addTo(collection: UserCollection): void {
    const added = this.collections.addTo(collection.id, this.movies());

    this.toast.show(
      added
        ? this.i18n.t('collections.addedCount', {
            count: added,
            name: collection.name,
          })
        : this.i18n.t('collections.addedNone', { name: collection.name }),
    );

    this.done.emit();
  }

  /**
   * Creates a collection and drops the films in, without asking for a name.
   *
   * One press, as the menu implies. The generated name is reported in the toast so it is not a
   * mystery where the film went.
   */
  protected createNew(): void {
    const { collection, added } = this.collections.createFor(
      this.movies(),
      this.i18n.t('collections.generatedName'),
      this.i18n.t('collections.generatedDescription'),
    );

    this.toast.show(
      this.i18n.t('collections.createdWith', {
        name: collection.name,
        count: added,
      }),
    );

    this.done.emit();
  }
}
