import { CARD_GAP, resultGridWidth, resultRowCount } from '../search/results-metrics';

/**
 * Geometry of the collections page, in drums.
 *
 * Two panes side by side: the list of collections, then the films in the one that is open. The
 * page scrolls sideways, so it has to declare how wide that pair is — horizontal overflow is
 * clipped, and a film past the declared width exists but cannot be reached.
 *
 * Same reasoning and the same tile footprint as the search grid and the details page, which is
 * why the row maths is shared rather than restated here.
 */

/** First column, clearing the left gutter the rest of the app uses. */
export const PAGE_START_COL = 3;

/** The list of collections. Wide enough for a thumbnail beside a name and a count. */
export const LIST_COLS = 6;

/** Drums between the two panes. */
export const PANE_GAP = CARD_GAP;

/** Grid line the content starts on, clearing the header floating over the first row. */
export const PAGE_START_ROW = 2;

/**
 * Drum rows unavailable to the film grid: one above the content for the header, two for the
 * heading band both panes share.
 */
export const PAGE_TOP_ROWS = 3;

/** Height of one row in the list of collections. Two drums: a name over a count. */
export const LIST_ROW_DRUMS = 2;

export interface CollectionsLayout {
  /** Card rows the film grid gets. */
  rows: number;
  /** Width of the film grid. */
  gridCols: number;
  /** Rightmost grid line the page must reach. */
  totalCols: number;
}

/**
 * Pane widths and the total the page must span.
 *
 * The film grid flows in columns, so its width depends on how many tiles fit in one — which
 * depends on the height available. A taller window is therefore a *narrower* page.
 */
export function collectionsLayout(
  gridRows: number,
  filmCount: number,
): CollectionsLayout {
  const rows = resultRowCount(gridRows - PAGE_TOP_ROWS);

  // At least one tile wide even with nothing in it, so an empty collection still has somewhere
  // to put its message rather than collapsing to nothing.
  const gridCols = Math.max(
    resultGridWidth(1, 1),
    resultGridWidth(filmCount, rows),
  );

  return {
    rows,
    gridCols,
    totalCols: PAGE_START_COL + LIST_COLS + PANE_GAP + gridCols,
  };
}
