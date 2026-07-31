import { DESCRIPTION_MAX, TITLE_MAX } from './collection-store';

/**
 * The create form's rules, per the spec: title and description are both required.
 *
 * Plain functions so the rules can be tested without a form, and so the same check runs
 * whether a value arrives from the field or from anywhere else.
 */

export const COLLECTION_ERROR = {
  required: 'collectionRequired',
  tooLong: 'collectionTooLong',
} as const;

export interface CollectionFieldErrors {
  [COLLECTION_ERROR.required]?: true;
  [COLLECTION_ERROR.tooLong]?: { max: number; actual: number };
}

/**
 * Trims before measuring.
 *
 * Without it a field holding only spaces counts as filled, which is exactly the case a
 * required rule exists to catch.
 */
export function normaliseField(raw: string | null | undefined): string {
  return (raw ?? '').trim().replace(/\s+/g, ' ');
}

function validate(
  raw: string | null | undefined,
  max: number,
): CollectionFieldErrors | null {
  const value = normaliseField(raw);

  if (!value) return { [COLLECTION_ERROR.required]: true };
  if (value.length > max) {
    return { [COLLECTION_ERROR.tooLong]: { max, actual: value.length } };
  }
  return null;
}

export function validateTitle(raw: string | null | undefined) {
  return validate(raw, TITLE_MAX);
}

export function validateDescription(raw: string | null | undefined) {
  return validate(raw, DESCRIPTION_MAX);
}

/** Whether both fields are acceptable, for enabling the submit. */
export function isCollectionValid(
  title: string | null | undefined,
  description: string | null | undefined,
): boolean {
  return validateTitle(title) === null && validateDescription(description) === null;
}
