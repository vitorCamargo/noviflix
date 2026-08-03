import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'nv-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pv" [class.is-open]="isOpen()">
      <button
        #trigger
        type="button"
        class="pv__trigger"
        aria-haspopup="dialog"
        [attr.aria-expanded]="isOpen()"
        (click)="toggle()"
      >
        <span class="pv__icon"><ng-content select="[nvPopoverIcon]" /></span>
        <span class="pv__label">{{ label() }}</span>
      </button>

      @if (isOpen()) {
        <div
          #panel
          class="pv__panel"
          [class.pv__panel--end]="align() === 'end'"
          [class.pv__panel--notch]="notch()"
          [style.--pv-width]="width()"
          role="dialog"
          tabindex="-1"
          [attr.aria-label]="label()"
        >
          <ng-content />
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
    }

    .pv__trigger {
      display: inline-flex;
      align-items: center;
      gap: var(--nv-space-2);
      padding: var(--nv-space-2) var(--nv-space-3);
      border: 0;
      border-radius: var(--nv-radius-pill);
      background: transparent;
      color: var(--nv-text);
      font-size: var(--nv-text-sm);
      font-weight: 600;
      white-space: nowrap;
      transition:
        color var(--nv-dur-swipe) var(--nv-ease-panel),
        background var(--nv-dur-swipe) var(--nv-ease-panel);

      &:hover {
        color: var(--nv-text-muted);
      }
    }

    .pv__label {
      display: var(--nv-popover-label-display, inline);
    }

    .is-open .pv__trigger {
      background: var(--nv-accent-soft);
      color: var(--nv-accent);
    }

    .pv__icon {
      display: inline-flex;

      ::ng-deep svg {
        inline-size: var(--nv-popover-icon-size, 18px);
        block-size: var(--nv-popover-icon-size, 18px);
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }

    .pv__panel {
      --pv-width: 560px;
      white-space: normal;
      position: absolute;
      inset-block-start: calc(100% + var(--nv-space-3));
      inset-inline-start: 0;
      z-index: var(--nv-z-header);
      inline-size: min(var(--pv-width), calc(100vw - var(--nv-space-5) * 2));
      max-block-size: min(72dvh, 720px);
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: var(--nv-space-6);
      background: var(--nv-panel);
      border-radius: var(--nv-radius-lg);
      box-shadow: var(--nv-shadow-pop);
      --nv-mask-radius: var(--nv-radius-lg);
      animation: nv-mask-open var(--nv-dur-mask) var(--nv-ease-panel) both;
    }

    ::ng-deep .pv__panel > * {
      animation: nv-swipe-up var(--nv-dur-swipe) var(--nv-ease-panel) var(--nv-delay-swipe) both;
    }

    .pv__panel--end {
      inset-inline: auto 0;
    }

    .pv__panel--notch::before {
      content: '';
      position: absolute;
      inset-block-start: -5px;
      inset-inline-start: var(--nv-space-6);
      inline-size: 10px;
      block-size: 10px;
      background: var(--nv-panel);
      transform: rotate(45deg);
    }

    .pv__panel--end.pv__panel--notch::before {
      inset-inline: auto var(--nv-space-6);
    }

    @media (max-width: 640px) {
      .pv__panel,
      .pv__panel--end {
        position: fixed;
        inset-block-start: calc(var(--nv-header-height) + var(--nv-space-2));
        inset-inline: var(--nv-space-4);
        inline-size: auto;
      }

      .pv__panel--notch::before {
        display: none;
      }
    }
  `,
})
export class Popover {
  readonly label = input.required<string>();
  readonly align = input<'start' | 'end'>('start');
  readonly width = input('560px');
  readonly notch = input(true);

  readonly opened = output<void>();
  readonly closed = output<void>();

  private readonly open = signal(false);
  protected readonly isOpen = computed(() => this.open());

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected toggle(): void {
    this.open() ? this.close() : this.show();
  }

  show(): void {
    if (this.open()) return;
    this.open.set(true);
    this.opened.emit();
    queueMicrotask(() => this.panel()?.nativeElement.focus());
  }

  close(options: { restoreFocus?: boolean } = {}): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closed.emit();
    if (options.restoreFocus !== false) {
      this.trigger()?.nativeElement.focus();
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close({ restoreFocus: false });
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }
}
