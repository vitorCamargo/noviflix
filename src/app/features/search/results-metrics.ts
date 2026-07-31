/**
 * Geometry of the results grid, in drums.
 *
 * These numbers are needed in two places at once — the grid, to lay itself out,
 * and the page, to know how wide it has to become so the track can scroll to the
 * far end. Deriving them twice would let the two disagree, and the symptom of that
 * is cards that exist but cannot be reached.
 */

/** A card's footprint: the poster card's three-by-five shape. */
export const CARD_COLS = 3;
export const CARD_ROWS = 5;

/** Drums between cards, horizontally and vertically. */
export const CARD_GAP = 1;

/** Placeholder tiles held at the tail while the next page loads. */
export const TAIL_SLOTS = 4;

/**
 * Card rows that fit in the drum rows available.
 *
 * n rows cost `n * CARD_ROWS + (n - 1) * CARD_GAP` drums — the gaps sit between
 * rows, not after the last one, which is why this isn't a plain division.
 *
 * Always at least one: a viewport too short for a full card still shows a clipped
 * row, which is better than showing nothing at all.
 */
export function resultRowCount(availableRows: number): number {
  const perRow = CARD_ROWS + CARD_GAP;
  return Math.max(1, Math.floor((availableRows + CARD_GAP) / perRow));
}

/**
 * Width in drums of a grid holding `slots` cards over `rows` rows.
 *
 * The grid flows in columns, so the slot count decides the width. Trailing gap is
 * excluded for the same reason as above.
 */
export function resultGridWidth(slots: number, rows: number): number {
  if (slots <= 0 || rows <= 0) return 0;

  const columns = Math.ceil(slots / rows);
  return columns * CARD_COLS + (columns - 1) * CARD_GAP;
}
