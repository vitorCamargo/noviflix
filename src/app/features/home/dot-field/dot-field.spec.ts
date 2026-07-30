import { buildDots } from './dot-field';

describe('buildDots', () => {
  it('fills the matrix', () => {
    expect(buildDots(4, 5)).toHaveLength(20);
  });

  it('emits row-major order, which is what CSS grid expects', () => {
    expect(buildDots(2, 2)).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ]);
  });

  it('is deterministic', () => {
    expect(buildDots(4, 5)).toEqual(buildDots(4, 5));
  });

  it('handles degenerate sizes', () => {
    expect(buildDots(0, 5)).toEqual([]);
    expect(buildDots(4, 0)).toEqual([]);
    expect(buildDots(-2, 5)).toEqual([]);
  });
});
