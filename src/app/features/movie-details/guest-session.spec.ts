import {
  GUEST_SESSION_FALLBACK_USABLE_MS,
  GUEST_SESSION_MARGIN_MS,
  elapsedFraction,
  formatRemaining,
  isUsable,
  lifetimeMs,
  parseExpiry,
  readStored,
  remainingFraction,
  remainingMs,
} from './guest-session';

const NOW = Date.parse('2026-07-31T12:00:00Z');
const HOUR = 60 * 60_000;

function session(overrides: Partial<{ expiresAt: number; createdAt: number }> = {}) {
  return {
    id: 'abc',
    createdAt: NOW,
    expiresAt: NOW + HOUR,
    ...overrides,
  };
}

describe('parseExpiry', () => {
  it('reads TMDB’s space-separated UTC format', () => {
    expect(parseExpiry('2026-08-01 12:34:56 UTC')).toBe(Date.parse('2026-08-01T12:34:56Z'));
  });

  it('reads a plain ISO string too', () => {
    expect(parseExpiry('2026-08-01T12:34:56Z')).toBe(Date.parse('2026-08-01T12:34:56Z'));
  });

  it('is null for anything unparseable', () => {
    expect(parseExpiry('not a date')).toBeNull();
    expect(parseExpiry('')).toBeNull();
    expect(parseExpiry(null)).toBeNull();
    expect(parseExpiry(undefined)).toBeNull();
  });
});

describe('isUsable', () => {
  it('accepts a session with time left', () => {
    expect(isUsable(session(), NOW)).toBe(true);
  });

  it('rejects an expired session', () => {
    expect(isUsable(session({ expiresAt: NOW - 1 }), NOW)).toBe(false);
  });

  it('rejects a session inside the safety margin', () => {
    const inside = session({ expiresAt: NOW + GUEST_SESSION_MARGIN_MS - 1 });
    const outside = session({ expiresAt: NOW + GUEST_SESSION_MARGIN_MS + 1 });

    expect(isUsable(inside, NOW)).toBe(false);
    expect(isUsable(outside, NOW)).toBe(true);
  });

  it('rejects a missing or empty session', () => {
    expect(isUsable(null, NOW)).toBe(false);
    expect(isUsable({ id: '', expiresAt: NOW + HOUR }, NOW)).toBe(false);
  });
});

describe('remainingMs', () => {
  it('counts down to the safety margin, not to the stated expiry', () => {
    expect(remainingMs(session(), NOW)).toBe(HOUR - GUEST_SESSION_MARGIN_MS);
  });

  it('never goes below zero', () => {
    expect(remainingMs(session({ expiresAt: NOW - HOUR }), NOW)).toBe(0);
    expect(remainingMs(null, NOW)).toBe(0);
  });
});

describe('lifetimeMs', () => {
  it('derives the span from the session’s own timestamps', () => {
    expect(lifetimeMs(session())).toBe(HOUR - GUEST_SESSION_MARGIN_MS);
  });

  it('falls back for a session stored without a creation time', () => {
    expect(lifetimeMs({ id: 'abc', expiresAt: NOW + HOUR })).toBe(GUEST_SESSION_FALLBACK_USABLE_MS);
  });

  it('falls back for a nonsensical span', () => {
    expect(lifetimeMs(session({ expiresAt: NOW }))).toBe(GUEST_SESSION_FALLBACK_USABLE_MS);
  });
});

describe('remainingFraction', () => {
  it('is full at the moment of creation', () => {
    expect(remainingFraction(session(), NOW)).toBe(1);
  });

  it('is about half way through', () => {
    const half = remainingFraction(session(), NOW + (HOUR - GUEST_SESSION_MARGIN_MS) / 2);
    expect(half).toBeCloseTo(0.5, 2);
  });

  it('is empty once spent', () => {
    expect(remainingFraction(session(), NOW + HOUR)).toBe(0);
    expect(remainingFraction(null, NOW)).toBe(0);
  });

  it('never exceeds one, even with a clock behind the session', () => {
    expect(remainingFraction(session(), NOW - HOUR)).toBe(1);
  });
});

describe('elapsedFraction', () => {
  it('is empty at the moment of creation', () => {
    expect(elapsedFraction(session(), NOW)).toBe(0);
  });

  it('is half way through the session', () => {
    const mid = NOW + (HOUR - GUEST_SESSION_MARGIN_MS) / 2;
    expect(elapsedFraction(session(), mid)).toBeCloseTo(0.5, 2);
  });

  it('is complete once spent', () => {
    expect(elapsedFraction(session(), NOW + HOUR)).toBe(1);
  });

  it('is empty with no session at all, rather than complete', () => {
    expect(elapsedFraction(null, NOW)).toBe(0);
  });

  it('is the complement of what is left', () => {
    for (const offset of [0, HOUR / 4, HOUR / 2, HOUR]) {
      const at = NOW + offset;
      expect(elapsedFraction(session(), at) + remainingFraction(session(), at)).toBeCloseTo(1, 6);
    }
  });
});

describe('formatRemaining', () => {
  it('shows minutes and seconds under an hour', () => {
    expect(formatRemaining(58 * 60_000 + 12_000)).toBe('58m 12s');
  });

  it('pads the seconds so the label does not change width as it ticks', () => {
    expect(formatRemaining(5 * 60_000 + 4_000)).toBe('5m 04s');
  });

  it('drops the seconds once there is an hour to show', () => {
    expect(formatRemaining(HOUR + 4 * 60_000 + 30_000)).toBe('1h 04m');
  });

  it('shows seconds alone in the final minute', () => {
    expect(formatRemaining(9_000)).toBe('9s');
  });

  it('shows zero rather than a negative', () => {
    expect(formatRemaining(0)).toBe('0s');
    expect(formatRemaining(-5_000)).toBe('0s');
  });
});

describe('readStored', () => {
  it('reads a well-formed record', () => {
    expect(readStored('{"id":"abc","expiresAt":123,"createdAt":1}')).toEqual({
      id: 'abc',
      expiresAt: 123,
      createdAt: 1,
    });
  });

  it('reads a record without a creation time', () => {
    expect(readStored('{"id":"abc","expiresAt":123}')).toEqual({
      id: 'abc',
      expiresAt: 123,
    });
  });

  it('treats malformed storage as absent rather than throwing', () => {
    expect(readStored('not json')).toBeNull();
    expect(readStored('null')).toBeNull();
    expect(readStored('[]')).toBeNull();
    expect(readStored('{"id":123,"expiresAt":123}')).toBeNull();
    expect(readStored('{"id":"abc","expiresAt":"soon"}')).toBeNull();
  });

  it('ignores a creation time of the wrong type rather than failing', () => {
    expect(readStored('{"id":"abc","expiresAt":123,"createdAt":"nope"}')).toEqual({
      id: 'abc',
      expiresAt: 123,
    });
  });

  it('is null with nothing stored', () => {
    expect(readStored(null)).toBeNull();
    expect(readStored('')).toBeNull();
  });
});
