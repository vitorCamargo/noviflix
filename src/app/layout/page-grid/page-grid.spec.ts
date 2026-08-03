import {
  areaCells,
  centreOffset,
  fitColumns,
  offsetArea,
  toGridArea,
  totalCells,
  type DrumArea,
} from './page-grid';

const area = (row: number, rowEnd: number, col: number, colEnd: number): DrumArea => ({
  row,
  rowEnd,
  col,
  colEnd,
});

describe('areaCells', () => {
  it('multiplies spans', () => {
    expect(areaCells(area(1, 3, 1, 4))).toBe(6);
  });

  it('is zero for a collapsed area', () => {
    expect(areaCells(area(2, 2, 1, 4))).toBe(0);
  });

  it('is zero rather than negative for an inverted area', () => {
    expect(areaCells(area(5, 2, 4, 1))).toBe(0);
  });
});

describe('totalCells', () => {
  it('is one pad per cell plus an overhang row and column', () => {
    expect(totalCells(10, 4)).toBe(11 * 5);
  });

  it('still emits the overhang for a degenerate grid', () => {
    expect(totalCells(0, 0)).toBe(1);
    expect(totalCells(-3, -2)).toBe(1);
  });
});

describe('fitColumns', () => {
  const cell = 64;

  it('fills a viewport that divides evenly', () => {
    expect(fitColumns(1728, cell, 10)).toBe(27);
  });

  it('floors a partial trailing column rather than rounding up', () => {
    expect(fitColumns(1729, cell, 10)).toBe(27);
    expect(fitColumns(1790, cell, 10)).toBe(27);
  });

  it('never drops below the composition width', () => {
    expect(fitColumns(600, cell, 23)).toBe(23);
  });

  it('widens past the minimum when the viewport allows', () => {
    expect(fitColumns(2560, cell, 23)).toBe(40);
  });

  it('degrades safely on a bad cell size', () => {
    expect(fitColumns(1728, 0, 23)).toBe(23);
    expect(fitColumns(1728, -8, 23)).toBe(23);
  });
});

describe('centreOffset', () => {
  it('centres a shorter block', () => {
    expect(centreOffset(14, 10)).toBe(2);
  });

  it('is zero when the block exactly fits', () => {
    expect(centreOffset(10, 10)).toBe(0);
  });

  it('does not go negative when the block is taller than the grid', () => {
    expect(centreOffset(6, 10)).toBe(0);
  });

  it('rounds down on an odd remainder, biasing upward', () => {
    expect(centreOffset(13, 10)).toBe(1);
  });
});

describe('offsetArea', () => {
  it('shifts rows and leaves columns alone', () => {
    expect(offsetArea(area(2, 6, 3, 12), 3)).toEqual(area(5, 9, 3, 12));
  });

  it('is a no-op at zero', () => {
    const original = area(2, 6, 3, 12);
    expect(offsetArea(original, 0)).toEqual(original);
  });
});

describe('toGridArea', () => {
  it('emits row / col / rowEnd / colEnd order', () => {
    expect(toGridArea(area(2, 6, 3, 12))).toBe('2 / 3 / 6 / 12');
  });
});
