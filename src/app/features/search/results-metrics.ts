export const CARD_COLS = 3;
export const CARD_ROWS = 5;

export const CARD_GAP = 1;

export const TAIL_SLOTS = 4;

export function resultRowCount(availableRows: number): number {
  const perRow = CARD_ROWS + CARD_GAP;
  return Math.max(1, Math.floor((availableRows + CARD_GAP) / perRow));
}

export function resultGridWidth(slots: number, rows: number): number {
  if (slots <= 0 || rows <= 0) return 0;

  const columns = Math.ceil(slots / rows);
  return columns * CARD_COLS + (columns - 1) * CARD_GAP;
}
