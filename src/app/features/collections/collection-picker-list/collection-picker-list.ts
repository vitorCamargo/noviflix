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

  readonly movies = input<readonly MovieSummary[]>([]);

  readonly done = output<void>();

  private readonly search = viewChild<ElementRef<HTMLInputElement>>('search');

  protected readonly query = signal('');

  protected readonly matches = computed(() =>
    filterByName(this.collections.recent(), this.query()),
  );

  protected readonly hasAny = computed(() => this.collections.count() > 0);

  focusSearch(): void {
    this.search()?.nativeElement.focus();
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

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
