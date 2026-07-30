import {
  RING_CIRCUMFERENCE,
  SLIDE_DURATION_MS,
  advanceProgress,
  ringOffset,
} from './slide-timer';

describe('advanceProgress', () => {
  it('advances by the elapsed fraction of the duration', () => {
    expect(advanceProgress(0, 1000, 4000)).toBeCloseTo(0.25);
    expect(advanceProgress(0.25, 1000, 4000)).toBeCloseTo(0.5);
  });

  it('clamps at one rather than overshooting', () => {
    expect(advanceProgress(0.9, 9999, 1000)).toBe(1);
  });

  it('never goes below zero on a negative delta', () => {
    expect(advanceProgress(0.1, -9999, 1000)).toBe(0);
  });

  /** A zero frame delta happens on the first frame after a pause. */
  it('is unchanged by a zero delta', () => {
    expect(advanceProgress(0.42, 0, 1000)).toBeCloseTo(0.42);
  });

  it('treats a zero or negative duration as already finished', () => {
    expect(advanceProgress(0, 16, 0)).toBe(1);
    expect(advanceProgress(0, 16, -5)).toBe(1);
  });

  it('reaches one after exactly the default duration', () => {
    expect(advanceProgress(0, SLIDE_DURATION_MS)).toBe(1);
  });
});

describe('ringOffset', () => {
  it('is a full offset at zero progress, so the ring reads empty', () => {
    expect(ringOffset(0)).toBeCloseTo(RING_CIRCUMFERENCE);
  });

  it('is zero at full progress, so the ring reads complete', () => {
    expect(ringOffset(1)).toBe(0);
  });

  it('is half the circumference at halfway', () => {
    expect(ringOffset(0.5)).toBeCloseTo(RING_CIRCUMFERENCE / 2);
  });

  it('clamps out-of-range progress', () => {
    expect(ringOffset(2)).toBe(0);
    expect(ringOffset(-1)).toBeCloseTo(RING_CIRCUMFERENCE);
  });
});
