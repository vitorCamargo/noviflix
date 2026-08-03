import { FormControl } from '@angular/forms';
import {
  SEARCH_ERROR,
  SEARCH_MIN_LENGTH,
  isSearchable,
  normaliseSearchTerm,
  validateSearchTerm,
} from './search-term';
import { SearchTermValidator } from './search-term.directive';

describe('normaliseSearchTerm', () => {
  it('trims and collapses whitespace', () => {
    expect(normaliseSearchTerm('  the   matrix  ')).toBe('the matrix');
  });

  it('treats null and undefined as empty', () => {
    expect(normaliseSearchTerm(null)).toBe('');
    expect(normaliseSearchTerm(undefined)).toBe('');
  });
});

describe('validateSearchTerm', () => {
  it('accepts an empty term without complaint', () => {
    expect(validateSearchTerm('')).toBeNull();
    expect(validateSearchTerm('   ')).toBeNull();
  });

  it('accepts a term meeting both rules', () => {
    expect(validateSearchTerm('dune')).toBeNull();
    expect(validateSearchTerm('se7en')).toBeNull();
    expect(validateSearchTerm('1917')).toBeNull();
  });

  it('rejects a term under the minimum length', () => {
    const errors = validateSearchTerm('up');
    expect(errors?.[SEARCH_ERROR.tooShort]).toEqual({
      requiredLength: SEARCH_MIN_LENGTH,
      actualLength: 2,
    });
  });

  it('does not let surrounding spaces satisfy the length rule', () => {
    expect(validateSearchTerm(' up ')?.[SEARCH_ERROR.tooShort]).toBeTruthy();
  });

  it('rejects punctuation and symbols', () => {
    for (const term of ['star!', 'wall-e', 'a+b+c', '<script>']) {
      expect(validateSearchTerm(term)?.[SEARCH_ERROR.charset]).toBeTruthy();
    }
  });

  it('allows spaces between words', () => {
    expect(validateSearchTerm('blade runner')).toBeNull();
  });

  it('reports both failures at once rather than stopping at the first', () => {
    const errors = validateSearchTerm('a!');
    expect(errors?.[SEARCH_ERROR.charset]).toBeTruthy();
    expect(errors?.[SEARCH_ERROR.tooShort]).toBeTruthy();
  });
});

describe('isSearchable', () => {
  it('requires a non-empty, valid term', () => {
    expect(isSearchable('dune')).toBe(true);
    expect(isSearchable('')).toBe(false);
    expect(isSearchable('up')).toBe(false);
    expect(isSearchable('up!')).toBe(false);
  });
});

describe('SearchTermValidator', () => {
  const directive = new SearchTermValidator();

  it('passes a valid control', () => {
    expect(directive.validate(new FormControl('dune'))).toBeNull();
  });

  it('surfaces errors in the shape Angular forms expects', () => {
    const errors = directive.validate(new FormControl('a!'));
    expect(errors).not.toBeNull();
    expect(Object.keys(errors ?? {})).toContain(SEARCH_ERROR.charset);
  });

  it('leaves an untouched empty control valid', () => {
    expect(directive.validate(new FormControl(''))).toBeNull();
  });
});
