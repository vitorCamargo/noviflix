import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  PageGrid,
  readCellSize,
  readViewport,
  toGridArea,
} from '../../layout/page-grid/page-grid';
import { HOME_STACK_MAX } from '../home/home-layout';
import { resultGridWidth, resultRowCount } from '../search/results-metrics';
import { CollectionCard } from './collection-card/collection-card';
import { CollectionCreateService } from './collection-create.service';
import { CollectionsService } from './collections.service';

/** Drum rows above the grid: one clearing the header, one for the heading band. */
const TOP_ROWS = 3;

/** First column, matching the gutter every other page starts at. */
const START_COL = 3;

/**
 * The collections page.
 *
 * Follows the same two layouts as the rest of the app: on desktop the tiles flow in columns
 * and the track scrolls sideways to them, with the page declaring its own width so nothing
 * lands past the clip. Below the stacking breakpoint it becomes an ordinary vertical grid.
 *
 * The create tile counts as a tile for sizing. It is always present, so a visitor with no
 * collections still has something to reach for rather than a heading over an empty screen.
 */
@Component({
  selector: 'nv-collections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageGrid, CollectionCard],
  templateUrl: './collections.html',
  styleUrl: './collections.scss',
})
export class Collections {
  protected readonly i18n = inject(I18nService);
  private readonly collections = inject(CollectionsService);
  private readonly dialog = inject(CollectionCreateService);

  protected readonly list = this.collections.recent;

  /** A dialog rather than a page: two fields don't warrant leaving this one. */
  protected createNew(): void {
    this.dialog.openDialog();
  }
  protected readonly isEmpty = this.collections.isEmpty;

  private readonly viewport = signal(readViewport());

  /**
   * Whole drum rows, floored.
   *
   * The pad field rounds up so it covers a partial row; content cannot, or it is placed past
   * the bottom edge and the last row of tiles is cut.
   */
  private readonly rows = computed(() =>
    Math.max(1, Math.floor(this.viewport().height / readCellSize())),
  );

  protected readonly stacked = computed(
    () => this.viewport().width <= HOME_STACK_MAX,
  );

  protected readonly cardRows = computed(() =>
    resultRowCount(this.rows() - TOP_ROWS),
  );

  /** Tiles to size for: the collections plus the one that makes a new one. */
  private readonly tiles = computed(() => this.list().length + 1);

  private readonly width = computed(() =>
    resultGridWidth(this.tiles(), this.cardRows()),
  );

  protected readonly minColumns = computed(() =>
    this.stacked() ? 18 : START_COL + this.width(),
  );

  protected readonly area = computed(() =>
    this.stacked()
      ? null
      : toGridArea({
          row: 2,
          rowEnd: Math.max(3, this.rows() + 1),
          col: START_COL,
          colEnd: START_COL + this.width(),
        }),
  );

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
