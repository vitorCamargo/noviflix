import {
  CARD_COLS,
  CARD_GAP,
  resultGridWidth,
  resultRowCount,
} from '../search/results-metrics';

/**
 * Geometry of the details page, in drums.
 *
 * The page scrolls sideways, so its sections sit in a row and the page has to declare
 * how wide that row is — it clips horizontal overflow, so a section past the declared
 * width exists but cannot be reached. Same reasoning as the search grid, and the same
 * tile footprint, which is why the row maths is shared rather than repeated.
 */

/** First column, clearing the left gutter the rest of the app uses. */
export const PAGE_START_COL = 3;

/** Poster and rating column. */
export const ASIDE_COLS = 4;

/** Title, synopsis and the figures. */
export const FACTS_COLS = 7;

/** Drums between one section and the next. */
export const SECTION_GAP = CARD_GAP;

/**
 * Drum rows unavailable to the tile grids.
 *
 * Three, and each one is spent somewhere specific: the page starts a row below the
 * floating header, then gives a row to the back link and a row to each section's
 * heading. Counting two of them left the grids one row too tall for the space, which is
 * why the bottom row of cards was cut off.
 */
export const PAGE_TOP_ROWS = 3;

export interface MoviePageLayout {
  /** Card rows the cast and related strips each get. */
  rows: number;
  castCols: number;
  relatedCols: number;
  /** Rightmost grid line the page must reach. */
  totalCols: number;
}

/**
 * Section widths and the total the page must span.
 *
 * Cast and related both flow in columns, so their widths depend on how many tiles fit
 * per column — which depends on the height available. A taller window is therefore a
 * *narrower* page, since each column holds more.
 */
export function moviePageLayout(
  gridRows: number,
  castCount: number,
  relatedCount: number,
): MoviePageLayout {
  const rows = resultRowCount(gridRows - PAGE_TOP_ROWS);

  const castCols = resultGridWidth(castCount, rows);
  const relatedCols = resultGridWidth(relatedCount, rows);

  // Only sections with something in them take space, or an empty cast would leave a
  // gap the width of a card with nothing in it.
  const sections = [ASIDE_COLS, FACTS_COLS, castCols, relatedCols].filter(
    (width) => width > 0,
  );

  const content =
    sections.reduce((total, width) => total + width, 0) +
    Math.max(0, sections.length - 1) * SECTION_GAP;

  return {
    rows,
    castCols,
    relatedCols,
    totalCols: PAGE_START_COL + content,
  };
}

/** Width in drums of one tile column, for sizing a section's inner grid. */
export const TILE_COLS = CARD_COLS;
