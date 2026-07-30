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
export const HOME_CONTENT_ROWS = 10;

/** Columns the composition needs before the grid starts widening past it. */
export const HOME_MIN_COLUMNS = 22;

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

/**
 * Shifts every area down so the composition sits centred vertically.
 *
 * Base rows start at 0 for blocks that sit above the hero, so the offset also
 * has to keep them on the grid — a row 0 placement would be invalid CSS.
 */
export function homeAreas(rows: number): HomeAreas {
  const offset = Math.max(1, centreOffset(rows, HOME_CONTENT_ROWS));
  const out = {} as HomeAreas;

  for (const key of Object.keys(BASE) as HomeAreaKey[]) {
    out[key] = offsetArea(BASE[key], offset);
  }
  return out;
}
