/** How long each movie holds before the carousel advances. */
export const SLIDE_DURATION_MS = 7000;

/** Radius of the progress ring in its own viewBox units. */
export const RING_RADIUS = 48;

export const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Progress after `elapsedMs` more milliseconds.
 *
 * Driven by measured frame deltas rather than a fixed increment, so the ring
 * stays in step with wall-clock time even when frames are dropped or the tab
 * throttles in the background.
 */
export function advanceProgress(
  current: number,
  elapsedMs: number,
  durationMs = SLIDE_DURATION_MS,
): number {
  if (durationMs <= 0) return 1;
  return clamp01(current + elapsedMs / durationMs);
}

/**
 * `stroke-dashoffset` for a given progress.
 *
 * Full offset is an empty ring, zero is a complete one, so the arc grows as
 * progress climbs.
 */
export function ringOffset(
  progress: number,
  circumference = RING_CIRCUMFERENCE,
): number {
  return circumference * (1 - clamp01(progress));
}
