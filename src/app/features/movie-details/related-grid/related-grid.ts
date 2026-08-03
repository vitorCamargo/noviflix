import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { MovieSummary } from '../../../core/models/tmdb.models';
import { MovieCard } from '../../search/movie-card/movie-card';

export const RELATED_LIMIT = 12;

@Component({
  selector: 'nv-related-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MovieCard],
  template: `
    @if (films().length) {
      <div class="rl" [class.is-horizontal]="horizontal()" [style.--rl-rows]="rows()">
        @for (film of films(); track film.id) {
          <nv-movie-card [movie]="film" />
        }
      </div>
    } @else {
      <p class="rl__empty">{{ i18n.t('movie.noRelated') }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .rl {
      --nv-card-surface: var(--nv-panel-2);

      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: var(--nv-space-3);
    }

    .rl > * {
      aspect-ratio: 3 / 5;
    }

    .rl.is-horizontal {
      grid-auto-flow: column;
      grid-template-columns: none;
      grid-template-rows: repeat(var(--rl-rows, 2), calc(var(--nv-grid-cell) * 5));
      grid-auto-columns: calc(var(--nv-grid-cell) * 3);
      gap: var(--nv-grid-cell);
      block-size: 100%;
      align-content: center;
    }

    .rl.is-horizontal > * {
      aspect-ratio: auto;
    }

    .rl__empty {
      margin: 0;
      color: var(--nv-text-faint);
      font-size: var(--nv-text-sm);
    }
  `,
})
export class RelatedGrid {
  protected readonly i18n = inject(I18nService);

  readonly movies = input<readonly MovieSummary[]>([]);

  readonly horizontal = input(false);

  readonly rows = input(2);

  protected readonly films = computed(() => this.movies().slice(0, RELATED_LIMIT));
}
