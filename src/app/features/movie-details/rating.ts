export const RATING_MIN = 0.5;
export const RATING_MAX = 10;
export const RATING_STEP = 0.5;

export const RATING_VALUES: readonly number[] = Array.from(
  { length: Math.round((RATING_MAX - RATING_MIN) / RATING_STEP) + 1 },
  (_, i) => round(RATING_MIN + i * RATING_STEP),
);

export const RATING_STARS = Math.round(RATING_MAX / 2);

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function snapRating(value: number): number {
  if (!Number.isFinite(value)) return RATING_MIN;

  const snapped = round(Math.round(value / RATING_STEP) * RATING_STEP);
  return Math.min(RATING_MAX, Math.max(RATING_MIN, snapped));
}

export function isValidRating(value: number): boolean {
  return Number.isFinite(value) && snapRating(value) === round(value);
}

export function starFill(star: number, rating: number): 0 | 0.5 | 1 {
  const full = star * 2;
  if (rating >= full) return 1;
  if (rating >= full - 1) return 0.5;
  return 0;
}

export function ratingFromStar(star: number, half: boolean): number {
  return snapRating(star * 2 - (half ? 1 : 0));
}
