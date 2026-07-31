/**
 * Guest session storage and countdown rules, kept as plain functions so the expiry
 * logic can be tested without a clock or a network.
 */

export const GUEST_SESSION_KEY = 'noviflix.guestSession';

/**
 * Discarded this long before the stated expiry.
 *
 * A session that expires during the request is worse than one already treated as gone:
 * the rating fails for a reason the visitor cannot act on.
 */
export const GUEST_SESSION_MARGIN_MS = 60_000;

/**
 * Assumed lifetime for a session stored without one.
 *
 * TMDB issues guest sessions lasting a day. The real figure is derived from the session's
 * own timestamps; this only covers records written before those were kept.
 */
export const GUEST_SESSION_FALLBACK_LIFETIME_MS = 24 * 60 * 60_000;

/**
 * That fallback, net of the margin.
 *
 * Every span this module reports is net, because `remainingMs` counts down to the margin
 * rather than to the stated expiry — mixing a gross fallback with net measurements gave
 * a ring that started at slightly over full.
 */
export const GUEST_SESSION_FALLBACK_USABLE_MS =
  GUEST_SESSION_FALLBACK_LIFETIME_MS - GUEST_SESSION_MARGIN_MS;

export interface StoredGuestSession {
  id: string;
  /** Epoch milliseconds. */
  expiresAt: number;
  /** Epoch milliseconds, so the countdown knows what a full ring means. */
  createdAt?: number;
}

/**
 * Parses TMDB's expiry string.
 *
 * It arrives as `2026-08-01 12:34:56 UTC`, which is not a format `Date` accepts — left
 * alone, Safari returns Invalid Date and Chrome guesses local time, so a session would
 * be trusted for hours after it died. Normalised to ISO first.
 */
export function parseExpiry(raw: string | null | undefined): number | null {
  if (!raw) return null;

  const iso = raw.trim().replace(' UTC', 'Z').replace(' ', 'T');
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Whether a stored session is still usable at `now`. */
export function isUsable(
  session: StoredGuestSession | null,
  now = Date.now(),
): session is StoredGuestSession {
  if (!session?.id) return false;
  return session.expiresAt - GUEST_SESSION_MARGIN_MS > now;
}

/** Milliseconds left before the session is treated as gone. Never negative. */
export function remainingMs(
  session: StoredGuestSession | null,
  now = Date.now(),
): number {
  if (!session) return 0;
  return Math.max(0, session.expiresAt - GUEST_SESSION_MARGIN_MS - now);
}

/**
 * The session's full length, from its own timestamps where available.
 *
 * Derived rather than assumed so the ring stays honest if TMDB ever changes how long a
 * guest session lasts.
 */
export function lifetimeMs(session: StoredGuestSession | null): number {
  if (!session || session.createdAt === undefined) {
    return GUEST_SESSION_FALLBACK_USABLE_MS;
  }

  const usable = session.expiresAt - session.createdAt - GUEST_SESSION_MARGIN_MS;

  // A span shorter than the margin would divide the ring by zero or run it backwards.
  return usable > 0 ? usable : GUEST_SESSION_FALLBACK_USABLE_MS;
}

/** How much of the session is left, 0 to 1. Drives the warning colour. */
export function remainingFraction(
  session: StoredGuestSession | null,
  now = Date.now(),
): number {
  const left = remainingMs(session, now);
  if (left <= 0) return 0;

  return Math.min(1, left / lifetimeMs(session));
}

/**
 * How much of the session has been used, 0 to 1. Drives the ring.
 *
 * The arc fills as the session is spent rather than draining as it runs out: a ring is
 * read as progress through something, so an empty one means "just started" and a full one
 * means "done".
 */
export function elapsedFraction(
  session: StoredGuestSession | null,
  now = Date.now(),
): number {
  if (!session) return 0;
  return 1 - remainingFraction(session, now);
}

/**
 * Countdown as `58m 12s`, or `1h 04m` once there is an hour to show.
 *
 * Seconds are dropped above an hour: they change faster than anyone reads them, and a
 * ticking final digit on a number that large is just noise. Below a minute they are all
 * that is left, so they stay.
 *
 * The unit letters are the same in both languages this app offers, which is why this
 * returns a formatted string rather than translation parameters.
 */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) return `${hours}h ${pad(minutes)}m`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Reads and validates the stored session, returning null for anything odd. */
export function readStored(raw: string | null): StoredGuestSession | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;

    const { id, expiresAt, createdAt } = parsed as Partial<StoredGuestSession>;
    if (typeof id !== 'string' || typeof expiresAt !== 'number') return null;

    return {
      id,
      expiresAt,
      ...(typeof createdAt === 'number' ? { createdAt } : {}),
    };
  } catch {
    // Corrupt or hand-edited storage is treated as absent rather than fatal.
    return null;
  }
}
