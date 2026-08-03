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

@Injectable({ providedIn: 'root' })
export class GuestSessionService {
  private readonly tmdb = inject(TmdbService);

  private readonly stored = signal<StoredGuestSession | null>(readInitial());

  readonly session = this.stored.asReadonly();

  readonly state = signal<GuestSessionState>(isUsable(readInitial()) ? 'ready' : 'idle');

  readonly creating = computed(() => this.state() === 'creating');

  private pending: Observable<string> | null = null;

  ensure(): Observable<string> {
    const current = this.stored();
    if (isUsable(current)) return of(current.id);

    return this.create();
  }

  extend(): Observable<string> {
    this.forget();
    return this.create();
  }

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
    } catch {}
  }

  private write(session: StoredGuestSession): void {
    try {
      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    } catch {}
  }
}

function readInitial(): StoredGuestSession | null {
  try {
    return readStored(localStorage.getItem(GUEST_SESSION_KEY));
  } catch {
    return null;
  }
}
