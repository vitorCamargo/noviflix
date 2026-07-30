import { isGlowSuppressed } from './mouse-glow';

describe('isGlowSuppressed', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => root.remove());

  it('matches a card that casts its own glow', () => {
    root.innerHTML = '<div id="c" data-glow="card"></div>';
    expect(isGlowSuppressed(root.querySelector('#c'))).toBe(true);
  });

  /** The pointer lands on the artwork inside the card, not the card itself. */
  it('matches content nested inside such a card', () => {
    root.innerHTML = '<div data-glow="card"><img id="art" /></div>';
    expect(isGlowSuppressed(root.querySelector('#art'))).toBe(true);
  });

  it('ignores ordinary content', () => {
    root.innerHTML = '<div id="plain"><p id="text">hi</p></div>';
    expect(isGlowSuppressed(root.querySelector('#text'))).toBe(false);
  });

  it('ignores a different data-glow value', () => {
    root.innerHTML = '<div id="other" data-glow="none"></div>';
    expect(isGlowSuppressed(root.querySelector('#other'))).toBe(false);
  });

  /** pointerout carries a null relatedTarget when leaving the window. */
  it('is false for null and non-elements', () => {
    expect(isGlowSuppressed(null)).toBe(false);
    expect(isGlowSuppressed(document)).toBe(false);
  });
});
