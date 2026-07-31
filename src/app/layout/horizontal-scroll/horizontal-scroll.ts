import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { TrackState } from './track-state';

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

/**
 * Whether the track is currently a horizontal scroll container.
 *
 * `scrollWidth > clientWidth` alone is not enough to decide this. It reports
 * overflowing content even when `overflow-x` is `visible`, so in stacked mode a
 * single wide descendant made the directive believe it was in charge: it then
 * called `preventDefault()` on every wheel event and wrote to `scrollLeft`,
 * which does nothing on a non-scrolling box. The result was a page that simply
 * refused to scroll. The mode has to come from the computed overflow, which is
 * what the breakpoint actually changes.
 */
export function isHorizontalTrack(overflowX: string): boolean {
  return overflowX === 'auto' || overflowX === 'scroll';
}

/**
 * Pointer travel before a press counts as a drag rather than a click.
 *
 * Without a threshold, the tiny movement between mousedown and mouseup would
 * swallow every click on a card or button.
 */
export const DRAG_THRESHOLD_PX = 6;

export function exceedsDragThreshold(
  totalTravel: number,
  threshold = DRAG_THRESHOLD_PX,
): boolean {
  return Math.abs(totalTravel) > threshold;
}

@Directive({
  selector: '[nvHorizontalScroll]',
  host: {
    tabindex: '0',
    '[class.is-dragging]': 'dragging()',
  },
})
export class HorizontalScroll implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly trackState = inject(TrackState);

  private target = 0;
  private frame: number | null = null;

  /** Pointer id of an in-flight drag, or null. */
  private dragPointer: number | null = null;
  private dragLastX = 0;
  private dragTravel = 0;

  /**
   * True once a press has become a drag, which suppresses text selection.
   *
   * Selection can't be prevented on pointerdown — that would also stop the press
   * focusing an input or reaching a control — so it is allowed to begin and then
   * cancelled at the moment the gesture turns out to be a drag.
   */
  protected readonly dragging = signal(false);

  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  /**
   * Watches the track and its contents for size changes.
   *
   * Measuring once after view init isn't enough: the routed page is lazy, so at
   * that moment the track is still empty and always measures as fitting. That's
   * why the hint only appeared after a manual resize. Observing the children
   * catches the page arriving, its images loading, and any later route change,
   * without needing to know about the router at all.
   */
  ngAfterViewInit(): void {
    if (typeof ResizeObserver === 'undefined') {
      this.measure();
      return;
    }

    const el = this.host.nativeElement;

    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(el);
    this.observeChildren();

    this.mutationObserver = new MutationObserver(() => {
      this.observeChildren();
      this.measure();
    });
    this.mutationObserver.observe(el, { childList: true });

    this.measure();
  }

  ngOnDestroy(): void {
    this.stop();
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.trackState.overflowing.set(false);
  }

  /** Re-observing an element already under observation is a no-op. */
  private observeChildren(): void {
    for (const child of Array.from(this.host.nativeElement.children)) {
      this.resizeObserver?.observe(child);
    }
  }

  /** True only while the track is a scroll rail with somewhere to go. */
  private canScroll(el: HTMLElement): boolean {
    return (
      isHorizontalTrack(getComputedStyle(el).overflowX) &&
      el.scrollWidth > el.clientWidth + 1
    );
  }

  /** Publishes whether there is anything to navigate to, for the hint. */
  private measure(): void {
    const el = this.host.nativeElement;
    this.trackState.overflowing.set(this.canScroll(el));
  }

  @HostListener('wheel', ['$event'])
  protected onWheel(event: WheelEvent): void {
    const el = this.host.nativeElement;

    if (!this.canScroll(el)) return;

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

  // ------------------------------------------------------------ drag to scroll

  @HostListener('pointerdown', ['$event'])
  protected onPointerDown(event: PointerEvent): void {
    // Touch already pans a horizontally-scrollable element natively; taking it
    // over here would only fight the browser's own momentum.
    if (event.pointerType === 'touch') return;

    // Primary button only. A right-click opens the context menu and a
    // middle-click is autoscroll — neither should drag the page.
    if (event.button !== 0) return;

    const el = this.host.nativeElement;
    if (!this.canScroll(el)) return;

    this.dragPointer = event.pointerId;
    this.dragLastX = event.clientX;
    this.dragTravel = 0;
  }

  @HostListener('pointermove', ['$event'])
  protected onPointerMove(event: PointerEvent): void {
    if (this.dragPointer !== event.pointerId) return;

    const dx = event.clientX - this.dragLastX;
    this.dragLastX = event.clientX;
    this.dragTravel += dx;

    if (!exceedsDragThreshold(this.dragTravel)) return;

    const el = this.host.nativeElement;

    // Capture only once the gesture is definitely a drag, so a plain click on a
    // card still reaches it.
    if (!el.hasPointerCapture(event.pointerId)) {
      el.setPointerCapture(event.pointerId);
      this.dragging.set(true);
      // Anything highlighted before the threshold was crossed is discarded, so a
      // drag never leaves a trail of selected titles behind it.
      window.getSelection?.()?.removeAllRanges();
    }

    this.stop();
    // Content follows the hand, so the track moves opposite the pointer.
    el.scrollLeft = clampOffset(
      el.scrollLeft - dx,
      el.scrollWidth,
      el.clientWidth,
    );
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  protected onPointerUp(event: PointerEvent): void {
    if (this.dragPointer !== event.pointerId) return;

    const el = this.host.nativeElement;
    if (el.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    this.dragPointer = null;
    this.dragging.set(false);
  }

  /**
   * Swallows the click that ends a drag.
   *
   * A drag over a poster would otherwise both scroll the track and open the
   * movie, since the browser still fires a click on release.
   */
  @HostListener('click', ['$event'])
  protected onClick(event: MouseEvent): void {
    if (exceedsDragThreshold(this.dragTravel)) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.dragTravel = 0;
  }

  @HostListener('keydown')
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
