import { CARD_COLS, CARD_GAP, CARD_ROWS, resultGridWidth, resultRowCount } from './results-metrics';

describe('resultRowCount', () => {
  it('fits one card row before there is room for a gap', () => {
    expect(resultRowCount(CARD_ROWS)).toBe(1);
  });

  it('needs a gap before a second row fits', () => {
    expect(resultRowCount(CARD_ROWS * 2)).toBe(1);
    expect(resultRowCount(CARD_ROWS * 2 + CARD_GAP)).toBe(2);
  });

  it('fits three rows in the space for three plus two gaps', () => {
    expect(resultRowCount(CARD_ROWS * 3 + CARD_GAP * 2)).toBe(3);
  });

  it('never returns zero rows', () => {
    expect(resultRowCount(0)).toBe(1);
    expect(resultRowCount(-5)).toBe(1);
  });
});

describe('resultGridWidth', () => {
  it('is zero with nothing to show', () => {
    expect(resultGridWidth(0, 2)).toBe(0);
  });

  it('measures a single column without a trailing gap', () => {
    expect(resultGridWidth(2, 2)).toBe(CARD_COLS);
  });

  it('adds a gap between columns only', () => {
    expect(resultGridWidth(4, 2)).toBe(CARD_COLS * 2 + CARD_GAP);
    expect(resultGridWidth(6, 2)).toBe(CARD_COLS * 3 + CARD_GAP * 2);
  });

  it('rounds a partial column up', () => {
    expect(resultGridWidth(3, 2)).toBe(resultGridWidth(4, 2));
  });

  it('is narrower when more rows are available', () => {
    expect(resultGridWidth(12, 3)).toBeLessThan(resultGridWidth(12, 2));
  });

  it('guards against a zero row count', () => {
    expect(resultGridWidth(10, 0)).toBe(0);
  });
});
