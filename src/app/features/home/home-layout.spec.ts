import {
  HOME_CONTENT_ROWS,
  homeAreas,
  homeMinColumns,
} from './home-layout';

describe('homeAreas', () => {
  const rows = 14;

  it('centres the composition vertically', () => {
    const wide = homeAreas(rows);
    // 14 rows around a 10-row block leaves two spare above.
    expect(wide.hero.row).toBe(2 + 2);
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
