import { describe, expect, it } from 'vitest';
import {
  CARD_COLS,
  CARD_GAP,
  CARD_ROWS,
  CREATE_COLS,
  LEFT_COLS,
  PAGE_START_COL,
  PANE_GAP,
  STAGGER_MAX,
  STAGGER_PATTERN,
  collectionsLayout,
  staggerDrops,
} from './collections-layout';

/**
 * Heights worth checking, in drum rows. Short enough that the wave has to flatten, tall enough for
 * the whole of it, and the awkward sizes in between.
 */
const HEIGHTS = [4, 6, 7, 8, 9, 12, 14, 18, 24];

describe('staggerDrops', () => {
  it('walks the pattern and repeats it', () => {
    const drops = staggerDrops(STAGGER_PATTERN.length * 2, 40);

    expect(drops.slice(0, STAGGER_PATTERN.length)).toEqual([...STAGGER_PATTERN]);
    expect(drops.slice(STAGGER_PATTERN.length)).toEqual([...STAGGER_PATTERN]);
  });

  it('never puts two neighbours at the same depth', () => {
    const drops = staggerDrops(12, 40);

    for (let i = 1; i < drops.length; i++) {
      expect(drops[i], `card ${i}`).not.toBe(drops[i - 1]);
    }
  });

  it('leaves the first card level, so the field starts on a line', () => {
    expect(staggerDrops(6, 40)[0]).toBe(0);
  });

  it('keeps every drop in whole drums', () => {
    for (const rows of HEIGHTS) {
      for (const drop of staggerDrops(9, rows)) {
        expect(Number.isInteger(drop), `${rows} drum rows`).toBe(true);
      }
    }
  });

  it('shallows the wave rather than overflowing a short window', () => {
    for (const available of [CARD_ROWS, CARD_ROWS + 1, CARD_ROWS + 3, CARD_ROWS + 40]) {
      const room = available - CARD_ROWS;

      for (const drop of staggerDrops(9, available)) {
        expect(drop, `${available} rows available`).toBeLessThanOrEqual(room);
      }
    }
  });

  it('flattens completely when there is only room for the card', () => {
    expect(staggerDrops(6, CARD_ROWS)).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe('collectionsLayout', () => {
  it('keeps the whole arrangement inside the rows below the header', () => {
    for (const rows of HEIGHTS) {
      // A window with no room for even one card is the exception below, not this rule: there the
      // card is kept and clipped, on the grounds that a cut poster beats an empty page.
      if (rows - 1 < CARD_ROWS) continue;

      const { bandRowEnd } = collectionsLayout(rows, 6);

      // The last line the field occupies must not be past the grid's own last line.
      expect(bandRowEnd, `${rows} drum rows`).toBeLessThanOrEqual(rows + 1);
    }
  });

  it('keeps a whole card when the window is too short for one', () => {
    const cramped = collectionsLayout(4, 6);

    expect(cramped.bandRows).toBe(CARD_ROWS);
    expect(cramped.drops.every((drop) => drop === 0)).toBe(true);
  });

  it('never starts above the row the header leaves free', () => {
    for (const rows of HEIGHTS) {
      expect(collectionsLayout(rows, 3).bandRow, `${rows} drum rows`).toBeGreaterThanOrEqual(2);
    }
  });

  it('is as tall as a card plus the deepest drop in the field', () => {
    const roomy = collectionsLayout(CARD_ROWS + STAGGER_MAX + 4, 5);

    expect(roomy.bandRows).toBe(CARD_ROWS + Math.max(...roomy.drops));
    expect(Math.max(...roomy.drops)).toBe(STAGGER_MAX);
  });

  it('only makes room for the depths the field actually reaches', () => {
    // Two cards, so the wave has not got to its deepest point yet.
    const two = collectionsLayout(30, 2);

    expect(two.bandRows).toBe(CARD_ROWS + Math.max(...two.drops));
    expect(two.bandRows).toBeLessThan(CARD_ROWS + STAGGER_MAX);
  });

  it('centres the arrangement, so it stays put as the window grows', () => {
    for (const rows of [12, 20, 24]) {
      const { bandRow, bandRowEnd } = collectionsLayout(rows, 5);

      const above = bandRow - 2;
      const below = rows + 1 - bandRowEnd;

      expect(Math.abs(above - below), `${rows} drum rows`).toBeLessThanOrEqual(1);
    }
  });

  it('is as wide as the create card plus one card per collection', () => {
    for (const count of [0, 1, 2, 7]) {
      const { fieldCols } = collectionsLayout(14, count);

      expect(fieldCols, `${count} collections`).toBe(
        CREATE_COLS + count * CARD_COLS + count * CARD_GAP,
      );
    }
  });

  it('spans the headline block, the gap and the field', () => {
    const { fieldCols, totalCols } = collectionsLayout(14, 5);

    expect(totalCols).toBe(PAGE_START_COL + LEFT_COLS + PANE_GAP + fieldCols);
  });

  it('never narrows as collections are added', () => {
    let previous = 0;

    for (const count of [0, 1, 2, 5, 20]) {
      const { totalCols } = collectionsLayout(14, count);

      expect(totalCols, `${count} collections`).toBeGreaterThan(previous);
      previous = totalCols;
    }
  });
});
