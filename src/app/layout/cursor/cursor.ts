import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'nv-cursor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #dot class="dot" [class.is-pressed]="pressed()" aria-hidden="true"></div>
    <div #ring class="ring" [class.is-pressed]="pressed()" aria-hidden="true"></div>
  `,
  styles: `
    :host {
      display: contents;
    }

    .dot,
    .ring {
      position: fixed;
      inset-block-start: 0;
      inset-inline-start: 0;
      z-index: var(--nv-z-cursor);
      pointer-events: none;
      display: none;
      will-change: transform;
    }

    .dot {
      inline-size: 16px;
      block-size: 16px;
      margin: -8px 0 0 -8px;
    }

    .dot::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: var(--nv-text);
      border: 2px solid transparent;
      box-shadow: 0 0 25px 0 rgba(0, 0, 0, 0.5);
      transform: scale(0.5);
      transition: transform 0.2s linear, background 0.2s linear;
    }

    .ring {
      inline-size: 10vh;
      block-size: 10vh;
      margin: -5vh 0 0 -5vh;
      opacity: 0.5;
      transition: transform 0.8s cubic-bezier(0.05, 0.8, 0.4, 1);
    }

    .ring::before {
      content: '';
      position: absolute;
      inset: 0;
      border: thin solid var(--nv-text);
      border-radius: 50%;
      transform: scale(1);
      transition: transform 0.2s linear;
    }

    .dot.is-pressed::before {
      background: hsla(0, 0%, 100%, 0.3);
      border-color: var(--nv-text);
      transform: scale(1);
      transition: transform 0.3s linear, background 0.3s linear;
    }

    .ring.is-pressed::before {
      transform: scale(0.82);
    }

    @media (pointer: fine) and (min-width: 576px) {
      .dot,
      .ring {
        display: block;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ring {
        transition: none;
      }
    }
  `,
})
export class Cursor {
  protected readonly pressed = signal(false);

  private readonly dot = viewChild<ElementRef<HTMLElement>>('dot');
  private readonly ring = viewChild<ElementRef<HTMLElement>>('ring');

  @HostListener('window:mousemove', ['$event'])
  protected onMove(event: MouseEvent): void {
    const transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;

    const dot = this.dot()?.nativeElement;
    const ring = this.ring()?.nativeElement;
    if (dot) dot.style.transform = transform;
    if (ring) ring.style.transform = transform;
  }

  @HostListener('window:mousedown')
  protected onDown(): void {
    this.pressed.set(true);
  }

  @HostListener('window:mouseup')
  @HostListener('window:blur')
  protected onUp(): void {
    this.pressed.set(false);
  }
}
