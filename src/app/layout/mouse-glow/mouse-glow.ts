import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'nv-mouse-glow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #glow class="glow" aria-hidden="true"></div>`,
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
    }

    @media (pointer: fine) and (min-width: 576px) {
      .glow {
        display: block;
      }
    }
  `,
})
export class MouseGlow {
  private readonly glow = viewChild<ElementRef<HTMLElement>>('glow');

  @HostListener('window:mousemove', ['$event'])
  protected onMove(event: MouseEvent): void {
    const el = this.glow()?.nativeElement;
    if (!el) return;
    el.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
  }
}
