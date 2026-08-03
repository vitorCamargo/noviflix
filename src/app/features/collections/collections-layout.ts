import { centreOffset } from '../../layout/page-grid/page-grid';

export const PAGE_START_COL = 3;

export const HEADER_ROWS = 1;

export const LEFT_COLS = 9;

export const CAPTION_ROWS = 5;
export const FIND_ROWS = 1;
export const LEFT_ROWS = CAPTION_ROWS + FIND_ROWS;

export const PANE_GAP = 1;

export const CARD_COLS = 5;
export const CARD_ROWS = 5;

export const CARD_GAP = 1;

export const CREATE_COLS = 2;

export const STAGGER_PATTERN = [0, 3, 1, 4, 2] as const;

export const STAGGER_MAX = Math.max(...STAGGER_PATTERN);

export interface CollectionsLayout {
  captionRow: number;
  captionRowEnd: number;
  findRow: number;
  findRowEnd: number;
  drops: readonly number[];
  bandRows: number;
  bandRow: number;
  bandRowEnd: number;
  fieldCols: number;
  totalCols: number;
}

export function staggerDrops(count: number, available: number): number[] {
  const room = Math.max(0, available - CARD_ROWS);
  const scale = room >= STAGGER_MAX ? 1 : room / STAGGER_MAX;

  return Array.from({ length: Math.max(0, count) }, (_, index) =>
    Math.round(STAGGER_PATTERN[index % STAGGER_PATTERN.length] * scale),
  );
}

export function collectionsLayout(gridRows: number, count: number): CollectionsLayout {
  const available = Math.max(1, gridRows - HEADER_ROWS);

  const drops = staggerDrops(count, available);
  const bandRows = CARD_ROWS + Math.max(0, ...drops);

  const bandRow = 1 + HEADER_ROWS + centreOffset(available, bandRows);

  const captionRow = 1 + HEADER_ROWS + centreOffset(available, LEFT_ROWS);

  const widths = [CREATE_COLS, ...Array.from({ length: count }, () => CARD_COLS)];
  const fieldCols =
    widths.reduce((total, width) => total + width, 0) + (widths.length - 1) * CARD_GAP;

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
