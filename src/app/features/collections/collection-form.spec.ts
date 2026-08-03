import { DESCRIPTION_MAX, TITLE_MAX } from './collection-store';
import {
  COLLECTION_ERROR,
  isCollectionValid,
  normaliseField,
  validateDescription,
  validateTitle,
} from './collection-form';

describe('normaliseField', () => {
  it('trims and collapses whitespace', () => {
    expect(normaliseField('  Saturday   nights  ')).toBe('Saturday nights');
  });

  it('treats null and undefined as empty', () => {
    expect(normaliseField(null)).toBe('');
    expect(normaliseField(undefined)).toBe('');
  });
});

describe('validateTitle', () => {
  it('accepts a filled title', () => {
    expect(validateTitle('Nights')).toBeNull();
  });

  it('rejects an empty title', () => {
    expect(validateTitle('')?.[COLLECTION_ERROR.required]).toBe(true);
  });

  it('rejects a title of only spaces', () => {
    expect(validateTitle('   ')?.[COLLECTION_ERROR.required]).toBe(true);
  });

  it('rejects a title past the limit', () => {
    const errors = validateTitle('x'.repeat(TITLE_MAX + 1));

    expect(errors?.[COLLECTION_ERROR.tooLong]).toEqual({
      max: TITLE_MAX,
      actual: TITLE_MAX + 1,
    });
  });

  it('accepts a title exactly at the limit', () => {
    expect(validateTitle('x'.repeat(TITLE_MAX))).toBeNull();
  });
});

describe('validateDescription', () => {
  it('rejects an empty description', () => {
    expect(validateDescription('')?.[COLLECTION_ERROR.required]).toBe(true);
  });

  it('accepts a filled description', () => {
    expect(validateDescription('Films for later')).toBeNull();
  });

  it('has its own, longer limit', () => {
    expect(validateDescription('x'.repeat(DESCRIPTION_MAX))).toBeNull();
    expect(
      validateDescription('x'.repeat(DESCRIPTION_MAX + 1))?.[COLLECTION_ERROR.tooLong],
    ).toBeTruthy();
  });
});

describe('isCollectionValid', () => {
  it('needs both fields', () => {
    expect(isCollectionValid('Nights', 'For later')).toBe(true);
    expect(isCollectionValid('Nights', '')).toBe(false);
    expect(isCollectionValid('', 'For later')).toBe(false);
    expect(isCollectionValid('  ', '  ')).toBe(false);
  });
});
