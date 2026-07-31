import {
  RATING_MAX,
  RATING_MIN,
  RATING_STEP,
  RATING_VALUES,
  isValidRating,
  ratingFromStar,
  snapRating,
  starFill,
} from './rating';

describe('RATING_VALUES', () => {
  it('covers the whole range in half steps', () => {
    expect(RATING_VALUES[0]).toBe(RATING_MIN);
    expect(RATING_VALUES.at(-1)).toBe(RATING_MAX);
    expect(RATING_VALUES).toHaveLength(20);
  });

  /**
   * Repeated addition of 0.5 drifts in binary floating point. Left unrounded the
   * range holds values like 7.000000000000001, which TMDB rejects outright and which
   * compares unequal to the 7 the visitor thought they picked.
   */
  it('holds exact values, free of floating point drift', () => {
    for (const value of RATING_VALUES) {
      expect(Number.isInteger(value * 2)).toBe(true);
    }
    expect(RATING_VALUES).toContain(7);
    expect(RATING_VALUES).toContain(7.5);
  });
});

describe('snapRating', () => {
  it('rounds to the nearest half step', () => {
    expect(snapRating(7.3)).toBe(7.5);
    expect(snapRating(7.1)).toBe(7);
  });

  it('clamps outside the range', () => {
    expect(snapRating(0)).toBe(RATING_MIN);
    expect(snapRating(-4)).toBe(RATING_MIN);
    expect(snapRating(99)).toBe(RATING_MAX);
  });

  /**
   * Any non-finite input is treated as no value at all, infinities included. They
   * cannot arrive from the control — the slider and the stars are both bounded — so
   * the simplest safe answer beats arguing about which end infinity belongs at.
   */
  it('falls back to the minimum for values that are not real numbers', () => {
    expect(snapRating(Number.NaN)).toBe(RATING_MIN);
    expect(snapRating(Number.POSITIVE_INFINITY)).toBe(RATING_MIN);
    expect(snapRating(Number.NEGATIVE_INFINITY)).toBe(RATING_MIN);
  });

  it('is idempotent, so re-snapping never shifts a value', () => {
    for (const value of RATING_VALUES) {
      expect(snapRating(value)).toBe(value);
    }
  });
});

describe('isValidRating', () => {
  it('accepts what the API accepts', () => {
    expect(isValidRating(0.5)).toBe(true);
    expect(isValidRating(10)).toBe(true);
  });

  it('rejects out-of-range and off-step values', () => {
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(10.5)).toBe(false);
    expect(isValidRating(7.2)).toBe(false);
  });
});

describe('starFill', () => {
  /** Star 4 covers ratings 7 and 8: half at 7, full at 8. */
  it('fills, half-fills or empties a star for a rating', () => {
    expect(starFill(4, 8)).toBe(1);
    expect(starFill(4, 7)).toBe(0.5);
    expect(starFill(4, 6)).toBe(0);
  });

  it('fills every star at the maximum', () => {
    for (let star = 1; star <= 5; star++) {
      expect(starFill(star, RATING_MAX)).toBe(1);
    }
  });

  it('leaves all but the first half-filled at the minimum', () => {
    expect(starFill(1, RATING_MIN)).toBe(0);
    expect(starFill(1, 1)).toBe(0.5);
  });
});

describe('ratingFromStar', () => {
  it('maps the right half of a star to its whole value', () => {
    expect(ratingFromStar(1, false)).toBe(2);
    expect(ratingFromStar(5, false)).toBe(10);
  });

  it('maps the left half to the half step below', () => {
    expect(ratingFromStar(1, true)).toBe(1);
    expect(ratingFromStar(5, true)).toBe(9);
  });

  it('always yields a value the API will take', () => {
    for (let star = 1; star <= 5; star++) {
      for (const half of [true, false]) {
        expect(isValidRating(ratingFromStar(star, half))).toBe(true);
      }
    }
  });

  it('agrees with starFill, so the stars show what a click chose', () => {
    for (let star = 1; star <= 5; star++) {
      expect(starFill(star, ratingFromStar(star, false))).toBe(1);
      expect(starFill(star, ratingFromStar(star, true))).toBe(0.5);
    }
  });
});

describe('RATING_STEP', () => {
  it('is the half step the API requires', () => {
    expect(RATING_STEP).toBe(0.5);
  });
});
