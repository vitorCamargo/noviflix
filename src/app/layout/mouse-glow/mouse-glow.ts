import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  signal,
  viewChild,
} from '@angular/core';

/**
 * True when the pointer is over something that casts its own glow.
 *
 * `closest` rather than a direct match, because the pointer lands on the
 * artwork or text inside the card, not the card element itself.
 */
export function isGlowSuppressed(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest('[data-glow="card"]') !== null;
}

@Component({
  selector: 'nv-mouse-glow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #glow
      class="glow"
      [class.is-hidden]="suppressed()"
      aria-hidden="true"
    ></div>
  `,
  styles: `
    :host {
      display: contents;
    }

    .glow {
      position: fixed;
      inset-block-start: 0;
      inset-inline-start: 0;
      z-index: var(--nv-z-glow);
      inline-size: var(--nv-glow-size);
      block-size: var(--nv-glow-size);
      margin: calc(var(--nv-glow-size) / -2) 0 0 calc(var(--nv-glow-size) / -2);
      border-radius: 50%;
      pointer-events: none;
      display: none;
      will-change: transform;
      background: radial-gradient(
        circle,
        hsla(0, 0%, 100%, 0.5) 0,
        hsla(0, 0%, 100%, 0.1) 25%,
        hsla(0, 0%, 100%, 0) 70%
      );
      transition: opacity var(--nv-normal) var(--nv-ease);
    }

    /* Yields to a card that is casting its own corner glow. */
    .glow.is-hidden {
      opacity: 0;
    }

    @media (pointer: fine) and (min-width: 576px) {
      .glow {
        display: block;
      }
    }
  `,
})
export class MouseGlow {
  protected readonly suppressed = signal(false);

  private readonly glow = viewChild<ElementRef<HTMLElement>>('glow');

  @HostListener('window:mousemove', ['$event'])
  protected onMove(event: MouseEvent): void {
    const el = this.glow()?.nativeElement;
    if (!el) return;
    el.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
  }

  /**
   * One delegated listener rather than per-card wiring, matching how the cursor
   * detects interactive elements.
   */
  @HostListener('window:pointerover', ['$event'])
  protected onOver(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this.suppressed.set(isGlowSuppressed(event.target));
  }

  @HostListener('window:pointerout', ['$event'])
  protected onOut(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    // relatedTarget is where the pointer is heading; null means it left the page.
    this.suppressed.set(isGlowSuppressed(event.relatedTarget));
  }
}
