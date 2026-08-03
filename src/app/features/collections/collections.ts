import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AppReadyService } from '../../core/app-ready.service';
import { I18nService } from '../../core/i18n/i18n.service';
import type { UserCollection } from '../../core/models/user-collection.models';
import { PageGrid, readCellSize, readViewport, toGridArea } from '../../layout/page-grid/page-grid';
import { DrumCard } from '../../shared/drum-card/drum-card';
import { DotField } from '../home/dot-field/dot-field';
import { HOME_STACK_MAX } from '../home/home-layout';
import { CollectionCard } from './collection-card/collection-card';
import { CollectionCreateService } from './collection-create.service';
import { CollectionViewService } from './collection-view.service';
import { CollectionsService } from './collections.service';
import { filterByName } from './collection-filter';
import { LEFT_COLS, PAGE_START_COL, PANE_GAP, collectionsLayout } from './collections-layout';

const ENTRANCE = {
  title: 0,
  accent: 90,
  body: 200,
  kicker: 280,
  find: 340,
  create: 400,
  cards: 460,
} as const;

const CARD_STEP_MS = 90;

@Component({
  selector: 'nv-collections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageGrid, DrumCard, DotField, CollectionCard],
  templateUrl: './collections.html',
  styleUrl: './collections.scss',
})
export class Collections {
  protected readonly i18n = inject(I18nService);
  private readonly appReady = inject(AppReadyService);
  private readonly collections = inject(CollectionsService);
  private readonly form = inject(CollectionCreateService);
  private readonly view = inject(CollectionViewService);

  protected readonly list = this.collections.recent;

  protected readonly entering = this.appReady.revealed;

  protected delay(beat: keyof typeof ENTRANCE): string {
    return `${ENTRANCE[beat]}ms`;
  }

  protected cardDelay(index: number): string {
    return `${ENTRANCE.cards + Math.max(0, index) * CARD_STEP_MS}ms`;
  }

  protected readonly isEmpty = this.collections.isEmpty;

  protected readonly query = signal('');

  protected readonly shown = computed(() => filterByName(this.list(), this.query()));

  protected readonly noMatch = computed(() => !this.isEmpty() && this.shown().length === 0);

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected clearQuery(): void {
    this.query.set('');
  }

  protected createNew(): void {
    this.form.openDialog();
  }

  protected openCollection(collection: UserCollection): void {
    this.view.open(collection.id);
  }

  private readonly viewport = signal(readViewport());

  private readonly rows = computed(() =>
    Math.max(1, Math.floor(this.viewport().height / readCellSize())),
  );

  protected readonly stacked = computed(() => this.viewport().width <= HOME_STACK_MAX);

  private readonly layout = computed(() => collectionsLayout(this.rows(), this.shown().length));

  protected drop(index: number): number {
    return this.layout().drops[index] ?? 0;
  }

  protected readonly minColumns = computed(() => (this.stacked() ? 18 : this.layout().totalCols));

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
