import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import type { UserCollection } from '../../core/models/user-collection.models';
import {
  PageGrid,
  readCellSize,
  readViewport,
  toGridArea,
} from '../../layout/page-grid/page-grid';
import { DrumCard } from '../../shared/drum-card/drum-card';
import { DotField } from '../home/dot-field/dot-field';
import { HOME_STACK_MAX } from '../home/home-layout';
import { CollectionCard } from './collection-card/collection-card';
import { CollectionCreateService } from './collection-create.service';
import { CollectionViewService } from './collection-view.service';
import { CollectionsService } from './collections.service';
import { filterByName } from './collection-filter';
import {
  LEFT_COLS,
  PAGE_START_COL,
  PANE_GAP,
  collectionsLayout,
} from './collections-layout';

/**
 * The collections page: a headline block, and a field of collections beside it.
 *
 * Built like the home page rather than like a list. The blurb and the filter hold the left of the
 * lattice while the collections scatter across the right, staggered so the row of equal squares
 * reads as a field rather than a table.
 *
 * Opening one is a pop-up, not a page. The value of this arrangement is having every collection in
 * view at once; sending someone away to look inside one and back to look inside the next would turn
 * browsing into a series of loads.
 */
@Component({
  selector: 'nv-collections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageGrid, DrumCard, DotField, CollectionCard],
  templateUrl: './collections.html',
  styleUrl: './collections.scss',
})
export class Collections {
  protected readonly i18n = inject(I18nService);
  private readonly collections = inject(CollectionsService);
  private readonly form = inject(CollectionCreateService);
  private readonly view = inject(CollectionViewService);

  protected readonly list = this.collections.recent;

  protected readonly isEmpty = this.collections.isEmpty;

  /** What has been typed into the filter. */
  protected readonly query = signal('');

  /** The cards on show: everything, or what matches the filter. */
  protected readonly shown = computed(() =>
    filterByName(this.list(), this.query()),
  );

  protected readonly noMatch = computed(
    () => !this.isEmpty() && this.shown().length === 0,
  );

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected clearQuery(): void {
    this.query.set('');
  }

  /** A dialog rather than a page: two fields don't warrant leaving this one. */
  protected createNew(): void {
    this.form.openDialog();
  }

  protected openCollection(collection: UserCollection): void {
    this.view.open(collection.id);
  }

  // -------------------------------------------------------------------- layout

  private readonly viewport = signal(readViewport());

  /**
   * Whole drum rows, floored.
   *
   * The pad field rounds up so it covers a partial row; content cannot, or it is placed past the
   * bottom edge and the last row of cards is cut.
   */
  private readonly rows = computed(() =>
    Math.max(1, Math.floor(this.viewport().height / readCellSize())),
  );

  protected readonly stacked = computed(
    () => this.viewport().width <= HOME_STACK_MAX,
  );

  private readonly layout = computed(() =>
    collectionsLayout(this.rows(), this.shown().length),
  );

  /** How far the card at this position drops, in drums. */
  protected drop(index: number): number {
    return this.layout().drops[index] ?? 0;
  }

  protected readonly minColumns = computed(() =>
    this.stacked() ? 18 : this.layout().totalCols,
  );

  /** The headline block, five drums of it, centred with the filter as one composition. */
  protected readonly captionArea = computed(() => {
    if (this.stacked()) return null;

    const { captionRow, captionRowEnd } = this.layout();

    return toGridArea({
      row: captionRow,
      rowEnd: captionRowEnd,
      col: PAGE_START_COL,
      colEnd: PAGE_START_COL + LEFT_COLS,
    });
  });

  /**
   * The filter, its own block so it begins on a seam.
   *
   * Six drums wide rather than the caption's nine: it holds a few words, and a field the width of
   * the headline reads as a search bar for the page rather than a way to narrow a short list.
   */
  protected readonly findArea = computed(() => {
    if (this.stacked()) return null;

    const { findRow, findRowEnd } = this.layout();

    return toGridArea({
      row: findRow,
      rowEnd: findRowEnd,
      col: PAGE_START_COL,
      colEnd: PAGE_START_COL + 6,
    });
  });

  /** The card field, exactly as tall as the arrangement and centred by the layout. */
  protected readonly fieldArea = computed(() => {
    if (this.stacked()) return null;

    const { bandRow, bandRowEnd, totalCols } = this.layout();

    return toGridArea({
      row: bandRow,
      rowEnd: bandRowEnd,
      col: PAGE_START_COL + LEFT_COLS + PANE_GAP,
      colEnd: totalCols,
    });
  });

  private resizeFrame: number | null = null;

  @HostListener('window:resize')
  protected onResize(): void {
    if (this.resizeFrame !== null) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = null;
      this.viewport.set(readViewport());
    });
  }
}
