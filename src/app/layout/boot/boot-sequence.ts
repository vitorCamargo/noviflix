/**
 * Timing of the first-load screen, as plain functions.
 *
 * Four beats, in order: the ring fills, the lattice blooms out of it, the screen clears, the whole
 * thing is done. Everything below is a function of elapsed time and one fact — the moment the app
 * said it was ready — so the sequence can be tested without a clock, and the component that draws it
 * only has to pass its frame time in.
 */

/**
 * Time constant of the ring's creep while readiness is unknown.
 *
 * The arc approaches its ceiling asymptotically rather than marching to it: an unknown wait cannot
 * honestly be reported as a fraction, and a bar that fills steadily and then stops is a promise
 * broken in plain sight. This one slows as it goes and never quite arrives.
 */
export const BOOT_CREEP_TAU_MS = 820;

/** As far as the creep is allowed to get. The last of the ring belongs to actually being ready. */
export const BOOT_CREEP_CEILING = 0.85;

/** How long the ring takes to close once readiness lands. */
export const BOOT_FINISH_MS = 260;

/** The lattice blooming out of the closed ring. */
export const BOOT_BLOOM_MS = 620;

/** The screen fading off the page behind it. */
export const BOOT_CLEAR_MS = 420;

/**
 * The shortest the screen is ever shown.
 *
 * A cached load is ready almost at once, and a splash that appears and vanishes inside two frames
 * reads as a glitch rather than an introduction.
 */
export const BOOT_MIN_MS = 720;

/**
 * The longest it will wait to be told.
 *
 * Nothing gets to hold the page: a failed request, a route that never reports, or a network that
 * simply stops all end here, and the screen goes on to finish as though it had been told.
 */
export const BOOT_WAIT_MAX_MS = 3200;

export type BootPhase = 'filling' | 'blooming' | 'clearing' | 'done';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * The moment the ring is allowed to close.
 *
 * Readiness sets it, bounded on both sides: never before the minimum, so the screen is seen, and
 * never after the cap, so it cannot be held.
 */
export function settleAt(readyAt: number | null): number {
  if (readyAt === null) return BOOT_WAIT_MAX_MS;
  return Math.min(Math.max(readyAt, BOOT_MIN_MS), BOOT_WAIT_MAX_MS);
}

/** Where the creep has got to by `elapsed`, on its own. */
function creep(elapsed: number): number {
  return BOOT_CREEP_CEILING * (1 - Math.exp(-Math.max(0, elapsed) / BOOT_CREEP_TAU_MS));
}

/** How far round the arc has gone: 0 at the first frame, 1 when the ring is closed. */
export function ringProgress(elapsed: number, readyAt: number | null): number {
  const settle = settleAt(readyAt);
  if (elapsed <= settle) return clamp01(creep(elapsed));

  const from = creep(settle);
  const closing = clamp01((elapsed - settle) / BOOT_FINISH_MS);

  return clamp01(from + (1 - from) * closing);
}

/** How far the lattice has bloomed: 0 until the ring closes, 1 when the bloom is spent. */
export function bloomProgress(elapsed: number, readyAt: number | null): number {
  const start = settleAt(readyAt) + BOOT_FINISH_MS;
  return clamp01((elapsed - start) / BOOT_BLOOM_MS);
}

/** The last moment of the sequence, after which there is nothing left to draw. */
export function bootDuration(readyAt: number | null): number {
  return settleAt(readyAt) + BOOT_FINISH_MS + BOOT_BLOOM_MS + BOOT_CLEAR_MS;
}

export function phaseAt(elapsed: number, readyAt: number | null): BootPhase {
  const closed = settleAt(readyAt) + BOOT_FINISH_MS;

  if (elapsed < closed) return 'filling';
  if (elapsed < closed + BOOT_BLOOM_MS) return 'blooming';
  if (elapsed < bootDuration(readyAt)) return 'clearing';
  return 'done';
}
