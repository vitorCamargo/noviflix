import {
  GUEST_SESSION_MARGIN_MS,
  isUsable,
  parseExpiry,
  readStored,
} from './guest-session';

describe('parseExpiry', () => {
  /**
   * TMDB sends `2026-08-01 12:34:56 UTC`, which Date does not accept. Left alone,
   * Safari returns Invalid Date and Chrome guesses local time — so a session would
   * be trusted for hours after it had died, and the rating would fail with no
   * explanation the visitor could act on.
   */
  it('reads TMDB’s space-separated UTC format', () => {
    expect(parseExpiry('2026-08-01 12:34:56 UTC')).toBe(
      Date.parse('2026-08-01T12:34:56Z'),
    );
  });

  it('reads a plain ISO string too', () => {
    expect(parseExpiry('2026-08-01T12:34:56Z')).toBe(
      Date.parse('2026-08-01T12:34:56Z'),
    );
  });

  it('is null for anything unparseable', () => {
    expect(parseExpiry('not a date')).toBeNull();
    expect(parseExpiry('')).toBeNull();
    expect(parseExpiry(null)).toBeNull();
    expect(parseExpiry(undefined)).toBeNull();
  });
});

describe('isUsable', () => {
  const now = Date.parse('2026-07-31T12:00:00Z');

  it('accepts a session with time left', () => {
    expect(isUsable({ id: 'abc', expiresAt: now + 3_600_000 }, now)).toBe(true);
  });

  it('rejects an expired session', () => {
    expect(isUsable({ id: 'abc', expiresAt: now - 1 }, now)).toBe(false);
  });

  /**
   * The margin exists so a session cannot die mid-request. One expiring in seconds
   * is treated as already gone.
   */
  it('rejects a session inside the safety margin', () => {
    expect(
      isUsable({ id: 'abc', expiresAt: now + GUEST_SESSION_MARGIN_MS - 1 }, now),
    ).toBe(false);
    expect(
      isUsable({ id: 'abc', expiresAt: now + GUEST_SESSION_MARGIN_MS + 1 }, now),
    ).toBe(true);
  });

  it('rejects a missing or empty session', () => {
    expect(isUsable(null, now)).toBe(false);
    expect(isUsable({ id: '', expiresAt: now + 3_600_000 }, now)).toBe(false);
  });
});

describe('readStored', () => {
  it('reads a well-formed record', () => {
    expect(readStored('{"id":"abc","expiresAt":123}')).toEqual({
      id: 'abc',
      expiresAt: 123,
    });
  });

  /** Storage is shared with the user's own devtools; nothing there is trusted. */
  it('treats malformed storage as absent rather than throwing', () => {
    expect(readStored('not json')).toBeNull();
    expect(readStored('null')).toBeNull();
    expect(readStored('[]')).toBeNull();
    expect(readStored('{"id":"abc"}')).toBeNull();
    expect(readStored('{"id":123,"expiresAt":123}')).toBeNull();
    expect(readStored('{"id":"abc","expiresAt":"soon"}')).toBeNull();
  });

  it('is null with nothing stored', () => {
    expect(readStored(null)).toBeNull();
    expect(readStored('')).toBeNull();
  });
});
