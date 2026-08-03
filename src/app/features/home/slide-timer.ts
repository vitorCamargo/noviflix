export const SLIDE_DURATION_MS = 7000;

export const RING_RADIUS = 48;

export const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function advanceProgress(
  current: number,
  elapsedMs: number,
  durationMs = SLIDE_DURATION_MS,
): number {
  if (durationMs <= 0) return 1;
  return clamp01(current + elapsedMs / durationMs);
}

export function ringOffset(progress: number, circumference = RING_CIRCUMFERENCE): number {
  return circumference * (1 - clamp01(progress));
}
