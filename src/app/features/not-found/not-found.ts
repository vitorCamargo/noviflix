import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppReadyService } from '../../core/app-ready.service';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  PageGrid,
  centreOffset,
  readCellSize,
  readViewport,
  toGridArea,
} from '../../layout/page-grid/page-grid';
import { DotField } from '../home/dot-field/dot-field';
import { HOME_STACK_MAX } from '../home/home-layout';

const ENTRANCE = {
  kicker: 0,
  title: 80,
  accent: 170,
  body: 280,
  dots: 320,
  path: 380,
  actions: 460,
} as const;

const START_COL = 3;

const TEXT_COLS = 9;

const TEXT_ROWS = 7;

@Component({
  selector: 'nv-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageGrid, DotField, RouterLink],
  template: `
    <nv-page-grid [minColumns]="minColumns()" [class.is-entering]="entering()">
      <div class="nf" [style.gridArea]="textArea()">
        <div class="nf__dots" [style.--enter]="delay('dots')">
          <nv-dot-field [columns]="4" [rows]="5" />
        </div>

        <p class="nf__kicker" [style.--enter]="delay('kicker')">
          {{ i18n.t('error.kicker') }}
        </p>

        <h1 class="nf__title">
          <span class="nf__line" [style.--enter]="delay('title')">
            {{ i18n.t('error.titleLead') }}
          </span>
          <span class="nf__line" [style.--enter]="delay('accent')">
            <em class="nf__accent">{{ i18n.t('error.titleAccent') }}</em>
          </span>
        </h1>

        <p class="nf__body" [style.--enter]="delay('body')">
          {{ i18n.t('error.body') }}
        </p>

        <p class="nf__path" [style.--enter]="delay('path')">
          <span class="nf__path-label">{{ i18n.t('error.path') }}</span>
          <code class="nf__path-value">{{ path }}</code>
        </p>

        <div class="nf__actions" [style.--enter]="delay('actions')">
          <a class="nf__btn nf__btn--primary" routerLink="/">
            {{ i18n.t('error.goHome') }}
          </a>
          <a class="nf__btn" routerLink="/collections">
            {{ i18n.t('error.toCollections') }}
          </a>
        </div>
      </div>
    </nv-page-grid>
  `,
  styles: `
    @use '../../../styles/mixins' as *;

    :host {
      display: block;
      block-size: 100%;
    }

    .nf {
      position: relative;
      isolation: isolate;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: var(--nv-space-4);
      padding-inline-end: var(--nv-space-5);
      min-inline-size: 0;
    }

    .nf__dots {
      position: absolute;
      inset-block-start: calc(4% - var(--nv-grid-cell) * 1.5);
      inset-inline-end: calc(100% - var(--nv-grid-cell) * 1.5);
      z-index: 0;
    }

    .nf__kicker,
    .nf__title,
    .nf__body,
    .nf__path,
    .nf__actions {
      position: relative;
      z-index: 1;
    }

    .nf__kicker {
      @include kicker;

      margin: 0;
      color: var(--nv-accent);
    }

    .nf__title {
      display: flex;
      flex-direction: column;
      margin: 0;
      font-size: clamp(2.2rem, 4vw, 3.6rem);
      font-weight: 900;
      letter-spacing: -0.035em;
      line-height: 1.02;
    }

    .nf__accent {
      font-style: normal;
      color: var(--nv-accent);
    }

    .nf__body {
      margin: 0;
      max-inline-size: 38ch;
      color: var(--nv-text-muted);
      font-size: var(--nv-text-base);
      line-height: 1.6;
    }

    .nf__path {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: var(--nv-space-2);
      margin: 0;
      min-inline-size: 0;
    }

    .nf__path-label {
      @include kicker;

      color: var(--nv-text-faint);
    }

    .nf__path-value {
      max-inline-size: 100%;
      padding: 2px var(--nv-space-2);
      border-radius: var(--nv-radius-sm);
      background: var(--nv-panel);
      color: var(--nv-text-muted);
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: var(--nv-text-xs);
      overflow-wrap: anywhere;
    }

    .nf__actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--nv-space-3);
      margin-block-start: var(--nv-space-2);
    }

    .nf__btn {
      padding: var(--nv-space-3) var(--nv-space-5);
      border: 1px solid var(--nv-border);
      border-radius: var(--nv-radius-pill);
      color: var(--nv-text);
      font-size: var(--nv-text-sm);
      font-weight: 700;
      transition:
        border-color var(--nv-fast) var(--nv-ease),
        color var(--nv-fast) var(--nv-ease);

      &:hover {
        border-color: var(--nv-accent);
        color: var(--nv-accent);
      }
    }

    .nf__btn--primary {
      border-color: transparent;
      background: var(--nv-accent);
      color: var(--nv-accent-ink);
      box-shadow: 0 0 32px var(--nv-accent-glow);

      &:hover {
        border-color: transparent;
        color: var(--nv-accent-ink);
      }
    }

    nv-page-grid:not(.is-entering) {
      .nf__kicker,
      .nf__line,
      .nf__body,
      .nf__path,
      .nf__actions,
      .nf__dots {
        opacity: 0;
      }
    }

    nv-page-grid.is-entering {
      .nf__kicker,
      .nf__line,
      .nf__body,
      .nf__path,
      .nf__actions {
        animation: nv-swipe-up 520ms var(--nv-ease-panel) var(--enter, 0ms) backwards;
      }

      .nf__dots {
        animation: nv-fade-in 700ms var(--nv-ease-panel) var(--enter, 0ms) backwards;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      nv-page-grid:not(.is-entering),
      nv-page-grid.is-entering {
        .nf__kicker,
        .nf__line,
        .nf__body,
        .nf__path,
        .nf__actions,
        .nf__dots {
          animation: none;
          opacity: 1;
        }
      }
    }

    @media (max-width: 900px) {
      .nf {
        grid-column: 1 / -1;
        gap: var(--nv-space-3);
        padding-block: var(--nv-space-6) var(--nv-space-7);
        padding-inline-end: 0;
      }

      .nf__dots {
        display: none;
      }
    }
  `,
})
export class NotFound {
  protected readonly i18n = inject(I18nService);
  private readonly appReady = inject(AppReadyService);
  private readonly router = inject(Router);

  protected readonly entering = this.appReady.revealed;

  protected delay(beat: keyof typeof ENTRANCE): string {
    return `${ENTRANCE[beat]}ms`;
  }

  protected readonly path = this.router.url;

  private readonly viewport = signal(readViewport());

  private readonly rows = computed(() =>
    Math.max(1, Math.floor(this.viewport().height / readCellSize())),
  );

  protected readonly stacked = computed(() => this.viewport().width <= HOME_STACK_MAX);

  protected readonly minColumns = computed(() => (this.stacked() ? 18 : START_COL + TEXT_COLS));

  protected readonly textArea = computed(() => {
    if (this.stacked()) return null;

    const row = 2 + centreOffset(this.available(), TEXT_ROWS);

    return toGridArea({
      row,
      rowEnd: row + TEXT_ROWS,
      col: START_COL,
      colEnd: START_COL + TEXT_COLS,
    });
  });

  private readonly available = computed(() => Math.max(1, this.rows() - 1));

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
