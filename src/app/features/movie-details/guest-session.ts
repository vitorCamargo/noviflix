export const GUEST_SESSION_KEY = 'noviflix.guestSession';

export const GUEST_SESSION_MARGIN_MS = 60_000;

export const GUEST_SESSION_FALLBACK_LIFETIME_MS = 24 * 60 * 60_000;

export const GUEST_SESSION_FALLBACK_USABLE_MS =
  GUEST_SESSION_FALLBACK_LIFETIME_MS - GUEST_SESSION_MARGIN_MS;

export interface StoredGuestSession {
  id: string;
  expiresAt: number;
  createdAt?: number;
}

export function parseExpiry(raw: string | null | undefined): number | null {
  if (!raw) return null;

  const iso = raw.trim().replace(' UTC', 'Z').replace(' ', 'T');
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? null : parsed;
}

export function isUsable(
  session: StoredGuestSession | null,
  now = Date.now(),
): session is StoredGuestSession {
  if (!session?.id) return false;
  return session.expiresAt - GUEST_SESSION_MARGIN_MS > now;
}

export function remainingMs(session: StoredGuestSession | null, now = Date.now()): number {
  if (!session) return 0;
  return Math.max(0, session.expiresAt - GUEST_SESSION_MARGIN_MS - now);
}

export function lifetimeMs(session: StoredGuestSession | null): number {
  if (!session || session.createdAt === undefined) {
    return GUEST_SESSION_FALLBACK_USABLE_MS;
  }

  const usable = session.expiresAt - session.createdAt - GUEST_SESSION_MARGIN_MS;

  return usable > 0 ? usable : GUEST_SESSION_FALLBACK_USABLE_MS;
}

export function remainingFraction(session: StoredGuestSession | null, now = Date.now()): number {
  const left = remainingMs(session, now);
  if (left <= 0) return 0;

  return Math.min(1, left / lifetimeMs(session));
}

export function elapsedFraction(session: StoredGuestSession | null, now = Date.now()): number {
  if (!session) return 0;
  return 1 - remainingFraction(session, now);
}

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
    return null;
  }
}
