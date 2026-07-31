import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { MovieSummary } from '../../../core/models/tmdb.models';
import { MovieCard } from '../../search/movie-card/movie-card';

/**
 * Enough to browse without turning the tab into a second search results page.
 *
 * Exported because the page sizes itself from this: computing its width from the raw
 * count while the grid renders a capped one leaves a stretch of empty page nobody can
 * fill.
 */
export const RELATED_LIMIT = 12;

/**
 * Related films, using the same card as the search results.
 *
 * Reused rather than restyled: a film is a film, and giving it a different card here
 * would mean the hover, the rating badge and the two links all needed maintaining
 * twice.
 */
@Component({
  selector: 'nv-related-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MovieCard],
  template: `
    @if (films().length) {
      <div
        class="rl"
        [class.is-horizontal]="horizontal()"
        [style.--rl-rows]="rows()"
      >
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

    /*
     * Row-major and aspect-sized, unlike the search grid: this sits inside a panel
     * that scrolls vertically, so there is no horizontal axis to flow along.
     */
    .rl {
      /* A step lighter than the panel behind it, matching the cast tiles — on the
         default fill the card's meta strip is the same colour as its background. */
      --nv-card-surface: var(--nv-panel-2);

      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: var(--nv-space-3);
    }

    .rl > * {
      aspect-ratio: 3 / 5;
    }

    /*
     * Column-major, for the page that scrolls sideways. The tile takes its drum
     * footprint rather than an aspect ratio, so it lands on the lattice seams like
     * every other card.
     */
    .rl.is-horizontal {
      grid-auto-flow: column;
      grid-template-columns: none;
      grid-template-rows: repeat(var(--rl-rows, 2), calc(var(--nv-grid-cell) * 5));
      grid-auto-columns: calc(var(--nv-grid-cell) * 3);
      gap: var(--nv-grid-cell);
      block-size: 100%;
      /* Centred, so a window with room to spare distributes it above and below the
         rows rather than leaving it all at the bottom. */
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

  /** Column-major, for the page that scrolls sideways rather than down. */
  readonly horizontal = input(false);

  /** Tile rows when horizontal. Decided by the page, which needs it for its width. */
  readonly rows = input(2);

  protected readonly films = computed(() => this.movies().slice(0, RELATED_LIMIT));
}
