import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TrackState } from '../horizontal-scroll/track-state';

@Component({
  selector: 'nv-scroll-hint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (track.overflowing()) {
      <div class="hint">
        <span class="hint__glyph" aria-hidden="true">
          <svg viewBox="0 0 44 34">
            <path class="hint__arrow" d="M7 11 L1 17 L7 23 Z" />
            <path class="hint__arrow" d="M37 11 L43 17 L37 23 Z" />
            <rect class="hint__puck" x="12" y="10" width="20" height="14" rx="7" />
            <path class="hint__puck" d="M18 17 h8" />

            <path class="hint__muted" d="M18 4 L22 0 L26 4" />
            <path class="hint__muted" d="M18 30 L22 34 L26 30" />
          </svg>
        </span>
        <span class="hint__text">{{ i18n.t('scroll.hint') }}</span>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .hint {
      position: fixed;
      inset-block-end: var(--nv-space-6);
      inset-inline-start: var(--nv-space-6);
      z-index: var(--nv-z-content);
      display: flex;
      align-items: center;
      gap: var(--nv-space-3);
      padding: var(--nv-space-2) var(--nv-space-4) var(--nv-space-2) var(--nv-space-3);
      border-radius: var(--nv-radius-pill);
      background: rgba(0, 0, 0, 0.66);
      backdrop-filter: blur(8px);
      pointer-events: none;
      color: var(--nv-text);
      transition: color var(--nv-normal) var(--nv-ease);
      animation: nv-fade-in var(--nv-slow) var(--nv-ease);
    }

    .hint__glyph svg {
      display: block;
      inline-size: 44px;
      block-size: 34px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .hint__arrow {
      fill: currentColor;
      stroke: none;
    }

    .hint__puck {
      stroke: currentColor;
    }

    .hint__muted {
      stroke: var(--nv-text-faint);
    }

    .hint__text {
      font-size: var(--nv-text-sm);
      color: var(--nv-text);
    }

    @media (max-width: 900px) {
      .hint {
        display: none;
      }
    }
  `,
})
export class ScrollHint {
  protected readonly i18n = inject(I18nService);
  protected readonly track = inject(TrackState);
}
