import { describe, expect, it } from 'vitest';
import { CARD_GAP, CARD_ROWS } from '../search/results-metrics';
import {
  LIST_COLS,
  PAGE_START_COL,
  PAGE_TOP_ROWS,
  PANE_GAP,
  collectionsLayout,
} from './collections-layout';

/**
 * Heights worth checking, in drum rows. Short enough for one card row, tall enough for
 * several, and the awkward sizes in between where a partial row would be placed past the
 * bottom edge.
 */
const HEIGHTS = [4, 6, 7, 9, 12, 13, 18, 24];

describe('collectionsLayout', () => {
  it('fits its card rows in the space left after the heading band', () => {
    for (const rows of HEIGHTS) {
      const available = rows - PAGE_TOP_ROWS;

      // A window with no room for even one row is the exception below, not this rule: there the
      // row is kept and clipped, on the grounds that a cut poster beats an empty page.
      if (available < CARD_ROWS) continue;

      const { rows: cardRows } = collectionsLayout(rows, 40);
      const used = cardRows * CARD_ROWS + (cardRows - 1) * CARD_GAP;

      // Equal is fine — exactly filling the space is not overflowing it.
      expect(used, `${rows} drum rows`).toBeLessThanOrEqual(available);
    }
  });

  it('always leaves at least one card row, however short the window', () => {
    for (const rows of [1, 2, 3, 4]) {
      expect(collectionsLayout(rows, 10).rows).toBeGreaterThanOrEqual(1);
    }
  });

  it('spans both panes and the gap between them', () => {
    const { gridCols, totalCols } = collectionsLayout(12, 7);

    expect(totalCols).toBe(PAGE_START_COL + LIST_COLS + PANE_GAP + gridCols);
  });

  it('keeps a tile of width for a collection with no films', () => {
    const empty = collectionsLayout(12, 0);
    const one = collectionsLayout(12, 1);

    expect(empty.gridCols).toBe(one.gridCols);
    expect(empty.gridCols).toBeGreaterThan(0);
  });

  it('never narrows as films are added', () => {
    let previous = 0;

    for (const count of [0, 1, 2, 5, 11, 30, 120]) {
      const { totalCols } = collectionsLayout(12, count);

      expect(totalCols, `${count} films`).toBeGreaterThanOrEqual(previous);
      previous = totalCols;
    }
  });

  it('gets narrower as the window gets taller, for the same films', () => {
    const short = collectionsLayout(9, 30);
    const tall = collectionsLayout(24, 30);

    expect(tall.rows).toBeGreaterThan(short.rows);
    expect(tall.totalCols).toBeLessThan(short.totalCols);
  });
});
