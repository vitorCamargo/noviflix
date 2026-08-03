import { centreOffset, offsetArea, type DrumArea } from '../../layout/page-grid/page-grid';

export const HOME_CONTENT_ROWS = 9;

const HEADER_ROWS = 1;

export const HOME_COMPACT_MAX = 1240;

export const HOME_STACK_MAX = 900;

const BASE = {
  caption: { row: 3, rowEnd: 7, col: 3, colEnd: 12 },
  action: { row: 7, rowEnd: 8, col: 3, colEnd: 9 },
  hero: { row: 2, rowEnd: 8, col: 13, colEnd: 21 },
  poster: { row: 1, rowEnd: 6, col: 19, colEnd: 22 },
  stats: { row: 6, rowEnd: 7, col: 20, colEnd: 23 },
  badge: { row: 0, rowEnd: 1, col: 17, colEnd: 18 },
  carousel: { row: 8, rowEnd: 9, col: 13, colEnd: 21 },
} as const satisfies Record<string, DrumArea>;

export const POSTER_NUDGE = 'calc(var(--nv-grid-cell) / 2) calc(var(--nv-grid-cell) / -2)';

export const CAROUSEL_NUDGE = '0 calc(var(--nv-grid-cell) / 2)';

export type HomeAreaKey = keyof typeof BASE;

export type HomeAreas = Record<HomeAreaKey, DrumArea>;

const COMPACT_SHIFT = 2;

const COMPACT_SHIFTS: readonly HomeAreaKey[] = ['hero', 'poster', 'stats', 'badge', 'carousel'];

const RESULTS_COL = BASE.hero.col;

export function homeResultsArea(rows: number, compact = false, widthDrums = 0): DrumArea {
  const shift = compact ? COMPACT_SHIFT : 0;
  const col = RESULTS_COL - shift;
  const fallbackEnd = Math.max(...Object.values(BASE).map((a) => a.colEnd)) - shift;

  return {
    row: 2,
    rowEnd: Math.max(3, rows + 1),
    col,
    colEnd: Math.max(fallbackEnd, col + widthDrums),
  };
}

export function homeResultsColumns(rows: number, compact: boolean, widthDrums: number): number {
  return homeResultsArea(rows, compact, widthDrums).colEnd;
}

function shiftColumns(area: DrumArea, by: number): DrumArea {
  return { ...area, col: area.col - by, colEnd: area.colEnd - by };
}

export function homeMinColumns(compact = false): number {
  const areas = homeAreas(HOME_CONTENT_ROWS, compact);
  return Math.max(...Object.values(areas).map((area) => area.colEnd));
}

const BASE_ROW_START = Math.min(...Object.values(BASE).map((a) => a.row));
const BASE_ROW_END = Math.max(...Object.values(BASE).map((a) => a.rowEnd));

function verticalOffset(rows: number): number {
  const span = BASE_ROW_END - BASE_ROW_START;
  const available = Math.max(span, rows - HEADER_ROWS);

  const desired = 1 + HEADER_ROWS + centreOffset(available, span) - BASE_ROW_START;
  const furthest = Math.max(1, rows - BASE_ROW_END + 1);

  return Math.min(desired, furthest);
}

export function homeAreas(rows: number, compact = false): HomeAreas {
  const offset = verticalOffset(rows);
  const out = {} as HomeAreas;

  for (const key of Object.keys(BASE) as HomeAreaKey[]) {
    let area = offsetArea(BASE[key], offset);

    if (compact && COMPACT_SHIFTS.includes(key)) {
      area = shiftColumns(area, COMPACT_SHIFT);
    }
    out[key] = area;
  }
  return out;
}
