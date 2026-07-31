import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TrackState } from '../horizontal-scroll/track-state';

/**
 * Distance the page must have moved before the control appears.
 *
 * Roughly a viewport's worth of travel. Offering a way back after a few pixels is
 * noise — the start is still on screen.
 */
const REVEAL_PX = 400;

/**
 * Bottom-right control returning the page to where it began.
 *
 * Which direction that is depends on the layout, and so does the wording: the
 * desktop page travels sideways, so it goes back to the *start*; the stacked page
 * travels down, so it goes back to the *top*. Calling both "top" would be wrong on
 * one of them.
 */
@Component({
  selector: 'nv-scroll-top',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <button
        type="button"
        class="top"
        [attr.aria-label]="label()"
        (click)="reset()"
      >
        <span class="top__glyph" aria-hidden="true">
          <!-- Rotated by CSS rather than swapped for a second path: one arrow,
               pointing whichever way the page actually travels. -->
          <svg viewBox="0 0 24 24">
            <path d="M12 20V5" />
            <path d="M6 11l6-6 6 6" />
          </svg>
        </span>
        <span class="top__text">{{ label() }}</span>
      </button>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    /*
     * Mirrors the scroll hint on the opposite corner, at the same height. Unlike
     * the hint this one is interactive, so it takes pointer events.
     */
    .top {
      position: fixed;
      inset-block-end: var(--nv-space-6);
      inset-inline-end: var(--nv-space-6);
      z-index: var(--nv-z-content);
      display: flex;
      align-items: center;
      gap: var(--nv-space-3);
      padding: var(--nv-space-2) var(--nv-space-4) var(--nv-space-2)
        var(--nv-space-3);
      border: 1px solid var(--nv-border);
      border-radius: var(--nv-radius-pill);
      background: var(--nv-panel);
      color: var(--nv-text);
      font-size: var(--nv-text-sm);
      font-weight: 600;
      box-shadow: var(--nv-shadow-pop);
      animation: nv-fade-in var(--nv-normal) var(--nv-ease);
      transition:
        border-color var(--nv-fast) var(--nv-ease),
        color var(--nv-fast) var(--nv-ease);

      &:hover {
        border-color: var(--nv-accent-line);
        color: var(--nv-accent);
      }
    }

    .top__glyph svg {
      display: block;
      inline-size: 18px;
      block-size: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Desktop travels sideways, so the arrow points back along that axis. */
    @media (min-width: 901px) {
      .top__glyph svg {
        rotate: -90deg;
      }
    }

    /* The label is the first thing to go when there is no room for it. */
    @media (max-width: 480px) {
      .top {
        padding: var(--nv-space-3);
      }

      .top__text {
        display: none;
      }
    }
  `,
})
export class ScrollTop implements OnDestroy {
  protected readonly i18n = inject(I18nService);
  private readonly track = inject(TrackState);

  /**
   * Whether the page is the vertically-scrolling variant.
   *
   * Read from the same breakpoint the stylesheet uses, because the label has to
   * agree with which axis actually moves — CSS can swap an icon but not wording.
   */
  private readonly stacked = signal(matchesStacked());
  private readonly query =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 900px)')
      : null;

  private readonly onQueryChange = () => this.stacked.set(matchesStacked());

  /** Vertical position, tracked only because the stacked page uses it. */
  private readonly pageOffset = signal(readPageOffset());

  protected readonly label = computed(() =>
    this.i18n.t(this.stacked() ? 'scroll.toTop' : 'scroll.toStart'),
  );

  protected readonly visible = computed(() =>
    this.stacked()
      ? this.pageOffset() > REVEAL_PX
      : this.track.overflowing() && this.track.offset() > REVEAL_PX,
  );

  constructor() {
    this.query?.addEventListener('change', this.onQueryChange);
  }

  ngOnDestroy(): void {
    this.query?.removeEventListener('change', this.onQueryChange);
  }

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.pageOffset.set(readPageOffset());
  }

  protected reset(): void {
    if (this.stacked()) {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
      return;
    }
    // The track owns its own easing, so this only asks.
    this.track.returnToStart();
  }
}

function matchesStacked(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(max-width: 900px)').matches === true;
}

function readPageOffset(): number {
  if (typeof window === 'undefined') return 0;
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}
