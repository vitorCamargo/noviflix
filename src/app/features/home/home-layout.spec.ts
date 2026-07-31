import {
  HOME_CONTENT_ROWS,
  homeAreas,
  homeMinColumns,
} from './home-layout';

describe('homeAreas', () => {
  const rows = 14;

  /**
   * The real invariant, asserted instead of a hand-computed row number — the
   * previous test agreed with the arithmetic while the arithmetic was wrong.
   * Off-by-one is allowed because an odd number of spare tracks cannot split
   * evenly, and the header's reserved row is excluded from the space above.
   */
  function gaps(rowCount: number) {
    const areas = homeAreas(rowCount);
    const values = Object.values(areas);
    const first = Math.min(...values.map((a) => a.row));
    const last = Math.max(...values.map((a) => a.rowEnd));
    return { above: first - 1 - 1, below: rowCount - (last - 1) };
  }

  it.each([12, 14, 16, 21, 30])(
    'centres the composition below the header at %i rows',
    (rowCount) => {
      const { above, below } = gaps(rowCount);
      expect(Math.abs(above - below)).toBeLessThanOrEqual(1);
    },
  );

  /** A viewport with no room to spare keeps the composition on screen. */
  it('does not push content off a short viewport', () => {
    const areas = homeAreas(9);
    const last = Math.max(...Object.values(areas).map((a) => a.rowEnd));
    expect(last - 1).toBeLessThanOrEqual(9);
  });

  /** Row 0 placements exist in the base, and grid lines start at 1. */
  it('never places anything on row zero', () => {
    for (const area of Object.values(homeAreas(HOME_CONTENT_ROWS))) {
      expect(area.row).toBeGreaterThanOrEqual(1);
    }
  });

  it('leaves columns alone at full width', () => {
    expect(homeAreas(rows).hero.col).toBe(13);
  });

  /**
   * The gap this closes: the headline scales with viewport width, so a narrow
   * window shrinks the type while the hero stays pinned, leaving dead space.
   */
  it('pulls the whole stack left when compact', () => {
    const wide = homeAreas(rows);
    const compact = homeAreas(rows, true);

    expect(compact.hero.col).toBe(wide.hero.col - 2);
    expect(compact.stats.col).toBe(wide.stats.col - 2);
    expect(compact.badge.col).toBe(wide.badge.col - 2);
  });

  it('keeps every block exactly its own size when compact', () => {
    const wide = homeAreas(rows);
    const compact = homeAreas(rows, true);

    for (const key of Object.keys(wide) as (keyof typeof wide)[]) {
      expect(compact[key].colEnd - compact[key].col).toBe(
        wide[key].colEnd - wide[key].col,
      );
    }
  });

  /**
   * The headline block anchors the page. Moving it too would shove it against
   * the viewport edge and relocate the gap rather than close it.
   */
  it('leaves the headline block where it is when compact', () => {
    const wide = homeAreas(rows);
    const compact = homeAreas(rows, true);

    expect(compact.caption).toEqual(wide.caption);
    expect(compact.action).toEqual(wide.action);
  });

  it('does not move rows when compact', () => {
    expect(homeAreas(rows, true).hero.row).toBe(homeAreas(rows).hero.row);
  });
});

describe('homeMinColumns', () => {
  it('reaches the rightmost edge of the composition', () => {
    const areas = homeAreas(HOME_CONTENT_ROWS);
    const rightmost = Math.max(
      ...Object.values(areas).map((area) => area.colEnd),
    );
    expect(homeMinColumns()).toBe(rightmost);
  });

  it('needs fewer columns when compact', () => {
    expect(homeMinColumns(true)).toBe(homeMinColumns() - 2);
  });
});
