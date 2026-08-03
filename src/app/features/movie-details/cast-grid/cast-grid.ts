import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import type { CastMember } from '../../../core/models/tmdb.models';

export const CAST_LIMIT = 18;

@Component({
  selector: 'nv-cast-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (people().length) {
      <ul class="cg" [class.is-horizontal]="horizontal()" [style.--cg-rows]="rows()">
        @for (person of people(); track person.id) {
          <li class="cg__item">
            <span class="cg__art">
              @if (portrait(person); as src) {
                <img [src]="src" [alt]="" loading="lazy" />
              } @else {
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

    .cg.is-horizontal {
      grid-auto-flow: column;
      grid-template-columns: none;
      grid-template-rows: repeat(var(--cg-rows, 2), calc(var(--nv-grid-cell) * 5));
      grid-auto-columns: calc(var(--nv-grid-cell) * 3);
      gap: var(--nv-grid-cell);
      block-size: 100%;
      align-content: center;
    }

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

  readonly horizontal = input(false);

  readonly rows = input(2);

  protected readonly people = computed(() => this.cast().slice(0, CAST_LIMIT));

  protected portrait(person: CastMember): string | null {
    return this.tmdb.imageUrl(person.profile_path, 'w185');
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';

    const first = parts[0][0] ?? '';
    const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
    return (first + last).toUpperCase();
  }
}
