import { Directive, ElementRef, OnDestroy, HostListener, inject } from '@angular/core';

const LINE_HEIGHT_PX = 16;

const EASE = 0.14;

const SETTLE_PX = 0.5;

export interface WheelIntent {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  pageSize: number;
}

export function resolveWheelDelta(intent: WheelIntent): number | null {
  const { deltaX, deltaY, deltaMode, pageSize } = intent;

  if (Math.abs(deltaX) > Math.abs(deltaY)) return null;
  if (deltaY === 0) return null;

  const scale = deltaMode === 1 ? LINE_HEIGHT_PX : deltaMode === 2 ? pageSize : 1;

  return deltaY * scale;
}

export function findNestedVerticalScroller(
  target: Element | null,
  boundary: Element,
  deltaY: number,
): Element | null {
  let node: Element | null = target;

  while (node && node !== boundary) {
    const style = getComputedStyle(node);
    const scrolls = style.overflowY === 'auto' || style.overflowY === 'scroll';
    const hasOverflow = node.scrollHeight > node.clientHeight + 1;

    if (scrolls && hasOverflow) {
      const atTop = node.scrollTop <= 0;
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
      const canMove = deltaY < 0 ? !atTop : !atBottom;
      if (canMove) return node;
    }
    node = node.parentElement;
  }
  return null;
}

export function clampOffset(offset: number, scrollWidth: number, clientWidth: number) {
  return Math.max(0, Math.min(scrollWidth - clientWidth, offset));
}

@Directive({
  selector: '[nvHorizontalScroll]',
  host: {
    tabindex: '0',
  },
})
export class HorizontalScroll implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private target = 0;
  private frame: number | null = null;

  ngOnDestroy(): void {
    this.stop();
  }

  @HostListener('wheel', ['$event'])
  protected onWheel(event: WheelEvent): void {
    const el = this.host.nativeElement;

    if (el.scrollWidth <= el.clientWidth + 1) return;

    if (findNestedVerticalScroller(event.target as Element | null, el, event.deltaY)) {
      return;
    }

    const delta = resolveWheelDelta({
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaMode: event.deltaMode,
      pageSize: el.clientWidth,
    });
    if (delta === null) return;

    const from = this.isAnimating() ? this.target : el.scrollLeft;
    const next = clampOffset(from + delta, el.scrollWidth, el.clientWidth);

    if (next === el.scrollLeft && !this.isAnimating()) return;

    event.preventDefault();
    this.target = next;

    if (this.prefersReducedMotion()) {
      this.stop();
      el.scrollLeft = next;
      return;
    }

    this.start();
  }

  @HostListener('keydown')
  @HostListener('pointerdown')
  protected onManualInput(): void {
    this.stop();
  }

  private isAnimating(): boolean {
    return this.frame !== null;
  }

  private start(): void {
    if (this.isAnimating()) return;

    const step = () => {
      const el = this.host.nativeElement;
      const remaining = this.target - el.scrollLeft;

      if (Math.abs(remaining) < SETTLE_PX) {
        el.scrollLeft = this.target;
        this.frame = null;
        return;
      }

      el.scrollLeft += remaining * EASE;
      this.frame = requestAnimationFrame(step);
    };

    this.frame = requestAnimationFrame(step);
  }

  private stop(): void {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
  }

  private prefersReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    );
  }
}
