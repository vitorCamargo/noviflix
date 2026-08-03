export const SEARCH_MIN_LENGTH = 3;

export const SEARCH_DEBOUNCE_MS = 400;

export const SEARCH_ALLOWED_CHARS = /^[a-z0-9 ]+$/i;

export const SEARCH_ERROR = {
  tooShort: 'searchMinLength',
  charset: 'searchAlphanumeric',
} as const;

export interface SearchTermErrors {
  [SEARCH_ERROR.tooShort]?: { requiredLength: number; actualLength: number };
  [SEARCH_ERROR.charset]?: { value: string };
}

export function normaliseSearchTerm(raw: string | null | undefined): string {
  return (raw ?? '').trim().replace(/\s+/g, ' ');
}

export function validateSearchTerm(raw: string | null | undefined): SearchTermErrors | null {
  const term = normaliseSearchTerm(raw);
  if (!term) return null;

  const errors: SearchTermErrors = {};

  if (!SEARCH_ALLOWED_CHARS.test(term)) {
    errors[SEARCH_ERROR.charset] = { value: term };
  }

  if (term.length < SEARCH_MIN_LENGTH) {
    errors[SEARCH_ERROR.tooShort] = {
      requiredLength: SEARCH_MIN_LENGTH,
      actualLength: term.length,
    };
  }

  return Object.keys(errors).length ? errors : null;
}

export function isSearchable(raw: string | null | undefined): boolean {
  return normaliseSearchTerm(raw).length > 0 && validateSearchTerm(raw) === null;
}
