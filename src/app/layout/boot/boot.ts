import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, take } from 'rxjs';
import { AppReadyService } from '../../core/app-ready.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { RING_CIRCUMFERENCE, RING_RADIUS, ringOffset } from '../../features/home/slide-timer';
import {
  BOOT_CLEAR_MS,
  type BootPhase,
  bloomProgress,
  bootDuration,
  phaseAt,
  ringProgress,
} from './boot-sequence';

/**
 * The first-load screen: a ring closing, the lattice blooming out of it, then the page.
 *
 * The three beats say something in order. The ring is the wait, and it is honest about it — an
 * asymptotic creep while nothing is known, closing only once the app reports a first screen. The
 * bloom is the lattice arriving, the same 64px pitch every page is built on, spreading from the point
 * the ring occupied. The clear is the screen getting out of the way.
 *
 * Drawn from one frame loop rather than from CSS keyframes. The wait has no fixed length, so the
 * beats cannot be written as a fixed animation — and a single clock means the arc, the bloom and the
 * fade cannot drift apart from each other.
 *
 * Shown once per document load, which is what it is for. It is not a route, so navigating does not
 * bring it back; reloading does, because that is a first load again.
 */
@Component({
  selector: 'nv-boot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (phase() !== 'done') {
      <!--
        A live region says what is happening for anyone who cannot see it happen. Nothing here takes
        focus: the page behind is already built, and the screen is about to leave.
      -->
      <div
        class="bt"
        role="status"
        [attr.aria-label]="i18n.t('boot.loading')"
        [class.is-clearing]="phase() === 'clearing'"
        [style.--bt-ring]="ring()"
        [style.--bt-bloom]="bloom()"
      >
        <!-- The lattice, blooming out of the ring. -->
        <span class="bt__lattice" aria-hidden="true"></span>

        <span class="bt__ring" aria-hidden="true">
          <svg class="bt__dial" viewBox="0 0 100 100">
            <!-- Faint full circle, so the ring reads as a shape before the arc has any length. -->
            <circle class="bt__track" cx="50" cy="50" [attr.r]="radius" />
            <circle
              class="bt__arc"
              cx="50"
              cy="50"
              [attr.r]="radius"
              [attr.stroke-dasharray]="circumference"
              [attr.stroke-dashoffset]="offset()"
            />
          </svg>

          <!-- The mark, which arrives as the ring closes rather than waiting the whole time. -->
          <svg class="bt__mark" viewBox="0 0 26 26">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M25.2117 10.1891L23.4198 24.8979C23.3683 25.3321 23.035 25.6158 22.5594 25.6158H15.2324C14.7569 25.6158 14.5142 25.3765 14.5142 24.9965V24.8979L16.3184 9.9523C16.414 9.3799 16.5047 8.8125 16.5047 8.2426C16.5047 7.3865 16.414 6.8585 16.1272 6.4786C15.7497 5.958 15.0878 5.7681 14.1857 5.7681C12.9086 5.7681 11.2049 6.0049 11.2049 6.0049L8.886 24.8979C8.83942 25.3321 8.5134 25.6158 8.0403 25.6158H0.703526C0.235326 25.6158 0 25.3765 0 24.9965V24.8979L2.60329 3.6686C2.78959 1.9564 4.54473 1.4803 7.56965 0.905499C9.93271 0.426799 13.2395 0 16.2228 0C19.4413 0 21.9981 0.3356 23.6527 1.6209C24.8783 2.5239 25.5868 3.9523 25.5868 6.1875C25.5868 7.4802 25.3441 8.9062 25.2117 10.1891Z"
            />
          </svg>
        </span>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    /*
     * Under the cursor and over everything else.
     *
     * The pointer keeps its own layer because the custom cursor replaces the native one — covering it
     * would leave the mouse invisible for the length of the introduction.
     */
    .bt {
      position: fixed;
      inset: 0;
      z-index: var(--nv-z-boot);
      display: grid;
      place-items: center;
      background: var(--nv-bg);
      transition: opacity var(--nv-normal) var(--nv-ease);
    }

    .bt.is-clearing {
      opacity: 0;
      pointer-events: none;
    }

    /*
     * The lattice, as one painted layer rather than a field of elements.
     *
     * Three gradients on the drum pitch: a dot at every crossing and a hairline along each axis — the
     * same seams the pads leave. A radial mask decides how much of it exists, and the bloom fraction
     * drives that mask outward, so the grid appears to spread from the ring rather than fade in as a
     * whole.
     */
    .bt__lattice {
      position: absolute;
      inset: 0;
      opacity: calc(var(--bt-bloom, 0) * 0.9);
      background-image:
        radial-gradient(
          circle,
          color-mix(in srgb, var(--nv-accent) 70%, transparent) 1.4px,
          transparent 1.8px
        ),
        linear-gradient(
          to right,
          color-mix(in srgb, var(--nv-accent) 22%, transparent) 1px,
          transparent 1px
        ),
        linear-gradient(
          to bottom,
          color-mix(in srgb, var(--nv-accent) 22%, transparent) 1px,
          transparent 1px
        );
      background-size: var(--nv-grid-cell) var(--nv-grid-cell);
      /* Anchored to the centre, so the crossings line up with the ring the bloom comes out of. */
      background-position: center center;
      /*
       * The reach grows with the bloom and the near edge follows it, so the light is a ring of
       * arriving grid rather than a disc that simply gets bigger.
       */
      mask-image: radial-gradient(
        circle at 50% 50%,
        transparent calc(var(--bt-bloom, 0) * 22%),
        #000 calc(6% + var(--bt-bloom, 0) * 30%),
        transparent calc(10% + var(--bt-bloom, 0) * 62%)
      );
    }

    .bt__ring {
      position: relative;
      display: grid;
      place-items: center;
      inline-size: 96px;
      block-size: 96px;
      /* Shrinks away as the screen clears, so the mark leaves rather than merely fading. */
      transition:
        scale var(--nv-normal) var(--nv-ease),
        opacity var(--nv-normal) var(--nv-ease);
    }

    .bt.is-clearing .bt__ring {
      scale: 0.72;
    }

    .bt__dial {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      /* Rotated so the arc starts at twelve o'clock rather than three. */
      rotate: -90deg;
    }

    .bt__track {
      fill: none;
      stroke: var(--nv-border-strong);
      stroke-width: 2;
    }

    .bt__arc {
      fill: none;
      stroke: var(--nv-accent);
      stroke-width: 2;
      stroke-linecap: round;
      filter: drop-shadow(0 0 10px var(--nv-accent-glow));
    }

    /*
     * There from the first frame, but dim, brightening as the arc comes round — so the ring reads as
     * filling towards something rather than towards nothing. Driven by the same fraction as the arc:
     * one clock, so nothing can drift.
     */
    .bt__mark {
      position: relative;
      inline-size: 26px;
      block-size: 26px;
      fill: var(--nv-text);
      opacity: calc(0.28 + var(--bt-ring, 0) * 0.72);
      scale: calc(0.9 + var(--bt-ring, 0) * 0.1);
      transition: none;
    }

    /*
     * Nothing moves for anyone who asked for that.
     *
     * The screen still appears and still leaves — it is covering a page that is being built, and
     * skipping it entirely would show that happening. What goes is the travel: no creeping arc, no
     * spreading grid, no shrinking mark.
     */
    @media (prefers-reduced-motion: reduce) {
      .bt__lattice {
        mask-image: none;
        opacity: calc(var(--bt-bloom, 0) * 0.4);
      }

      .bt__arc {
        display: none;
      }

      .bt__mark {
        opacity: 1;
        scale: 1;
      }

      .bt__track {
        stroke: var(--nv-accent);
      }

      .bt.is-clearing .bt__ring {
        scale: 1;
      }
    }
  `,
})
export class BootScreen implements OnDestroy {
  protected readonly i18n = inject(I18nService);
  private readonly app = inject(AppReadyService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  protected readonly radius = RING_RADIUS;
  protected readonly circumference = RING_CIRCUMFERENCE;

  /** Milliseconds since the screen appeared, from the frame loop. */
  private readonly elapsed = signal(0);

  /** When the app reported a first screen, or null while it has not. */
  private readonly readyAt = signal<number | null>(null);

  /**
   * Set when the sequence has run out of time, whatever the frame loop has managed.
   *
   * A tab loaded in the background gets no animation frames at all, so the clock the sequence reads
   * simply stops — and the screen would still be sitting there, at its first frame, whenever the tab
   * was finally looked at. This is measured on a timer instead, which a hidden tab still gets.
   */
  private readonly expired = signal(false);

  protected readonly phase = computed<BootPhase>(() =>
    this.expired() ? 'done' : phaseAt(this.elapsed(), this.readyAt()),
  );

  /** How far round the arc has come, for the dial and for the mark it fills towards. */
  protected readonly ring = computed(() =>
    ringProgress(this.elapsed(), this.readyAt()),
  );

  protected readonly offset = computed(() => ringOffset(this.ring()));

  protected readonly bloom = computed(() =>
    bloomProgress(this.elapsed(), this.readyAt()),
  );

  private readonly started = performance.now();
  private frame: number | null = null;
  private deadline: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    /*
     * Readiness is recorded as a time, not a flag.
     *
     * The sequence is a function of elapsed time and that one moment, so the frame loop stays a
     * plain read of the clock and every beat can be worked out from either.
     */
    effect(() => {
      const ready = this.app.ready();

      untracked(() => {
        if (ready && this.readyAt() === null) {
          this.readyAt.set(performance.now() - this.started);
        }
      });
    });

    /*
     * Every other landing page is ready as soon as it is routed to.
     *
     * Only the home page fetches anything for its first screen; a deep link to the collections or a
     * film has its content to hand, and waiting on a report that will never come would hold the
     * screen for the length of the cap.
     */
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        take(1),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        const path = event.urlAfterRedirects.split(/[?#(]/)[0];
        if (path !== '/') this.app.markReady();
      });

    // The page behind must not scroll while it is covered: a wheel over the screen would move a
    // page nobody can see, and land somewhere unexpected once it clears.
    this.document.documentElement.classList.add('nv-booting');

    this.frame = requestAnimationFrame(this.tick);

    // The longest the sequence can possibly last, measured off the animation clock so that a tab
    // which never gets a frame still finishes.
    this.deadline = setTimeout(() => this.expired.set(true), bootDuration(null));
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private readonly tick = (now: number): void => {
    const elapsed = now - this.started;
    this.elapsed.set(elapsed);

    if (elapsed >= bootDuration(this.readyAt())) {
      this.stop();
      return;
    }

    this.frame = requestAnimationFrame(this.tick);
  };

  private stop(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;

    if (this.deadline !== null) clearTimeout(this.deadline);
    this.deadline = null;

    // Released a touch after the fade so the scroll position cannot jump under the last frame of it.
    setTimeout(
      () => this.document.documentElement.classList.remove('nv-booting'),
      BOOT_CLEAR_MS,
    );
  }
}
