/**
 * Guest session storage rules, kept as plain functions so the expiry logic can be
 * tested without a clock or a network.
 */

export const GUEST_SESSION_KEY = 'noviflix.guestSession';

/**
 * Discarded this long before the stated expiry.
 *
 * A session that expires during the request is worse than one already treated as
 * gone: the rating fails for a reason the visitor cannot act on.
 */
export const GUEST_SESSION_MARGIN_MS = 60_000;

export interface StoredGuestSession {
  id: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}

/**
 * Parses TMDB's expiry string.
 *
 * It arrives as `2026-08-01 12:34:56 UTC`, which is not a format `Date` accepts —
 * left alone, Safari returns Invalid Date and Chrome guesses local time, so a
 * session would be trusted for hours after it died. Normalised to ISO first.
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

/** Reads and validates the stored session, returning null for anything odd. */
export function readStored(raw: string | null): StoredGuestSession | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;

    const { id, expiresAt } = parsed as Partial<StoredGuestSession>;
    if (typeof id !== 'string' || typeof expiresAt !== 'number') return null;

    return { id, expiresAt };
  } catch {
    // Corrupt or hand-edited storage is treated as absent rather than fatal.
    return null;
  }
}
