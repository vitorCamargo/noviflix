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
      padding: var(--nv-space-2) var(--nv-space-4);
      border: 1px solid transparent;
      border-radius: var(--nv-radius-pill);
      background: transparent;
      color: var(--nv-text-muted);
      font-size: var(--nv-text-sm);
      font-weight: 600;
      transition:
        color var(--nv-fast) var(--nv-ease),
        border-color var(--nv-fast) var(--nv-ease),
        background var(--nv-fast) var(--nv-ease);

      &:hover {
        color: var(--nv-text);
      }
    }

    .is-open .pv__trigger {
      color: var(--nv-accent);
      border-color: var(--nv-accent-line);
      background: var(--nv-accent-soft);
    }

    .pv__icon {
      display: inline-flex;

      ::ng-deep svg {
        inline-size: 16px;
        block-size: 16px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }

    .pv__panel {
      --pv-width: 560px;
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
      border: 1px solid var(--nv-border);
      border-radius: var(--nv-radius-lg);
      box-shadow: var(--nv-shadow-pop);
      animation: nv-rise var(--nv-normal) var(--nv-ease);
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
      border-inline-start: 1px solid var(--nv-border);
      border-block-start: 1px solid var(--nv-border);
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
