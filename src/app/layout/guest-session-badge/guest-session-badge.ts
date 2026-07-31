import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { Popover } from '../../shared/popover/popover';
import { GuestSessionService } from '../../features/movie-details/guest-session.service';
import {
  elapsedFraction,
  formatRemaining,
  remainingFraction,
  remainingMs,
} from '../../features/movie-details/guest-session';

/** Ring geometry. Radius is in the viewBox's own units, not pixels. */
const RING_RADIUS = 17;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Below this the ring turns to the warning colour. */
const LOW_FRACTION = 0.15;

/** How often the countdown redraws. */
const TICK_MS = 1000;

/**
 * Guest session indicator: a ring counting down the session's remaining life, with the
 * time and a way to start a new one behind it.
 *
 * The session is what ratings — and collections, when they arrive — are attributed to,
 * so it is worth being able to see. Without this it expires invisibly and the next
 * rating fails for a reason nobody could have anticipated.
 *
 * Desktop only. The bar has no room for it on a phone, where the labels are already
 * hidden to fit.
 */
@Component({
  selector: 'nv-guest-session-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Popover],
  templateUrl: './guest-session-badge.html',
  styleUrl: './guest-session-badge.scss',
})
export class GuestSessionBadge implements OnDestroy {
  protected readonly i18n = inject(I18nService);
  private readonly guest = inject(GuestSessionService);

  protected readonly radius = RING_RADIUS;
  protected readonly circumference = RING_CIRCUMFERENCE;

  protected readonly session = this.guest.session;
  protected readonly creating = this.guest.creating;

  /**
   * Ticks only while there is something to count down.
   *
   * A timer running against no session would redraw the header once a second for the
   * life of the page to say the same nothing.
   */
  private readonly now = signal(Date.now());
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly remaining = computed(() =>
    remainingMs(this.session(), this.now()),
  );

  /** How much of the session is spent — what the ring draws. */
  protected readonly elapsed = computed(() =>
    elapsedFraction(this.session(), this.now()),
  );

  /** How much is left — what decides whether to warn. */
  private readonly left = computed(() =>
    remainingFraction(this.session(), this.now()),
  );

  protected readonly label = computed(() => formatRemaining(this.remaining()));

  protected readonly expired = computed(
    () => this.session() !== null && this.remaining() <= 0,
  );

  protected readonly low = computed(
    () => this.left() > 0 && this.left() < LOW_FRACTION,
  );

  /**
   * Dash offset drawing the arc.
   *
   * A full circumference offset leaves the circle undrawn, so this counts *down* as the
   * session is used: nothing at the start, a complete ring once spent.
   */
  protected readonly dashOffset = computed(
    () => RING_CIRCUMFERENCE * (1 - this.elapsed()),
  );

  /** Local expiry time, for the panel — the countdown alone hides *when* it ends. */
  protected readonly expiresAt = computed(() => {
    const at = this.session()?.expiresAt;
    return at === undefined
      ? null
      : this.i18n.formatDate(new Date(at).toISOString(), {
          hour: '2-digit',
          minute: '2-digit',
        });
  });

  constructor() {
    /*
     * Created on load rather than on first rating.
     *
     * The alternative is a header that shows nothing until someone rates a film, which
     * makes the indicator useless exactly when it would be most informative. It costs
     * one call per hour per visitor, and the session is reused from storage in between.
     */
    this.guest.ensure().subscribe({
      // A failure is already recorded in the service's state; nothing to add here, but
      // an unhandled error would surface in the console as a crash.
      error: () => undefined,
    });

    this.timer = setInterval(() => this.now.set(Date.now()), TICK_MS);
  }

  ngOnDestroy(): void {
    if (this.timer !== null) clearInterval(this.timer);
  }

  protected extend(): void {
    this.guest.extend().subscribe({ error: () => undefined });
  }
}
