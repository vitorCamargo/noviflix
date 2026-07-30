import { MAX_PADS, MIN_COLUMNS, computeGrid } from './grid-backdrop';

describe('computeGrid', () => {
  const cell = 64;

  it('covers the viewport, rounding up so no bare strip is left', () => {
    // 1280/64 is exact; 800/64 is 12.5, so rows must round to 13.
    expect(computeGrid(1280, 800, cell)).toEqual({ columns: 20, rows: 13 });
  });

  it('rounds partial columns up too', () => {
    expect(computeGrid(1300, 640, cell)).toEqual({ columns: 21, rows: 10 });
  });

  it('holds a minimum column count on narrow viewports', () => {
    const { columns } = computeGrid(320, 640, cell);
    expect(columns).toBe(MIN_COLUMNS);
  });

  it('always renders at least one row', () => {
    expect(computeGrid(1280, 0, cell).rows).toBe(1);
  });

  it('caps total pads so a huge viewport cannot stall layout', () => {
    const { columns, rows } = computeGrid(20000, 10000, cell);
    expect(columns * rows).toBeLessThanOrEqual(MAX_PADS);
  });

  it('keeps full row coverage when capping, trimming columns instead', () => {
    const tall = computeGrid(20000, 10000, cell);
    // Rows still cover the viewport height; it's the far edge that gives.
    expect(tall.rows).toBe(Math.ceil(10000 / cell));
    expect(tall.columns).toBeGreaterThan(0);
  });

  it('degrades safely on a zero or negative cell size', () => {
    expect(computeGrid(1280, 800, 0)).toEqual({ columns: MIN_COLUMNS, rows: 1 });
    expect(computeGrid(1280, 800, -10)).toEqual({ columns: MIN_COLUMNS, rows: 1 });
  });

  it('scales with the cell size', () => {
    const small = computeGrid(1280, 800, 32);
    const large = computeGrid(1280, 800, 128);
    expect(small.columns).toBeGreaterThan(large.columns);
    expect(small.rows).toBeGreaterThan(large.rows);
  });
});
