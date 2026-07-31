import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  HostListener,
  OnDestroy,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'nv-overlay-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scrim" (click)="requestClose()"></div>

    <div
      #panel
      class="panel"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      [attr.aria-label]="ariaLabel()"
      [style.--panel-width]="width()"
    >
      @if (connector()) {
        <span class="panel__connector" aria-hidden="true"></span>
      }

      <header class="panel__bar">
        <div class="panel__bar-start">
          <ng-content select="[nvPanelToolbar]" />
        </div>

        <div class="panel__bar-end">
          <ng-content select="[nvPanelFilters]" />
        </div>

        <button
          type="button"
          class="panel__close"
          [attr.aria-label]="closeLabel()"
          (click)="requestClose()"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <div class="panel__cols">
        <aside class="panel__aside">
          <ng-content select="[nvPanelAside]" />
        </aside>

        <div class="panel__body">
          <ng-content select="[nvPanelBody]" />
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: `
    @use '../../../styles/mixins' as *;

    :host {
      position: fixed;
      inset: 0;
      z-index: var(--nv-z-modal);
      display: grid;
      place-items: center;
      padding: var(--nv-space-5);
    }

    .scrim {
      position: absolute;
      inset: 0;
      background: var(--nv-overlay);
      backdrop-filter: blur(6px);
      animation: nv-fade-in var(--nv-fast) var(--nv-ease);
    }

    .panel {
      --panel-width: 1240px;
      position: relative;
      display: flex;
      flex-direction: column;
      inline-size: min(var(--panel-width), 100%);
      max-block-size: min(86dvh, 940px);
      background: var(--nv-panel);
      /* Borderless, like the popover — the shadow lifts it off the grid on its
         own, and a drawn edge competes with the lattice behind it. */
      border: 0;
      border-radius: var(--nv-radius-lg);
      box-shadow: var(--nv-shadow-pop);
      animation: nv-rise var(--nv-normal) var(--nv-ease);
      overflow: hidden;
    }

    /*
     * No focus ring on the panel itself.
     *
     * It takes focus on open so screen readers and the keyboard land inside the
     * dialog, but it is a container rather than a control — and a ring around the
     * whole overlay reads as a drawn border, which is exactly what was asked to go.
     * The controls within it keep their own indicators.
     */
    .panel:focus,
    .panel:focus-visible {
      outline: none;
    }

    .panel__connector {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 50%;
      translate: -50% 0;
      inline-size: 140px;
      block-size: 3px;
      border-radius: 0 0 3px 3px;
      background: var(--nv-accent);
      box-shadow: 0 0 18px var(--nv-accent-glow);
    }

    .panel__bar {
      display: flex;
      align-items: center;
      gap: var(--nv-space-4);
      padding: var(--nv-space-5) var(--nv-space-6) var(--nv-space-4);
      flex: none;
    }

    .panel__bar-start {
      display: flex;
      align-items: center;
      gap: var(--nv-space-4);
      min-inline-size: 0;
    }

    .panel__bar-end {
      display: flex;
      align-items: center;
      gap: var(--nv-space-4);
      margin-inline-start: auto;
      min-inline-size: 0;
    }

    .panel__close {
      display: grid;
      place-items: center;
      inline-size: 34px;
      block-size: 34px;
      flex: none;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--nv-close);
      transition:
        background var(--nv-fast) var(--nv-ease),
        transform var(--nv-fast) var(--nv-ease);

      svg {
        inline-size: 17px;
        block-size: 17px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2.2;
        stroke-linecap: round;
      }

      &:hover {
        background: var(--nv-close-soft);
        transform: scale(1.06);
      }
    }

    .panel__cols {
      display: grid;
      grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
      gap: var(--nv-space-6);
      min-block-size: 0;
      flex: 1;
      padding: 0 var(--nv-space-6) var(--nv-space-6);
    }

    .panel__aside {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: var(--nv-space-4);
      padding-inline-end: var(--nv-space-4);
      overflow-y: auto;
      min-block-size: 0;
    }

    /*
     * The one place in the app that shows its scrollbar. Elsewhere the lattice and
     * the scroll hint make movement obvious; inside a panel the content just stops
     * at an edge, with nothing to say there is more below it.
     */
    .panel__body {
      overflow-y: auto;
      /*
       * Explicit, because it isn't the default: setting overflow-y alone computes
       * overflow-x from visible to auto, so a grid a pixel too wide grew a second
       * scrollbar along the bottom. This column scrolls one way only.
       */
      overflow-x: hidden;
      overscroll-behavior: contain;
      min-block-size: 0;
      padding-inline-end: var(--nv-space-4);
      @include slim-scrollbar;
    }

    @media (max-width: 900px) {
      /* The bar carries a toolbar, tabs and a close button. On a narrow screen those
         cannot share one line, and without wrapping they simply overlapped. */
      .panel__bar {
        flex-wrap: wrap;
        row-gap: var(--nv-space-3);
      }

      /*
       * A plain scrolling column, not a one-column grid.
       *
       * Each side is its own scroll region on desktop, which needs a zero block-size
       * minimum to work. Carried into a stacked layout that rule let the body shrink below
       * its content, and with overflow visible the content spilled out of its row and
       * painted over the column above it — the cast grid landing on top of the title.
       * Resetting the minimum is the actual fix; flex just removes any question about
       * which cell things are in.
       */
      .panel__cols {
        display: flex;
        flex-direction: column;
        gap: var(--nv-space-5);
        overflow-y: auto;
        @include slim-scrollbar;
      }

      .panel__aside,
      .panel__body {
        flex: none;
        min-block-size: auto;
        overflow: visible;
        padding-inline-end: 0;
      }

      .panel__aside {
        justify-content: flex-start;
      }
    }

    @media (max-width: 640px) {
      :host {
        padding: 0;
      }

      .panel {
        inline-size: 100%;
        max-block-size: 100dvh;
        block-size: 100dvh;
        border: 0;
        border-radius: 0;
      }

      .panel__connector {
        display: none;
      }
    }
  `,
})
export class OverlayPanel implements OnDestroy {
  readonly ariaLabel = input('');
  readonly closeLabel = input('Close');
  readonly width = input('1240px');
  readonly connector = input(false);

  readonly closed = output<void>();

  private readonly doc = inject(DOCUMENT);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    this.doc.body.classList.add('nv-modal-open');
    queueMicrotask(() => this.panel()?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('nv-modal-open');
  }

  @HostListener('document:keydown.escape')
  protected requestClose(): void {
    this.closed.emit();
  }
}
