import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { I18nService } from '../../core/i18n/i18n.service';
import { TmdbService } from '../../core/tmdb/tmdb.service';
import type { SavedMovie } from '../../core/models/user-collection.models';
import {
  PageGrid,
  readCellSize,
  readViewport,
  toGridArea,
} from '../../layout/page-grid/page-grid';
import { DrumCard } from '../../shared/drum-card/drum-card';
import { HOME_STACK_MAX } from '../home/home-layout';
import { CollectionsService } from '../collections/collections.service';
import { resultGridWidth, resultRowCount } from '../search/results-metrics';

/** Drum rows above the grid: one clearing the header, one back link, one heading band. */
const TOP_ROWS = 3;

const START_COL = 3;

/**
 * One collection's films.
 *
 * Each tile opens the details pop-up and carries a remove control, which are the two things
 * the spec asks for here. Films are rendered from the snapshot stored with the collection
 * rather than refetched, so the page opens without a request per title.
 */
@Component({
  selector: 'nv-collection-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageGrid, RouterLink, DrumCard],
  templateUrl: './collection-details.html',
  styleUrl: './collection-details.scss',
})
export class CollectionDetailsPage {
  protected readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly tmdb = inject(TmdbService);
  private readonly collections = inject(CollectionsService);

  private readonly params = toSignal(this.route.paramMap, { initialValue: null });

  protected readonly id = computed(() => this.params()?.get('id') ?? '');

  /** Read from the signal each time, so a removal re-renders without any wiring here. */
  protected readonly collection = computed(() => {
    this.collections.collections();
    return this.collections.byId(this.id());
  });

  /** Newest first: the last thing added is the thing most likely being looked for. */
  protected readonly items = computed(() =>
    [...(this.collection()?.items ?? [])].reverse(),
  );

  protected readonly isEmpty = computed(() => this.items().length === 0);

  protected poster(item: SavedMovie): string | null {
    return this.tmdb.imageUrl(item.posterPath, 'w342');
  }

  protected year(item: SavedMovie): string | null {
    return item.releaseDate ? item.releaseDate.slice(0, 4) : null;
  }

  protected score(item: SavedMovie): string | null {
    return item.voteAverage ? item.voteAverage.toFixed(1) : null;
  }

  /** Named-outlet link, so the pop-up is a URL rather than component state. */
  protected modalLink(item: SavedMovie) {
    return [{ outlets: { modal: ['movie', item.id] } }];
  }

  protected remove(item: SavedMovie): void {
    this.collections.removeFrom(this.id(), item.id);
  }

  // ------------------------------------------------------------------ layout

  private readonly viewport = signal(readViewport());

  /** Floored: content placed to a partial bottom row is placed past the viewport edge. */
  private readonly rows = computed(() =>
    Math.max(1, Math.floor(this.viewport().height / readCellSize())),
  );

  protected readonly stacked = computed(
    () => this.viewport().width <= HOME_STACK_MAX,
  );

  protected readonly cardRows = computed(() =>
    resultRowCount(this.rows() - TOP_ROWS),
  );

  private readonly width = computed(() =>
    // At least one tile wide, so an empty collection still has a place to put its message.
    Math.max(3, resultGridWidth(this.items().length, this.cardRows())),
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
