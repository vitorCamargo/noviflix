import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import type { CastMember } from '../../../core/models/tmdb.models';

/**
 * Names shown before the list is cut. A full cast can run to hundreds.
 *
 * Exported because the page sizes itself from this: computing its width from the raw
 * count while the grid renders a capped one leaves a stretch of empty page nobody can
 * fill.
 */
export const CAST_LIMIT = 18;

/**
 * Cast as a grid of portraits with the role beneath each.
 *
 * Ordered as TMDB returns it, which is billing order — the people the production
 * itself considered principal, rather than anything this app decides.
 */
@Component({
  selector: 'nv-cast-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (people().length) {
      <ul
        class="cg"
        [class.is-horizontal]="horizontal()"
        [style.--cg-rows]="rows()"
      >
        @for (person of people(); track person.id) {
          <li class="cg__item">
            <span class="cg__art">
              @if (portrait(person); as src) {
                <img [src]="src" [alt]="" loading="lazy" />
              } @else {
                <!-- Initials rather than an empty frame, which reads as broken. -->
                <span class="cg__initials" aria-hidden="true">
                  {{ initials(person.name) }}
                </span>
              }
            </span>
            <span class="cg__text">
              <span class="cg__name">{{ person.name }}</span>
              @if (person.character) {
                <span class="cg__role">{{ person.character }}</span>
              }
            </span>
          </li>
        }
      </ul>
    } @else {
      <p class="cg__empty">{{ i18n.t('movie.noCast') }}</p>
    }
  `,
  styles: `
    @use '../../../../styles/mixins' as *;

    :host {
      display: block;
    }

    .cg {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: var(--nv-space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    /*
     * Column-major, for the page that scrolls sideways. Tiles take the same drum
     * footprint as a result card, so a strip of cast reads as the same kind of thing
     * as a strip of films and the page can compute one width for both.
     */
    .cg.is-horizontal {
      grid-auto-flow: column;
      grid-template-columns: none;
      grid-template-rows: repeat(var(--cg-rows, 2), calc(var(--nv-grid-cell) * 5));
      grid-auto-columns: calc(var(--nv-grid-cell) * 3);
      gap: var(--nv-grid-cell);
      block-size: 100%;
      /* Centred, so a window with room to spare distributes it above and below the
         rows rather than leaving it all at the bottom. */
      align-content: center;
    }

    /*
     * The tile is a fixed five drums tall here, so the portrait has to give way to the
     * name rather than the other way round. With the art holding a 2:3 ratio it took
     * almost the whole tile and left the name a sliver — a role of any length was cut
     * mid-word.
     */
    .cg.is-horizontal .cg__item {
      block-size: 100%;
    }

    .cg.is-horizontal .cg__art {
      aspect-ratio: auto;
      flex: 1;
      min-block-size: 0;
    }

    .cg.is-horizontal .cg__text {
      block-size: var(--nv-grid-cell);
      flex: none;
      justify-content: center;
    }

    .cg.is-horizontal .cg__name {
      @include clamp-lines(1);
    }

    .cg.is-horizontal .cg__role {
      @include clamp-lines(1);
    }

    .cg__item {
      display: flex;
      flex-direction: column;
      border-radius: var(--nv-radius);
      background: var(--nv-panel-2);
      overflow: hidden;
    }

    .cg__art {
      display: block;
      aspect-ratio: 2 / 3;
      background: var(--nv-surface-2);

      img {
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
      }
    }

    .cg__initials {
      display: grid;
      place-items: center;
      block-size: 100%;
      color: var(--nv-text-faint);
      font-size: var(--nv-text-xl);
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .cg__text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: var(--nv-space-3);
      min-inline-size: 0;
    }

    .cg__name {
      font-size: var(--nv-text-sm);
      font-weight: 700;
      line-height: 1.3;
    }

    .cg__role {
      color: var(--nv-text-faint);
      font-size: var(--nv-text-xs);
      line-height: 1.35;
    }

    .cg__empty {
      margin: 0;
      color: var(--nv-text-faint);
      font-size: var(--nv-text-sm);
    }
  `,
})
export class CastGrid {
  private readonly tmdb = inject(TmdbService);
  protected readonly i18n = inject(I18nService);

  readonly cast = input<readonly CastMember[]>([]);

  /** Column-major, for the page that scrolls sideways rather than down. */
  readonly horizontal = input(false);

  /** Tile rows when horizontal. Decided by the page, which needs it for its width. */
  readonly rows = input(2);

  protected readonly people = computed(() => this.cast().slice(0, CAST_LIMIT));

  protected portrait(person: CastMember): string | null {
    return this.tmdb.imageUrl(person.profile_path, 'w185');
  }

  /**
   * First letters of the first and last name.
   *
   * Built from the ends rather than the first two words, so a middle name doesn't
   * produce initials that look like someone else's.
   */
  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';

    const first = parts[0][0] ?? '';
    const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
    return (first + last).toUpperCase();
  }
}
