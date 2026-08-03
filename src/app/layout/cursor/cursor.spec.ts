import { isInteractiveTarget } from './cursor';

describe('isInteractiveTarget', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => root.remove());

  it('matches a button', () => {
    root.innerHTML = '<button id="b">go</button>';
    expect(isInteractiveTarget(root.querySelector('#b'))).toBe(true);
  });

  it('matches a child of a button', () => {
    root.innerHTML = '<button><span id="icon">x</span></button>';
    expect(isInteractiveTarget(root.querySelector('#icon'))).toBe(true);
  });

  it('matches a link only when it has an href', () => {
    root.innerHTML = '<a id="real" href="/x">x</a><a id="bare">y</a>';
    expect(isInteractiveTarget(root.querySelector('#real'))).toBe(true);
    expect(isInteractiveTarget(root.querySelector('#bare'))).toBe(false);
  });

  it('matches form controls', () => {
    root.innerHTML = '<input id="i" /><select id="s"></select>';
    expect(isInteractiveTarget(root.querySelector('#i'))).toBe(true);
    expect(isInteractiveTarget(root.querySelector('#s'))).toBe(true);
  });

  it('matches an explicit opt-in', () => {
    root.innerHTML = '<div id="d" data-cursor="focus"></div>';
    expect(isInteractiveTarget(root.querySelector('#d'))).toBe(true);
  });

  it('does not match plain content', () => {
    root.innerHTML = '<p id="p">text</p>';
    expect(isInteractiveTarget(root.querySelector('#p'))).toBe(false);
  });

  it('is false for null and non-elements', () => {
    expect(isInteractiveTarget(null)).toBe(false);
    expect(isInteractiveTarget(document)).toBe(false);
  });
});
