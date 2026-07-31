/**
 * The two search rules from the project spec, as plain functions.
 *
 * Kept out of the directive so they can be tested without Angular's forms
 * machinery, and so the same rules can be reused anywhere a term is accepted.
 */

/** Spec: minimum three characters. */
export const SEARCH_MIN_LENGTH = 3;

/**
 * Quiet period after the last keystroke before searching.
 *
 * Long enough that typing a title straight through costs one request rather than
 * one per letter, short enough that it still feels like the results are following
 * the typing. Roughly the gap between words for most people.
 */
export const SEARCH_DEBOUNCE_MS = 400;

/**
 * Spec: alphanumerics only.
 *
 * Spaces are permitted as separators, which is an interpretation rather than a
 * literal reading — strictly, "alphanumeric" excludes them, but so would every
 * multi-word title, which makes the field unable to search for most films. To
 * apply the letter of the rule instead, drop the space from this class.
 *
 * Accented letters are also excluded, which matters more than it looks: it means
 * a Portuguese title cannot be typed as written. Worth revisiting.
 */
export const SEARCH_ALLOWED_CHARS = /^[a-z0-9 ]+$/i;

/** Error keys this produces, so consumers aren't matching on string literals. */
export const SEARCH_ERROR = {
  tooShort: 'searchMinLength',
  charset: 'searchAlphanumeric',
} as const;

export interface SearchTermErrors {
  [SEARCH_ERROR.tooShort]?: { requiredLength: number; actualLength: number };
  [SEARCH_ERROR.charset]?: { value: string };
}

/**
 * Normalises a raw input value for both validation and searching.
 *
 * Trimming before validating matters: without it a trailing space makes a
 * three-letter term pass the length rule on a value the API would see as
 * different, and the length reported in the error message wouldn't match what
 * the user can see they typed.
 */
export function normaliseSearchTerm(raw: string | null | undefined): string {
  return (raw ?? '').trim().replace(/\s+/g, ' ');
}

/**
 * Both rules, or null when the term is acceptable.
 *
 * An empty field is *not* an error here. Emptiness is a separate concern —
 * nothing has been attempted yet, so complaining about it while someone is still
 * deciding what to type would be noise. The submit path handles it instead.
 *
 * Failures are reported together rather than short-circuiting, so a caller can
 * decide which to surface; the field shows the character rule first, since it
 * explains something the length message would leave mysterious.
 */
export function validateSearchTerm(
  raw: string | null | undefined,
): SearchTermErrors | null {
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

/** Whether a term is ready to send, including the emptiness case. */
export function isSearchable(raw: string | null | undefined): boolean {
  return normaliseSearchTerm(raw).length > 0 && validateSearchTerm(raw) === null;
}
