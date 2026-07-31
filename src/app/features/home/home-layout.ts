import {
  centreOffset,
  offsetArea,
  type DrumArea,
} from '../../layout/page-grid/page-grid';

/**
 * Home laid out in drum coordinates.
 *
 * Rows are relative to a fixed composition block, which then gets centred in
 * whatever row count the viewport yields. Cells are a fixed 64px, so the row
 * count changes with window height — pinning content to absolute rows would
 * slide it up and down the screen as the window resizes.
 */
export const HOME_CONTENT_ROWS = 9;

/**
 * The header floats over the first row on desktop, so centring happens in the
 * rows below it. Without reserving it the composition was measured against the
 * whole viewport and settled a drum too high, with the camera badge landing
 * level with the nav.
 */
const HEADER_ROWS = 1;

/**
 * Below this width the composition shifts to its compact columns.
 *
 * The headline scales with viewport width, so as the window narrows the text
 * shrinks while the hero stays pinned to the same column — opening a growing
 * dead gap between them. Pulling the whole stack left closes it, rather than
 * letting the type shrink into an increasingly empty column.
 */
export const HOME_COMPACT_MAX = 1240;

/**
 * At or below this width the composition is abandoned for a plain vertical
 * stack. There aren't enough columns left for overlap to read as anything but
 * collision, so blocks flow in reading order instead.
 */
export const HOME_STACK_MAX = 900;

const BASE = {
  /** Headline block. */
  caption: { row: 3, rowEnd: 7, col: 3, colEnd: 12 },
  /** Where search will live. */
  action: { row: 7, rowEnd: 8, col: 3, colEnd: 9 },
  /** Backdrop card — landscape, 6 rows by 8 columns. Origin for the stack. */
  hero: { row: 2, rowEnd: 8, col: 13, colEnd: 21 },
  /**
   * Poster + cast. Target is x6.5 / y-1.5 from the hero origin; grid lines are
   * whole drums, so this lands on the whole-drum cell and `POSTER_NUDGE` shifts
   * it the remaining half in each axis.
   */
  poster: { row: 1, rowEnd: 6, col: 19, colEnd: 22 },
  /** Popularity — one drum tall, three wide. Too small for tags. */
  stats: { row: 6, rowEnd: 7, col: 20, colEnd: 23 },
  /** Camera badge, a row higher than the card stack. */
  badge: { row: 0, rowEnd: 1, col: 17, colEnd: 18 },
  /**
   * Avatar strip. Two drums tall rather than one — the extra row is breathing
   * room between the card and the strip, not bigger avatars.
   */
  carousel: { row: 8, rowEnd: 9, col: 13, colEnd: 21 },
} as const satisfies Record<string, DrumArea>;

/**
 * Half-drum shift applied to the poster on top of its grid placement.
 *
 * The only element deliberately off-lattice. Everything else lands on seams;
 * this one overlaps the hero by half a drum so the two cards interlock rather
 * than sitting flush, which is what the reference does.
 */
export const POSTER_NUDGE = 'calc(var(--nv-grid-cell) / 2) calc(var(--nv-grid-cell) / -2)';

/**
 * Half-drum drop applied to the avatar strip.
 *
 * Its grid row sits flush against the hero's bottom edge, which reads as the
 * strip being attached to the card. Half a drum of air separates them without
 * spending a whole row.
 */
export const CAROUSEL_NUDGE = '0 calc(var(--nv-grid-cell) / 2)';

export type HomeAreaKey = keyof typeof BASE;

export type HomeAreas = Record<HomeAreaKey, DrumArea>;

/** Columns the compact variant pulls the card stack left by. */
const COMPACT_SHIFT = 2;

/**
 * Only the card stack moves when compact. The headline block keeps its column,
 * because that is what anchors the page — sliding it to the edge as well would
 * just move the gap rather than close it.
 */
const COMPACT_SHIFTS: readonly HomeAreaKey[] = [
  'hero',
  'poster',
  'stats',
  'badge',
  'carousel',
];

function shiftColumns(area: DrumArea, by: number): DrumArea {
  return { ...area, col: area.col - by, colEnd: area.colEnd - by };
}

/** Rightmost grid line the composition reaches, which is what the grid must fit. */
export function homeMinColumns(compact = false): number {
  const areas = homeAreas(HOME_CONTENT_ROWS, compact);
  return Math.max(...Object.values(areas).map((area) => area.colEnd));
}

/** First and last grid line the composition touches, taken from the areas. */
const BASE_ROW_START = Math.min(...Object.values(BASE).map((a) => a.row));
const BASE_ROW_END = Math.max(...Object.values(BASE).map((a) => a.rowEnd));

/**
 * Rows to push the composition down so it sits centred below the header.
 *
 * The arithmetic is easy to get subtly wrong, which is what happened here. Grid
 * lines are 1-based while the base areas start at line 0, so a block spanning
 * lines 0 to 9 is *nine* tracks, not ten — centring against ten put it a drum
 * and a half too high. On a tall monitor that slack is a small fraction of the
 * page and reads as fine; on a laptop it is most of the slack there is, so the
 * content ends up against the top.
 *
 * The result is clamped both ways: never above the first row, since line 0 is
 * invalid CSS, and never so far down that the composition is pushed off the
 * bottom of a short viewport.
 */
function verticalOffset(rows: number): number {
  const span = BASE_ROW_END - BASE_ROW_START;
  const available = Math.max(span, rows - HEADER_ROWS);

  const desired =
    1 + HEADER_ROWS + centreOffset(available, span) - BASE_ROW_START;
  const furthest = Math.max(1, rows - BASE_ROW_END + 1);

  return Math.min(desired, furthest);
}

/**
 * Shifts every area down so the composition sits centred vertically, and left
 * when the viewport is too narrow to carry the full-width arrangement.
 */
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
