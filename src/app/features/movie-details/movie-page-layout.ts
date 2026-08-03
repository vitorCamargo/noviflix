import { CARD_COLS, CARD_GAP, resultGridWidth, resultRowCount } from '../search/results-metrics';

export const PAGE_START_COL = 3;

export const ASIDE_COLS = 4;

export const FACTS_COLS = 7;

export const SECTION_GAP = CARD_GAP;

export const PAGE_START_ROW = 2;

export const PAGE_TOP_ROWS = 3;

export interface MoviePageLayout {
  rows: number;
  castCols: number;
  relatedCols: number;
  totalCols: number;
}

export function moviePageLayout(
  gridRows: number,
  castCount: number,
  relatedCount: number,
): MoviePageLayout {
  const rows = resultRowCount(gridRows - PAGE_TOP_ROWS);

  const castCols = resultGridWidth(castCount, rows);
  const relatedCols = resultGridWidth(relatedCount, rows);

  const sections = [ASIDE_COLS, FACTS_COLS, castCols, relatedCols].filter((width) => width > 0);

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
