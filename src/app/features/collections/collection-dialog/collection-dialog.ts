import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import type { SavedMovie, UserCollection } from '../../../core/models/user-collection.models';
import { DrumCard } from '../../../shared/drum-card/drum-card';
import { OverlayPanel } from '../../../shared/overlay-panel/overlay-panel';
import { ToastService } from '../../../shared/toast/toast.service';
import { CollectionCreateService } from '../collection-create.service';
import { CollectionViewService } from '../collection-view.service';
import { CollectionsService } from '../collections.service';

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

  protected readonly collection = computed<UserCollection | null>(() => {
    const id = this.view.openId();
    if (!id) return null;

    return this.collections.collections().find((item) => item.id === id) ?? null;
  });

  protected readonly open = computed(() => this.collection() !== null);

  protected readonly films = computed(() => [...(this.collection()?.items ?? [])].reverse());

  protected readonly isEmpty = computed(() => this.films().length === 0);

  protected readonly created = computed(() =>
    this.i18n.formatDate(this.collection()?.createdAt ?? null),
  );

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

  protected poster(film: SavedMovie): string | null {
    return this.tmdb.imageUrl(film.posterPath, 'w342');
  }

  protected year(film: SavedMovie): string | null {
    return film.releaseDate ? film.releaseDate.slice(0, 4) : null;
  }

  protected score(film: SavedMovie): string | null {
    return film.voteAverage ? film.voteAverage.toFixed(1) : null;
  }

  private filmTree(film: SavedMovie) {
    return this.router.createUrlTree([{ outlets: { modal: ['movie', film.id] } }], {
      relativeTo: this.route.root,
    });
  }

  protected filmHref(film: SavedMovie): string {
    return this.router.serializeUrl(this.filmTree(film));
  }

  protected openFilm(event: MouseEvent, film: SavedMovie): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.router.navigateByUrl(this.filmTree(film));
  }
}
