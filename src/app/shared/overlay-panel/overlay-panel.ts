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
      border: 1px solid var(--nv-border);
      border-radius: var(--nv-radius-lg);
      box-shadow: var(--nv-shadow-pop);
      animation: nv-rise var(--nv-normal) var(--nv-ease);
      overflow: hidden;
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

    .panel__body {
      overflow-y: auto;
      overscroll-behavior: contain;
      min-block-size: 0;
      padding-inline-end: var(--nv-space-3);
    }

    @media (max-width: 900px) {
      .panel__cols {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--nv-space-5);
        overflow-y: auto;
      }

      .panel__aside {
        justify-content: flex-start;
        overflow: visible;
        padding-inline-end: 0;
      }

      .panel__body {
        overflow: visible;
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
