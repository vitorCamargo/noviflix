import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { CollectionPickerService } from '../collection-picker.service';

/**
 * The "N selected" bar, rendered once at the app root.
 *
 * Selection is global — a film can be marked on the search results, in a details pop-up's related
 * strip, or on a details page — so the bar that acts on it cannot belong to any one of those. It
 * started inside the search grid, which meant selecting anywhere else appeared to do nothing.
 *
 * Fixed to the bottom rather than placed in a grid: the desktop grids scroll sideways, and a bar
 * inside one would slide out of reach exactly as more films were being chosen.
 */
@Component({
  selector: 'nv-selection-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (count()) {
      <div class="sb" role="status">
        <span class="sb__count">
          {{ i18n.t('collections.selected', { count: count() }) }}
        </span>

        <button type="button" class="sb__add" aria-haspopup="dialog" (click)="add()">
          {{ i18n.t('collections.addSelected') }}
        </button>

        <button type="button" class="sb__clear" (click)="clear()">
          {{ i18n.t('collections.clearSelection') }}
        </button>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    /*
     * Above the details overlay, so a film selected in its related strip can still be acted on,
     * but below the picker it opens — otherwise the bar would draw over the menu on a short
     * viewport where the two meet.
     */
    .sb {
      position: fixed;
      inset-block-end: var(--nv-space-6);
      inset-inline-start: 50%;
      translate: -50% 0;
      z-index: calc(var(--nv-z-modal) + 1);
      display: flex;
      align-items: center;
      gap: var(--nv-space-3);
      max-inline-size: calc(100vw - var(--nv-space-6) * 2);
      padding: var(--nv-space-2) var(--nv-space-3) var(--nv-space-2) var(--nv-space-5);
      border-radius: var(--nv-radius-pill);
      background: var(--nv-panel);
      box-shadow: var(--nv-shadow-pop);
      animation: nv-rise var(--nv-fast) var(--nv-ease);
    }

    .sb__count {
      font-size: var(--nv-text-sm);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .sb__add {
      padding: var(--nv-space-2) var(--nv-space-4);
      border: 0;
      border-radius: var(--nv-radius-pill);
      background: var(--nv-accent);
      color: var(--nv-accent-ink);
      font-size: var(--nv-text-sm);
      font-weight: 700;
      white-space: nowrap;
    }

    .sb__clear {
      padding: var(--nv-space-2) var(--nv-space-3);
      border: 0;
      background: transparent;
      color: var(--nv-text-muted);
      font-size: var(--nv-text-sm);
      font-weight: 600;
      white-space: nowrap;

      &:hover {
        color: var(--nv-text);
      }
    }

    /* Out of the corner the scroll hint occupies, which shares this edge. */
    @media (max-width: 640px) {
      .sb {
        inset-inline: var(--nv-space-4);
        translate: none;
        justify-content: space-between;
      }
    }
  `,
})
export class SelectionBar {
  protected readonly i18n = inject(I18nService);
  private readonly picker = inject(CollectionPickerService);

  protected readonly count = this.picker.count;

  protected add(): void {
    this.picker.openForSelection();
  }

  protected clear(): void {
    this.picker.clearSelection();
  }
}
