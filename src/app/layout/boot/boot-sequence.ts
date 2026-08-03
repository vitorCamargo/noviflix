export const BOOT_CREEP_TAU_MS = 820;

export const BOOT_CREEP_CEILING = 0.85;

export const BOOT_FINISH_MS = 260;

export const BOOT_BLOOM_MS = 620;

export const BOOT_CLEAR_MS = 420;

export const BOOT_MIN_MS = 720;

export const BOOT_WAIT_MAX_MS = 3200;

export type BootPhase = 'filling' | 'blooming' | 'clearing' | 'done';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function settleAt(readyAt: number | null): number {
  if (readyAt === null) return BOOT_WAIT_MAX_MS;
  return Math.min(Math.max(readyAt, BOOT_MIN_MS), BOOT_WAIT_MAX_MS);
}

function creep(elapsed: number): number {
  return BOOT_CREEP_CEILING * (1 - Math.exp(-Math.max(0, elapsed) / BOOT_CREEP_TAU_MS));
}

export function ringProgress(elapsed: number, readyAt: number | null): number {
  const settle = settleAt(readyAt);
  if (elapsed <= settle) return clamp01(creep(elapsed));

  const from = creep(settle);
  const closing = clamp01((elapsed - settle) / BOOT_FINISH_MS);

  return clamp01(from + (1 - from) * closing);
}

export function bloomProgress(elapsed: number, readyAt: number | null): number {
  const start = settleAt(readyAt) + BOOT_FINISH_MS;
  return clamp01((elapsed - start) / BOOT_BLOOM_MS);
}

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
