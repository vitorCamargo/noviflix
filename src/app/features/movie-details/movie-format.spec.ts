import {
  formatLanguages,
  formatMoney,
  formatRuntime,
  formatVoteAverage,
  formatVoteCount,
  releaseYear,
} from './movie-format';

const EN = 'en-US';

/**
 * The theme running through all of these: TMDB reports "unknown" as zero, an empty
 * string or an empty array rather than null. Formatted naively, missing data becomes
 * a confident claim — a film with a $0 budget, or a rating of 0.0.
 */
describe('formatMoney', () => {
  it('formats a reported figure without cents', () => {
    expect(formatMoney(200_000_000, EN)).toBe('$200,000,000');
  });

  it('treats zero as unreported rather than free', () => {
    expect(formatMoney(0, EN)).toBeNull();
  });

  it('treats missing values as unreported', () => {
    expect(formatMoney(null, EN)).toBeNull();
    expect(formatMoney(undefined, EN)).toBeNull();
  });

  it('rejects negatives, which cannot be a real figure', () => {
    expect(formatMoney(-5, EN)).toBeNull();
  });
});

describe('formatRuntime', () => {
  it('splits minutes into hours and minutes', () => {
    expect(formatRuntime(142, EN)).toBe('2h 22m');
  });

  it('omits the minutes on a whole number of hours', () => {
    expect(formatRuntime(120, EN)).toBe('2h');
  });

  it('omits the hours on a short film', () => {
    expect(formatRuntime(44, EN)).toBe('44m');
  });

  it('treats zero and missing as unknown', () => {
    expect(formatRuntime(0, EN)).toBeNull();
    expect(formatRuntime(null, EN)).toBeNull();
  });
});

describe('formatLanguages', () => {
  it('joins names with the locale conjunction', () => {
    const result = formatLanguages(
      [
        { iso_639_1: 'en', name: 'English' },
        { iso_639_1: 'fr', name: 'French' },
      ],
      EN,
    );
    expect(result).toContain('English');
    expect(result).toContain('French');
  });

  it('reads a single language plainly', () => {
    expect(formatLanguages([{ iso_639_1: 'en', name: 'English' }], EN)).toBe('English');
  });

  /** TMDB returns an empty `name` for some languages but still gives the English one. */
  it('falls back to the English name when the localised one is blank', () => {
    expect(
      formatLanguages([{ iso_639_1: 'yo', name: '', english_name: 'Yoruba' }], EN),
    ).toBe('Yoruba');
  });

  it('is null when there is nothing usable', () => {
    expect(formatLanguages([], EN)).toBeNull();
    expect(formatLanguages(null, EN)).toBeNull();
    expect(formatLanguages([{ iso_639_1: 'xx', name: '' }], EN)).toBeNull();
  });
});

describe('formatVoteCount', () => {
  it('groups thousands', () => {
    expect(formatVoteCount(12_345, EN)).toBe('12,345');
  });

  it('treats no votes as absent', () => {
    expect(formatVoteCount(0, EN)).toBeNull();
  });
});

describe('formatVoteAverage', () => {
  it('keeps one decimal', () => {
    expect(formatVoteAverage(7)).toBe('7.0');
    expect(formatVoteAverage(6.86)).toBe('6.9');
    expect(formatVoteAverage(6.84)).toBe('6.8');
  });

  /**
   * Recorded rather than asserted as desirable: 6.85 has no exact binary
   * representation and lands just below the true value, so toFixed rounds it down.
   * It matters only in that a displayed score can differ by a tenth from a
   * hand-rounded one — not worth correcting for a figure TMDB itself derives from
   * an average.
   */
  it('rounds a decimal midpoint down, per binary floating point', () => {
    expect(formatVoteAverage(6.85)).toBe('6.8');
  });

  /** Zero means unrated, and "0.0" would read as a damning score. */
  it('treats zero as unrated', () => {
    expect(formatVoteAverage(0)).toBeNull();
  });
});

describe('releaseYear', () => {
  it('takes the year from the date', () => {
    expect(releaseYear({ release_date: '2026-07-15' })).toBe('2026');
  });

  it('is null without a date', () => {
    expect(releaseYear({ release_date: '' })).toBeNull();
    expect(releaseYear(null)).toBeNull();
  });
});
