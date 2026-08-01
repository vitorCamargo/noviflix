import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import type {
  SavedMovie,
  UserCollection,
} from '../../../core/models/user-collection.models';
import { DrumCard } from '../../../shared/drum-card/drum-card';
import { OverlayPanel } from '../../../shared/overlay-panel/overlay-panel';
import { ToastService } from '../../../shared/toast/toast.service';
import { CollectionCreateService } from '../collection-create.service';
import { CollectionViewService } from '../collection-view.service';
import { CollectionsService } from '../collections.service';

/**
 * One collection's films, as a pop-up over the page that opened it.
 *
 * A pop-up rather than a page because the page it comes from is the whole point of the arrangement:
 * a field of collections to compare. Sending someone away to see inside one and back to see inside
 * the next turns browsing into a series of loads.
 *
 * Built on the same OverlayPanel as the film pop-up, so the two are the same object seen twice: the
 * subject's own actions on the left of the bar, sections on the right, what it *is* in the left
 * column and what it *contains* in the right. Nothing here is a second way of doing that.
 *
 * It sits *below* the film pop-up in the stack, so opening a film from here layers over it and
 * closing that film returns to the collection rather than to the bare page.
 */
@Component({
  selector: 'nv-collection-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OverlayPanel, DrumCard],
  templateUrl: './collection-dialog.html',
  styleUrl: './collection-dialog.scss',
})
export class CollectionDialog {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tmdb = inject(TmdbService);
  private readonly collections = inject(CollectionsService);
  private readonly view = inject(CollectionViewService);
  private readonly form = inject(CollectionCreateService);
  private readonly toast = inject(ToastService);

  /**
   * The collection on show, read fresh from the store.
   *
   * Null once it is deleted, which is also how the overlay closes itself after a deletion — there
   * is nothing left to show, so there is nothing to keep open.
   */
  protected readonly collection = computed<UserCollection | null>(() => {
    const id = this.view.openId();
    if (!id) return null;

    return this.collections.collections().find((item) => item.id === id) ?? null;
  });

  protected readonly open = computed(() => this.collection() !== null);

  /** Newest first: the last thing added is the thing most likely being looked for. */
  protected readonly films = computed(() =>
    [...(this.collection()?.items ?? [])].reverse(),
  );

  protected readonly isEmpty = computed(() => this.films().length === 0);

  protected readonly created = computed(() =>
    this.i18n.formatDate(this.collection()?.createdAt ?? null),
  );

  /**
   * When it last changed, or null when that is the day it was made.
   *
   * Both dates on a collection made an hour ago would be the same line printed twice — the second
   * one only earns its place once it says something the first does not.
   */
  protected readonly updated = computed(() => {
    const list = this.collection();
    if (!list) return null;

    const updated = this.i18n.formatDate(list.updatedAt);
    return updated === this.created() ? null : updated;
  });

  protected close(): void {
    this.view.close();
  }

  protected edit(collection: UserCollection): void {
    this.form.openEdit(collection);
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

    this.close();

    this.toast.show(this.i18n.t('collections.deleted', { name: removed.name }), {
      label: this.i18n.t('common.undo'),
      run: () => {
        this.collections.restore(removed);
        this.view.open(removed.id);
      },
    });
  }

  protected removeFilm(film: SavedMovie): void {
    const collection = this.collection();
    if (collection) this.collections.removeFrom(collection.id, film.id);
  }

  // -------------------------------------------------------------------- a film

  protected poster(film: SavedMovie): string | null {
    return this.tmdb.imageUrl(film.posterPath, 'w342');
  }

  protected year(film: SavedMovie): string | null {
    return film.releaseDate ? film.releaseDate.slice(0, 4) : null;
  }

  protected score(film: SavedMovie): string | null {
    return film.voteAverage ? film.voteAverage.toFixed(1) : null;
  }

  /**
   * The movie pop-up's address for one film.
   *
   * Built against the root rather than the active route. Commands in a named outlet resolve
   * relative to the route they are written in, which nested the pop-up inside itself the last time
   * this was left to `routerLink` — so the tree is made here, already resolved.
   */
  private filmTree(film: SavedMovie) {
    return this.router.createUrlTree(
      [{ outlets: { modal: ['movie', film.id] } }],
      { relativeTo: this.route.root },
    );
  }

  /** A real href, so middle-click, open-in-new-tab and the status bar all behave. */
  protected filmHref(film: SavedMovie): string {
    return this.router.serializeUrl(this.filmTree(film));
  }

  protected openFilm(event: MouseEvent, film: SavedMovie): void {
    // Modified clicks belong to the browser: opening in a tab or a window is the point of them.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.router.navigateByUrl(this.filmTree(film));
  }
}
