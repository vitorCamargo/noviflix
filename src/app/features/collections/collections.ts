import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { TmdbService } from '../../core/tmdb/tmdb.service';
import type {
  SavedMovie,
  UserCollection,
} from '../../core/models/user-collection.models';
import {
  PageGrid,
  readCellSize,
  readViewport,
  toGridArea,
} from '../../layout/page-grid/page-grid';
import { DrumCard } from '../../shared/drum-card/drum-card';
import { ToastService } from '../../shared/toast/toast.service';
import { HOME_STACK_MAX } from '../home/home-layout';
import { CollectionRow } from './collection-row/collection-row';
import { CollectionCreateService } from './collection-create.service';
import { CollectionsService } from './collections.service';
import {
  LIST_COLS,
  PAGE_START_COL,
  PAGE_START_ROW,
  collectionsLayout,
} from './collections-layout';

/**
 * Collections, as one page: the list on the left, the films of the open one on the right.
 *
 * The same shape as the details page, and for the same reason — moving between collections is
 * comparing them, and a page per collection makes that a series of loads with the list gone from
 * view each time. Which one is open is held in memory rather than the URL: there is one page here
 * now, and a second address for a pane's contents would promise a page that no longer exists.
 *
 * Layout follows the rest of the app. On desktop the panes sit in a row and the page declares its
 * own width so the track can scroll to the far end; below the stacking breakpoint the list and the
 * films become two views, one at a time, since neither is usable at half a phone's width.
 */
@Component({
  selector: 'nv-collections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageGrid, DrumCard, RouterLink, CollectionRow],
  templateUrl: './collections.html',
  styleUrl: './collections.scss',
})
export class Collections {
  protected readonly i18n = inject(I18nService);
  private readonly tmdb = inject(TmdbService);
  private readonly collections = inject(CollectionsService);
  private readonly dialog = inject(CollectionCreateService);
  private readonly toast = inject(ToastService);

  protected readonly list = this.collections.recent;

  protected readonly isEmpty = this.collections.isEmpty;

  /** Which collection the visitor picked, if it is still there. */
  private readonly chosen = signal<string | null>(null);

  /**
   * The collection on show.
   *
   * Falls back to the first on desktop, where an empty right pane beside a full list would be a
   * pane doing nothing. Stacked, it stays null until something is picked: that is the list view,
   * and picking one is what moves to the other.
   */
  protected readonly current = computed<UserCollection | null>(() => {
    const list = this.list();
    const picked = list.find((item) => item.id === this.chosen());

    if (picked) return picked;
    return this.stacked() ? null : (list[0] ?? null);
  });

  /** Newest first: the last thing added is the thing most likely being looked for. */
  protected readonly films = computed(() =>
    [...(this.current()?.items ?? [])].reverse(),
  );

  protected readonly noFilms = computed(() => this.films().length === 0);

  /** Stacked, the films replace the list rather than sitting beside it. */
  protected readonly showingFilms = computed(
    () => !this.stacked() || this.chosen() !== null,
  );

  constructor() {
    /*
     * Follow whatever was just created.
     *
     * A collection made from the dialog is the one to be looking at — including the empty one made
     * from the add panel, which is otherwise created out of sight.
     */
    effect(() => {
      const id = this.collections.lastCreated();
      if (id) untracked(() => this.chosen.set(id));
    });
  }

  protected choose(collection: UserCollection): void {
    this.chosen.set(collection.id);
  }

  /** Stacked only: back from a collection's films to the list. */
  protected back(): void {
    this.chosen.set(null);
  }

  /** A dialog rather than a page: two fields don't warrant leaving this one. */
  protected createNew(): void {
    this.dialog.openDialog();
  }

  protected edit(collection: UserCollection): void {
    this.dialog.openEdit(collection);
  }

  /**
   * Deletes outright, and offers it back.
   *
   * No confirmation step: asking before every deletion taxes the many deliberate ones to guard
   * against the rare accident, and an undo covers the accident without costing anything. The
   * collection rides along in the closure, so nothing has to be kept anywhere in the meantime.
   */
  protected remove(collection: UserCollection): void {
    const removed = this.collections.remove(collection.id);
    if (!removed) return;

    if (this.chosen() === removed.id) this.chosen.set(null);

    this.toast.show(this.i18n.t('collections.deleted', { name: removed.name }), {
      label: this.i18n.t('common.undo'),
      run: () => {
        this.collections.restore(removed);
        this.chosen.set(removed.id);
      },
    });
  }

  protected removeFilm(film: SavedMovie): void {
    const collection = this.current();
    if (collection) this.collections.removeFrom(collection.id, film.id);
  }

  // ------------------------------------------------------------------- a film

  protected poster(film: SavedMovie): string | null {
    return this.tmdb.imageUrl(film.posterPath, 'w342');
  }

  protected year(film: SavedMovie): string | null {
    return film.releaseDate ? film.releaseDate.slice(0, 4) : null;
  }

  protected score(film: SavedMovie): string | null {
    return film.voteAverage ? film.voteAverage.toFixed(1) : null;
  }

  /** Named-outlet link, so the pop-up is a URL rather than component state. */
  protected modalLink(film: SavedMovie) {
    return [{ outlets: { modal: ['movie', film.id] } }];
  }

  // ------------------------------------------------------------------- layout

  private readonly viewport = signal(readViewport());

  /**
   * Whole drum rows, floored.
   *
   * The pad field rounds up so it covers a partial row; content cannot, or it is placed past the
   * bottom edge and the last row of tiles is cut.
   */
  private readonly rows = computed(() =>
    Math.max(1, Math.floor(this.viewport().height / readCellSize())),
  );

  protected readonly stacked = computed(
    () => this.viewport().width <= HOME_STACK_MAX,
  );

  private readonly layout = computed(() =>
    collectionsLayout(this.rows(), this.films().length),
  );

  protected readonly cardRows = computed(() => this.layout().rows);

  protected readonly listCols = LIST_COLS;

  protected readonly minColumns = computed(() =>
    this.stacked() ? 18 : this.layout().totalCols,
  );

  protected readonly area = computed(() =>
    this.stacked()
      ? null
      : toGridArea({
          row: PAGE_START_ROW,
          rowEnd: Math.max(PAGE_START_ROW + 1, this.rows() + 1),
          col: PAGE_START_COL,
          colEnd: this.layout().totalCols,
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
