import { CARD_GAP, CARD_ROWS } from '../search/results-metrics';
import {
  ASIDE_COLS,
  FACTS_COLS,
  PAGE_START_COL,
  PAGE_TOP_ROWS,
  SECTION_GAP,
  moviePageLayout,
} from './movie-page-layout';

/** Drum rows for a viewport tall enough to fit `n` card rows, plus the header band. */
function rowsFor(cardRows: number): number {
  return cardRows * CARD_ROWS + (cardRows - 1) * CARD_GAP + PAGE_TOP_ROWS;
}

describe('moviePageLayout', () => {
  it('gives cast and related the card rows the height allows', () => {
    expect(moviePageLayout(rowsFor(1), 4, 4).rows).toBe(1);
    expect(moviePageLayout(rowsFor(2), 4, 4).rows).toBe(2);
    expect(moviePageLayout(rowsFor(3), 4, 4).rows).toBe(3);
  });

  it('spans the aside, the facts and both strips', () => {
    const layout = moviePageLayout(rowsFor(2), 4, 4);

    expect(layout.totalCols).toBe(
      PAGE_START_COL +
        ASIDE_COLS +
        FACTS_COLS +
        layout.castCols +
        layout.relatedCols +
        SECTION_GAP * 3,
    );
  });

  /**
   * The point of the whole calculation: the page clips horizontal overflow, so a strip
   * wider than the declared span exists but cannot be scrolled to.
   */
  it('widens as more films arrive', () => {
    const few = moviePageLayout(rowsFor(2), 4, 4).totalCols;
    const many = moviePageLayout(rowsFor(2), 4, 20).totalCols;
    expect(many).toBeGreaterThan(few);
  });

  /** A taller window fits more tiles per column, so the page gets *narrower*. */
  it('is narrower when the viewport is taller', () => {
    const short = moviePageLayout(rowsFor(1), 12, 12).totalCols;
    const tall = moviePageLayout(rowsFor(3), 12, 12).totalCols;
    expect(tall).toBeLessThan(short);
  });

  it('charges no width or gap for a section with nothing in it', () => {
    const withCast = moviePageLayout(rowsFor(2), 6, 6);
    const without = moviePageLayout(rowsFor(2), 0, 6);

    expect(without.castCols).toBe(0);
    expect(without.totalCols).toBe(
      withCast.totalCols - withCast.castCols - SECTION_GAP,
    );
  });

  it('still spans the fixed sections with no cast and no related films', () => {
    const layout = moviePageLayout(rowsFor(2), 0, 0);

    expect(layout.totalCols).toBe(
      PAGE_START_COL + ASIDE_COLS + FACTS_COLS + SECTION_GAP,
    );
  });

  it('survives a viewport too short for a single card row', () => {
    const layout = moviePageLayout(1, 6, 6);
    expect(layout.rows).toBe(1);
    expect(layout.totalCols).toBeGreaterThan(PAGE_START_COL);
  });
});
