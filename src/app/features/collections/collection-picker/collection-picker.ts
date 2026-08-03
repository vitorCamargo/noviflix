import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import { CollectionPickerService } from '../collection-picker.service';
import { CollectionPickerList } from '../collection-picker-list/collection-picker-list';

@Component({
  selector: 'nv-collection-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CollectionPickerList],
  templateUrl: './collection-picker.html',
  styleUrl: './collection-picker.scss',
})
export class CollectionPicker {
  protected readonly i18n = inject(I18nService);
  private readonly picker = inject(CollectionPickerService);
  private readonly tmdb = inject(TmdbService);

  protected readonly open = this.picker.open;
  protected readonly pending = this.picker.pending;

  private readonly list = viewChild<CollectionPickerList>('list');

  protected readonly total = computed(() => this.pending().length);

  protected readonly posters = computed(() =>
    this.pending()
      .slice(0, 5)
      .map((movie) => this.tmdb.imageUrl(movie.poster_path, 'w185'))
      .filter((src): src is string => src !== null),
  );

  constructor() {
    effect(() => {
      const isOpen = this.open();

      untracked(() => {
        if (isOpen) queueMicrotask(() => this.list()?.focusSearch());
      });
    });
  }

  protected close(): void {
    this.picker.close();
  }

  protected finish(): void {
    this.picker.finish();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.close();
  }
}
