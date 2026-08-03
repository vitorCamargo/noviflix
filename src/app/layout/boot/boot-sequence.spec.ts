import { describe, expect, it } from 'vitest';
import {
  BOOT_BLOOM_MS,
  BOOT_CLEAR_MS,
  BOOT_CREEP_CEILING,
  BOOT_FINISH_MS,
  BOOT_MIN_MS,
  BOOT_WAIT_MAX_MS,
  bloomProgress,
  bootDuration,
  phaseAt,
  ringProgress,
  settleAt,
} from './boot-sequence';

describe('settleAt', () => {
  it('waits out the minimum however early readiness lands', () => {
    expect(settleAt(0)).toBe(BOOT_MIN_MS);
    expect(settleAt(120)).toBe(BOOT_MIN_MS);
  });

  it('lets a later readiness set the moment', () => {
    expect(settleAt(1500)).toBe(1500);
  });

  it('gives up at the cap, told or not', () => {
    expect(settleAt(null)).toBe(BOOT_WAIT_MAX_MS);
    expect(settleAt(99_000)).toBe(BOOT_WAIT_MAX_MS);
  });
});

describe('ringProgress', () => {
  it('starts empty and only ever grows', () => {
    let previous = -1;

    for (let t = 0; t <= 4000; t += 40) {
      const value = ringProgress(t, 1200);

      expect(value, `${t}ms`).toBeGreaterThanOrEqual(previous);
      previous = value;
    }

    expect(ringProgress(0, 1200)).toBe(0);
  });

  it('never claims to be finished while it is waiting', () => {
    for (const t of [200, 600, 1000, 2000, 3000]) {
      expect(ringProgress(t, null), `${t}ms`).toBeLessThan(BOOT_CREEP_CEILING);
    }
  });

  it('closes exactly when the finish is spent', () => {
    const readyAt = 1400;

    expect(ringProgress(readyAt, readyAt)).toBeLessThan(1);
    expect(ringProgress(readyAt + BOOT_FINISH_MS, readyAt)).toBe(1);
  });

  it('stays closed afterwards', () => {
    expect(ringProgress(9000, 1400)).toBe(1);
  });

  it('closes at the cap when nothing ever reports', () => {
    expect(ringProgress(BOOT_WAIT_MAX_MS + BOOT_FINISH_MS, null)).toBe(1);
  });
});

describe('bloomProgress', () => {
  it('holds at nothing until the ring has closed', () => {
    const readyAt = 900;

    expect(bloomProgress(readyAt, readyAt)).toBe(0);
    expect(bloomProgress(readyAt + BOOT_FINISH_MS, readyAt)).toBe(0);
  });

  it('runs from nothing to everything over the bloom', () => {
    const readyAt = 900;
    const start = readyAt + BOOT_FINISH_MS;

    expect(bloomProgress(start + BOOT_BLOOM_MS / 2, readyAt)).toBeCloseTo(0.5, 5);
    expect(bloomProgress(start + BOOT_BLOOM_MS, readyAt)).toBe(1);
    expect(bloomProgress(start + BOOT_BLOOM_MS * 3, readyAt)).toBe(1);
  });
});

describe('phaseAt', () => {
  it('runs the four beats in order, each once', () => {
    const readyAt = 1000;
    const seen: string[] = [];

    for (let t = 0; t <= bootDuration(readyAt) + 200; t += 20) {
      const phase = phaseAt(t, readyAt);
      if (phase !== seen.at(-1)) seen.push(phase);
    }

    expect(seen).toEqual(['filling', 'blooming', 'clearing', 'done']);
  });

  it('is done exactly when the sequence is spent', () => {
    const readyAt = 1000;
    const end = bootDuration(readyAt);

    expect(phaseAt(end - 1, readyAt)).toBe('clearing');
    expect(phaseAt(end, readyAt)).toBe('done');
  });

  it('lasts the minimum even when readiness is immediate', () => {
    expect(bootDuration(0)).toBe(BOOT_MIN_MS + BOOT_FINISH_MS + BOOT_BLOOM_MS + BOOT_CLEAR_MS);
  });

  it('cannot be held past the cap', () => {
    expect(bootDuration(null)).toBe(
      BOOT_WAIT_MAX_MS + BOOT_FINISH_MS + BOOT_BLOOM_MS + BOOT_CLEAR_MS,
    );
    expect(bootDuration(60_000)).toBe(bootDuration(null));
  });
});
