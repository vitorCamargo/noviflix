import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';

const SETTLE_MS = 66;

@Component({
  selector: 'nv-scroll-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="sheet" [class.is-active]="scrolling()" aria-hidden="true"></div>`,
  styles: `
    :host {
      display: contents;
    }

    .sheet {
      position: fixed;
      inset: 0;
      z-index: var(--nv-z-scroll-overlay);
      pointer-events: none;
      transform: translateZ(0);
    }

    .sheet.is-active {
      pointer-events: all;
    }
  `,
  host: {
    '(window:wheel)': 'onScroll()',
    '(window:scroll)': 'onScroll()',
  },
})
export class ScrollOverlay implements OnDestroy {
  protected readonly scrolling = signal(false);

  private timer: ReturnType<typeof setTimeout> | null = null;

  protected onScroll(): void {
    this.scrolling.set(true);

    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.scrolling.set(false);
    }, SETTLE_MS);
  }

  ngOnDestroy(): void {
    if (this.timer !== null) clearTimeout(this.timer);
  }
}
