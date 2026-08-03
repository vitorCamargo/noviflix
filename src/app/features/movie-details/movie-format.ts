import type { MovieDetails, SpokenLanguage } from '../../core/models/tmdb.models';

export const EMPTY_FIELD = '—';

export function formatMoney(amount: number | null | undefined, locale: string): string | null {
  if (!amount || amount <= 0) return null;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRuntime(minutes: number | null | undefined, locale: string): string | null {
  if (!minutes || minutes <= 0) return null;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  const parts = new Intl.NumberFormat(locale);
  if (!hours) return `${parts.format(rest)}m`;
  if (!rest) return `${parts.format(hours)}h`;
  return `${parts.format(hours)}h ${parts.format(rest)}m`;
}

export function formatLanguages(
  languages: readonly SpokenLanguage[] | null | undefined,
  locale: string,
): string | null {
  if (!languages?.length) return null;

  const names = languages
    .map((language) => language.name?.trim() || language.english_name?.trim() || '')
    .filter(Boolean);

  if (!names.length) return null;

  if (typeof Intl.ListFormat === 'function') {
    return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(names);
  }
  return names.join(', ');
}

export function formatVoteCount(count: number | null | undefined, locale: string): string | null {
  if (!count || count <= 0) return null;
  return new Intl.NumberFormat(locale).format(count);
}

export function formatVoteAverage(value: number | null | undefined): string | null {
  if (!value || value <= 0) return null;
  return value.toFixed(1);
}

export function releaseYear(movie: Pick<MovieDetails, 'release_date'> | null): string | null {
  const date = movie?.release_date;
  return date ? date.slice(0, 4) : null;
}
