import type { MovieDetails, SpokenLanguage } from '../../core/models/tmdb.models';

/**
 * Formatters for the detail fields, as plain functions.
 *
 * All of them have to answer the same awkward question: TMDB reports "unknown" as
 * zero, an empty string or an empty array rather than null, so a naive format turns
 * missing data into a confident claim — a film with a $0 budget, or a rating of 0.0.
 * Each returns null for absent, and the template shows a dash.
 */

/** Placeholder for a field TMDB has no value for. */
export const EMPTY_FIELD = '—';

/**
 * Money, in whole units.
 *
 * Zero means unreported, not free: TMDB uses it for every film whose finances were
 * never filed, which is most of them. No decimals — cents on a hundred-million
 * dollar budget are noise, and the figures are estimates anyway.
 */
export function formatMoney(
  amount: number | null | undefined,
  locale: string,
): string | null {
  if (!amount || amount <= 0) return null;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Runtime as hours and minutes, since 142 minutes is not a readable length. */
export function formatRuntime(
  minutes: number | null | undefined,
  locale: string,
): string | null {
  if (!minutes || minutes <= 0) return null;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  const parts = new Intl.NumberFormat(locale);
  if (!hours) return `${parts.format(rest)}m`;
  if (!rest) return `${parts.format(hours)}h`;
  return `${parts.format(hours)}h ${parts.format(rest)}m`;
}

/**
 * Spoken languages, joined in the reader's locale.
 *
 * Prefers the localised name and falls back to the English one, because TMDB
 * returns an empty `name` for some languages while still providing
 * `english_name` — and an empty string would render as a stray separator.
 */
export function formatLanguages(
  languages: readonly SpokenLanguage[] | null | undefined,
  locale: string,
): string | null {
  if (!languages?.length) return null;

  const names = languages
    .map((language) => language.name?.trim() || language.english_name?.trim() || '')
    .filter(Boolean);

  if (!names.length) return null;

  // Intl.ListFormat gives the locale's own conjunction rather than a hardcoded
  // comma, which is wrong in several of the languages this app offers.
  if (typeof Intl.ListFormat === 'function') {
    return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(
      names,
    );
  }
  return names.join(', ');
}

/** Vote count, grouped for the locale. Zero is absent, not a count of none. */
export function formatVoteCount(
  count: number | null | undefined,
  locale: string,
): string | null {
  if (!count || count <= 0) return null;
  return new Intl.NumberFormat(locale).format(count);
}

/** Average to one decimal. Zero means unrated rather than rated badly. */
export function formatVoteAverage(value: number | null | undefined): string | null {
  if (!value || value <= 0) return null;
  return value.toFixed(1);
}

/** Release year, for the compact line beside the title. */
export function releaseYear(movie: Pick<MovieDetails, 'release_date'> | null): string | null {
  const date = movie?.release_date;
  return date ? date.slice(0, 4) : null;
}
