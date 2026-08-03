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

const RING_RADIUS = 17;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const LOW_FRACTION = 0.15;

const TICK_MS = 1000;

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

  private readonly now = signal(Date.now());
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly remaining = computed(() => remainingMs(this.session(), this.now()));

  protected readonly elapsed = computed(() => elapsedFraction(this.session(), this.now()));

  private readonly left = computed(() => remainingFraction(this.session(), this.now()));

  protected readonly label = computed(() => formatRemaining(this.remaining()));

  protected readonly expired = computed(() => this.session() !== null && this.remaining() <= 0);

  protected readonly low = computed(() => this.left() > 0 && this.left() < LOW_FRACTION);

  protected readonly dashOffset = computed(() => RING_CIRCUMFERENCE * (1 - this.elapsed()));

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
    this.guest.ensure().subscribe({
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
