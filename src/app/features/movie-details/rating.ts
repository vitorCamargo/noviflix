/**
 * TMDB's rating range, as plain values so the rules are testable without a form.
 *
 * The API accepts 0.5 to 10 in half steps and rejects anything else outright — a
 * rejection the visitor can do nothing about, so the control never offers a value
 * the API won't take.
 */

export const RATING_MIN = 0.5;
export const RATING_MAX = 10;
export const RATING_STEP = 0.5;

/** Every offerable value, low to high. */
export const RATING_VALUES: readonly number[] = Array.from(
  { length: Math.round((RATING_MAX - RATING_MIN) / RATING_STEP) + 1 },
  (_, i) => round(RATING_MIN + i * RATING_STEP),
);

/** Stars drawn, each covering two half-step values. */
export const RATING_STARS = Math.round(RATING_MAX / 2);

/**
 * Rounds to one decimal.
 *
 * Repeated addition of 0.5 drifts in binary floating point, so without this the
 * range contains values like 7.000000000000001 — which TMDB rejects, and which
 * would compare unequal to the 7 the visitor thought they picked.
 */
function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Nearest valid rating to `value`, clamped into range. */
export function snapRating(value: number): number {
  if (!Number.isFinite(value)) return RATING_MIN;

  const snapped = round(Math.round(value / RATING_STEP) * RATING_STEP);
  return Math.min(RATING_MAX, Math.max(RATING_MIN, snapped));
}

export function isValidRating(value: number): boolean {
  return Number.isFinite(value) && snapRating(value) === round(value);
}

/**
 * How full a given star should be for a rating: 0, 0.5 or 1.
 *
 * `star` is 1-based, so star 3 covers ratings 5 and 6.
 */
export function starFill(star: number, rating: number): 0 | 0.5 | 1 {
  const full = star * 2;
  if (rating >= full) return 1;
  if (rating >= full - 1) return 0.5;
  return 0;
}

/** The rating a click maps to: left half of a star is the half step. */
export function ratingFromStar(star: number, half: boolean): number {
  return snapRating(star * 2 - (half ? 1 : 0));
}
