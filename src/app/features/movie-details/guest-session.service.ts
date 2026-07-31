import { Injectable, inject } from '@angular/core';
import { Observable, map, of, shareReplay, switchMap, throwError } from 'rxjs';
import { TmdbService } from '../../core/tmdb/tmdb.service';
import {
  GUEST_SESSION_KEY,
  isUsable,
  parseExpiry,
  readStored,
  type StoredGuestSession,
} from './guest-session';

/**
 * Supplies a guest session id, creating one only when needed.
 *
 * Cached in localStorage rather than fetched per rating: TMDB issues these with an
 * expiry measured in hours, and requesting a fresh one for every rating would both
 * waste calls and scatter a visitor's ratings across sessions that have nothing to
 * do with each other.
 */
@Injectable({ providedIn: 'root' })
export class GuestSessionService {
  private readonly tmdb = inject(TmdbService);

  /**
   * In-flight request, shared so concurrent raters don't each create a session.
   *
   * Without this, two quick submissions would race and one would be attributed to
   * a session that is immediately abandoned.
   */
  private pending: Observable<string> | null = null;

  /** A usable session id, from storage or freshly created. */
  sessionId(): Observable<string> {
    const stored = this.read();
    if (isUsable(stored)) return of(stored.id);

    if (this.pending) return this.pending;

    this.pending = this.tmdb.guestSession().pipe(
      switchMap((session) => {
        const expiresAt = parseExpiry(session.expires_at);

        if (!session.success || !session.guest_session_id || expiresAt === null) {
          return throwError(() => new Error('Guest session was refused'));
        }

        this.write({ id: session.guest_session_id, expiresAt });
        return of(session.guest_session_id);
      }),
      // refCount so a failure clears the shared request instead of replaying the
      // error to everyone who asks afterwards.
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    return this.pending.pipe(
      map((id) => {
        this.pending = null;
        return id;
      }),
    );
  }

  /** Forgets the stored session, so the next rating creates a fresh one. */
  clear(): void {
    this.pending = null;
    try {
      localStorage.removeItem(GUEST_SESSION_KEY);
    } catch {
      // Storage can be unavailable in private modes; nothing to recover.
    }
  }

  private read(): StoredGuestSession | null {
    try {
      return readStored(localStorage.getItem(GUEST_SESSION_KEY));
    } catch {
      return null;
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
