import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, map, of, shareReplay, throwError } from 'rxjs';
import { TmdbService } from '../../core/tmdb/tmdb.service';
import {
  GUEST_SESSION_KEY,
  isUsable,
  parseExpiry,
  readStored,
  type StoredGuestSession,
} from './guest-session';

export type GuestSessionState = 'idle' | 'creating' | 'ready' | 'error';

/**
 * Holds the guest session everything anonymous is attributed to — ratings now, and
 * collections when they arrive.
 *
 * Cached in localStorage rather than fetched per action: TMDB issues these with an
 * expiry measured in hours, and asking for a new one each time would both waste calls
 * and scatter a visitor's ratings across sessions that have nothing to do with each
 * other.
 *
 * There is no endpoint to extend one. TMDB's authentication routes create a guest
 * session or delete a user session, and nothing prolongs an existing one — so `renew`
 * genuinely means "start a new session", which is why it is named that way and why
 * callers have to say so to the visitor.
 */
@Injectable({ providedIn: 'root' })
export class GuestSessionService {
  private readonly tmdb = inject(TmdbService);

  private readonly stored = signal<StoredGuestSession | null>(readInitial());

  readonly session = this.stored.asReadonly();

  readonly state = signal<GuestSessionState>(
    isUsable(readInitial()) ? 'ready' : 'idle',
  );

  readonly creating = computed(() => this.state() === 'creating');

  /** In-flight creation, shared so concurrent callers don't each make one. */
  private pending: Observable<string> | null = null;

  /**
   * A usable session id, from storage or freshly created.
   *
   * Checked on every call rather than once at startup, because a session can expire
   * while the page sits open.
   */
  ensure(): Observable<string> {
    const current = this.stored();
    if (isUsable(current)) return of(current.id);

    return this.create();
  }

  /**
   * Buys more time by swapping the session id in place.
   *
   * TMDB cannot prolong a guest session and offers no way to delete one, so the only
   * lever available is to abandon the old id and store a new one under the same key.
   *
   * What that does and does not preserve is worth being exact about:
   *
   *  - Collections survive, because they are this browser's own data and are keyed by
   *    their own ids, never by the session. Anything stored per-session would break here,
   *    which is why they must not be.
   *  - Ratings already sent do *not* move. They live under the old id on TMDB's side and
   *    there is no endpoint to transfer them. The panel says so rather than implying the
   *    visitor carries their history across.
   */
  extend(): Observable<string> {
    this.forget();
    return this.create();
  }

  /** Forgets the stored session, so the next action creates a fresh one. */
  clear(): void {
    this.forget();
    this.state.set('idle');
  }

  private create(): Observable<string> {
    if (this.pending) return this.pending;

    this.state.set('creating');

    this.pending = this.tmdb.guestSession().pipe(
      map((session) => {
        const expiresAt = parseExpiry(session.expires_at);

        if (!session.success || !session.guest_session_id || expiresAt === null) {
          throw new Error('Guest session was refused');
        }

        // createdAt is recorded now rather than taken from the response, which does not
        // include it — the countdown needs it to know what a full ring means.
        const next: StoredGuestSession = {
          id: session.guest_session_id,
          expiresAt,
          createdAt: Date.now(),
        };

        this.write(next);
        this.stored.set(next);
        this.state.set('ready');

        return next.id;
      }),
      // Cleared however it ends, so a failure doesn't leave a dead request cached and
      // every later attempt replaying the same error.
      finalize(() => {
        this.pending = null;
        if (this.state() === 'creating') this.state.set('error');
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.pending;
  }

  private forget(): void {
    this.pending = null;
    this.stored.set(null);
    try {
      localStorage.removeItem(GUEST_SESSION_KEY);
    } catch {
      // Storage can be unavailable in private modes; nothing to recover.
    }
  }

  private write(session: StoredGuestSession): void {
    try {
      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    } catch {
      // A session that can't be stored still works for this visit.
    }
  }
}

function readInitial(): StoredGuestSession | null {
  try {
    return readStored(localStorage.getItem(GUEST_SESSION_KEY));
  } catch {
    return null;
  }
}

/** Kept for callers that want a failure rather than a silent retry. */
export function guestSessionUnavailable(): Observable<never> {
  return throwError(() => new Error('No guest session'));
}
