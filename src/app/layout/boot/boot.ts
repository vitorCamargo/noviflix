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

@Component({
  selector: 'nv-boot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (phase() !== 'done') {
      <div
        class="bt"
        role="status"
        [attr.aria-label]="i18n.t('boot.loading')"
        [class.is-clearing]="phase() === 'clearing'"
        [style.--bt-ring]="ring()"
        [style.--bt-bloom]="bloom()"
      >
        <span class="bt__lattice" aria-hidden="true"></span>

        <span class="bt__ring" aria-hidden="true">
          <svg class="bt__dial" viewBox="0 0 100 100">
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
      background-position: center center;
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

    .bt__mark {
      position: relative;
      inline-size: 26px;
      block-size: 26px;
      fill: var(--nv-text);
      opacity: calc(0.28 + var(--bt-ring, 0) * 0.72);
      scale: calc(0.9 + var(--bt-ring, 0) * 0.1);
      transition: none;
    }

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

  private readonly elapsed = signal(0);

  private readonly readyAt = signal<number | null>(null);

  private readonly expired = signal(false);

  protected readonly phase = computed<BootPhase>(() =>
    this.expired() ? 'done' : phaseAt(this.elapsed(), this.readyAt()),
  );

  protected readonly ring = computed(() => ringProgress(this.elapsed(), this.readyAt()));

  protected readonly offset = computed(() => ringOffset(this.ring()));

  protected readonly bloom = computed(() => bloomProgress(this.elapsed(), this.readyAt()));

  private readonly started = performance.now();
  private frame: number | null = null;
  private deadline: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const ready = this.app.ready();

      untracked(() => {
        if (ready && this.readyAt() === null) {
          this.readyAt.set(performance.now() - this.started);
        }
      });
    });

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

    this.document.documentElement.classList.add('nv-booting');

    this.frame = requestAnimationFrame(this.tick);

    this.deadline = setTimeout(() => {
      this.expired.set(true);
      this.app.markRevealed();
    }, bootDuration(null));
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private readonly tick = (now: number): void => {
    const elapsed = now - this.started;
    this.elapsed.set(elapsed);

    const phase = phaseAt(elapsed, this.readyAt());
    if (phase === 'clearing' || phase === 'done') this.app.markRevealed();

    if (elapsed >= bootDuration(this.readyAt())) {
      this.stop();
      return;
    }

    this.frame = requestAnimationFrame(this.tick);
  };

  private stop(): void {
    this.app.markRevealed();

    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;

    if (this.deadline !== null) clearTimeout(this.deadline);
    this.deadline = null;

    setTimeout(() => this.document.documentElement.classList.remove('nv-booting'), BOOT_CLEAR_MS);
  }
}
