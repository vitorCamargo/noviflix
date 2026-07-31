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

/**
 * The frame around the add-to-collection list.
 *
 * Always centred. There was an anchored variant that opened beside a per-card button, but selection
 * is the single way films are gathered now, and a selection has no one place on screen it came from
 * — so a menu attached to a card would be pointing at something that is no longer the subject.
 *
 * Rendered once at the app root: it is opened from the selection bar and from a film's own pop-up,
 * and a copy per call site would let two open at once.
 */
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

  /** Posters of the films being added, as a reminder of what this will do. */
  protected readonly posters = computed(() =>
    this.pending()
      .slice(0, 5)
      .map((movie) => this.tmdb.imageUrl(movie.poster_path, 'w185'))
      .filter((src): src is string => src !== null),
  );

  constructor() {
    /*
     * Focus goes to the filter on open.
     *
     * The list is the point, but typing is how a long one gets used — and landing focus inside the
     * panel is also what lets Escape and Tab behave as they should.
     */
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

  /** Dismissed because the films landed, so the marks go with it. */
  protected finish(): void {
    this.picker.finish();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.close();
  }
}
