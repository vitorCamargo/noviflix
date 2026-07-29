import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { I18nService } from '../../core/i18n/i18n.service';
import { OverlayPanel } from '../../shared/overlay-panel/overlay-panel';

@Component({
  selector: 'nv-movie-details-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OverlayPanel, RouterLink],
  template: `
    <nv-overlay-panel
      [ariaLabel]="i18n.t('page.movieModal.title')"
      [closeLabel]="i18n.t('common.close')"
      [connector]="true"
      (closed)="close()"
    >
      <div nvPanelToolbar class="bar">
        <button
          type="button"
          class="bar__nav"
          [attr.aria-label]="i18n.t('common.back')"
          (click)="back()"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
        </button>
        <span class="bar__divider" aria-hidden="true"></span>
        <span class="bar__id">id = {{ id() }}</span>
      </div>

      <div nvPanelFilters class="tabs">
        @for (tab of tabs; track tab) {
          <button
            type="button"
            class="tabs__btn"
            [class.is-active]="tab === activeTab()"
            (click)="activeTab.set(tab)"
          >
            {{ tab }}
          </button>
        }
      </div>

      <div nvPanelAside class="aside">
        <h2 class="aside__title">
          {{ i18n.t('page.movieModal.title') }}
        </h2>
        <p class="aside__body">{{ i18n.t('page.movieModal.body') }}</p>

        <a class="aside__cta" [routerLink]="['/movie', id()]">
          {{ i18n.t('common.openFull') }}
        </a>
      </div>

      <div nvPanelBody class="grid">
        @for (slot of slots; track slot) {
          <div class="grid__cell">
            <div class="grid__art"></div>
            <p class="grid__label">{{ slot }}</p>
          </div>
        }
      </div>
    </nv-overlay-panel>
  `,
  styles: `
    .bar {
      display: flex;
      align-items: center;
      gap: var(--nv-space-4);
    }

    .bar__nav {
      display: grid;
      place-items: center;
      inline-size: 30px;
      block-size: 30px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--nv-text-muted);

      svg {
        inline-size: 16px;
        block-size: 16px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      &:hover {
        color: var(--nv-accent);
      }
    }

    .bar__divider {
      inline-size: 1px;
      block-size: 20px;
      background: var(--nv-border-strong);
    }

    .bar__id {
      font-size: var(--nv-text-xs);
      font-weight: 700;
      letter-spacing: var(--nv-tracking-wide);
      text-transform: uppercase;
      color: var(--nv-text-faint);
    }

    .tabs {
      display: flex;
      align-items: center;
      gap: var(--nv-space-4);
    }

    .tabs__btn {
      border: 0;
      background: transparent;
      padding: 0;
      font-size: var(--nv-text-xs);
      font-weight: 700;
      letter-spacing: var(--nv-tracking-wide);
      text-transform: uppercase;
      color: var(--nv-text-faint);

      &:hover {
        color: var(--nv-text-muted);
      }

      &.is-active {
        color: var(--nv-accent);
      }
    }

    .aside__title {
      font-size: var(--nv-text-3xl);
      font-weight: 900;
    }

    .aside__body {
      margin: 0;
      color: var(--nv-text-muted);
      max-inline-size: 42ch;
    }

    .aside__cta {
      align-self: flex-start;
      margin-block-start: var(--nv-space-2);
      padding: var(--nv-space-3) var(--nv-space-5);
      border-radius: var(--nv-radius-sm);
      background: var(--nv-accent);
      color: var(--nv-accent-ink);
      font-size: var(--nv-text-sm);
      font-weight: 700;
      transition: box-shadow var(--nv-normal) var(--nv-ease);

      &:hover {
        box-shadow: 0 10px 30px var(--nv-accent-glow);
      }
    }

    /* Placeholder tiles, standing in for the poster grid. */
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--nv-space-3);
    }

    .grid__cell {
      background: var(--nv-panel-tile);
      border-radius: var(--nv-radius);
      overflow: hidden;
    }

    .grid__art {
      aspect-ratio: 1;
      background: linear-gradient(150deg, var(--nv-surface-2), var(--nv-panel));
    }

    .grid__label {
      margin: 0;
      padding: var(--nv-space-3);
      font-size: var(--nv-text-sm);
      font-weight: 600;
      color: var(--nv-text-muted);
    }

    @media (max-width: 640px) {
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
})
export class MovieDetailsModal {
  protected readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.paramMap, { initialValue: null });

  protected readonly id = computed(() => this.params()?.get('id') ?? '');

  protected readonly tabs = ['Overview', 'Cast', 'Similar'] as const;
  protected readonly activeTab = signal<string>('Overview');

  protected readonly slots = Array.from({ length: 9 }, (_, i) => `${i + 1}.`);

  protected back(): void {
    this.close();
  }

  protected close(): void {
    void this.router.navigate([{ outlets: { modal: null } }]);
  }
}
