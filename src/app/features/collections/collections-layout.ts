import { centreOffset } from '../../layout/page-grid/page-grid';

/**
 * Geometry of the collections page, in drums.
 *
 * A composition rather than two panes: the headline block on the left, and a field of collection
 * cards to the right of it. The page scrolls sideways, so it has to declare how wide that field is
 * — horizontal overflow is clipped, and a card past the declared width exists but cannot be
 * reached.
 */

/** First column, clearing the left gutter the rest of the app uses. */
export const PAGE_START_COL = 3;

/** The header floats over the first row, so centring happens in the rows below it. */
export const HEADER_ROWS = 1;

/** Headline, blurb and the filter. The same nine drums the home page gives its caption. */
export const LEFT_COLS = 9;

/**
 * The headline block and the filter under it, in drums.
 *
 * Two blocks rather than one, as on the home page, because the filter has to start on a seam: it is
 * a drum-tall card, and a card that begins halfway down a drum reads as dropped on the lattice
 * rather than set into it. Placing it by grid line is the only way to be sure — inside a
 * flow-centred block its top edge lands wherever the text above happens to end.
 */
export const CAPTION_ROWS = 5;
export const FIND_ROWS = 1;
export const LEFT_ROWS = CAPTION_ROWS + FIND_ROWS;

/** Drums between the headline block and the card field. */
export const PANE_GAP = 1;

/** One collection: a square of covers with its name across the foot. */
export const CARD_COLS = 5;
export const CARD_ROWS = 5;

/** Drums between cards. */
export const CARD_GAP = 1;

/** The card that makes a new collection. Small: it holds a plus, not four posters. */
export const CREATE_COLS = 2;
export const CREATE_ROWS = 2;

/**
 * How far each card drops, in drums, cycling as the field goes on.
 *
 * The stagger is the point of the arrangement: a straight row of equal squares reads as a table,
 * where a scattered one reads as a field. Alternating between two depths was still a pattern the eye
 * finished in a glance, so this walks a longer wave — down, part-way back, deeper, back — and never
 * repeats a depth on adjacent cards.
 *
 * Whole drums throughout, so a dropped card lands on seams exactly as its neighbours do.
 */
export const STAGGER_PATTERN = [0, 3, 1, 4, 2] as const;

/** The deepest the wave goes, which is what the band has to make room for. */
export const STAGGER_MAX = Math.max(...STAGGER_PATTERN);

export interface CollectionsLayout {
  /** Grid lines the headline block and the filter occupy, centred as one composition. */
  captionRow: number;
  captionRowEnd: number;
  findRow: number;
  findRowEnd: number;
  /** Drums each card drops by, in field order. */
  drops: readonly number[];
  /** Height of the whole arrangement: a card plus the deepest drop in it. */
  bandRows: number;
  /** First and last grid line the field occupies, already centred vertically. */
  bandRow: number;
  bandRowEnd: number;
  /** Width of the card field. */
  fieldCols: number;
  /** Rightmost grid line the page must reach. */
  totalCols: number;
}

/**
 * The wave, squeezed into the room a window actually has.
 *
 * Depth is what gets given up when the window is short: a shallower wave costs nothing, a clipped
 * card costs the poster it was showing. Scaled rather than truncated, so the shape survives — every
 * drop shrinks together and the order of the depths stays as it was drawn.
 */
export function staggerDrops(count: number, available: number): number[] {
  const room = Math.max(0, available - CARD_ROWS);
  const scale = room >= STAGGER_MAX ? 1 : room / STAGGER_MAX;

  return Array.from({ length: Math.max(0, count) }, (_, index) =>
    Math.round(STAGGER_PATTERN[index % STAGGER_PATTERN.length] * scale),
  );
}

/**
 * Where the arrangement sits and how wide the page has to be for it.
 *
 * The field is one row of cards however tall the window is. Stacking them into bands would use the
 * height, but a card is five drums square — two bands need eleven rows before the stagger, which
 * is more than most windows have, and a layout that only appears on tall screens is a layout that
 * is mostly untested.
 */
export function collectionsLayout(
  gridRows: number,
  count: number,
): CollectionsLayout {
  const available = Math.max(1, gridRows - HEADER_ROWS);

  const drops = staggerDrops(count, available);
  const bandRows = CARD_ROWS + Math.max(0, ...drops);

  const bandRow = 1 + HEADER_ROWS + centreOffset(available, bandRows);

  // Centred as one block, so the filter keeps its place under the headline whatever the window does.
  const captionRow = 1 + HEADER_ROWS + centreOffset(available, LEFT_ROWS);

  const widths = [CREATE_COLS, ...Array.from({ length: count }, () => CARD_COLS)];
  const fieldCols =
    widths.reduce((total, width) => total + width, 0) +
    (widths.length - 1) * CARD_GAP;

  return {
    captionRow,
    captionRowEnd: captionRow + CAPTION_ROWS,
    findRow: captionRow + CAPTION_ROWS,
    findRowEnd: captionRow + LEFT_ROWS,
    drops,
    bandRows,
    bandRow,
    bandRowEnd: bandRow + bandRows,
    fieldCols,
    totalCols: PAGE_START_COL + LEFT_COLS + PANE_GAP + fieldCols,
  };
}
