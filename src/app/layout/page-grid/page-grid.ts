import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  signal,
} from '@angular/core';

/** A rectangle of cells, in 1-based CSS grid line numbers. */
export interface DrumArea {
  row: number;
  rowEnd: number;
  col: number;
  colEnd: number;
}

export interface PageGridSize {
  columns: number;
  rows: number;
}

/** `grid-area` shorthand for an area. */
export function toGridArea(area: DrumArea): string {
  return `${area.row} / ${area.col} / ${area.rowEnd} / ${area.colEnd}`;
}

/** Cells an area covers. Guards against inverted or empty rectangles. */
export function areaCells(area: DrumArea): number {
  return (
    Math.max(0, area.rowEnd - area.row) * Math.max(0, area.colEnd - area.col)
  );
}

/**
 * Total pads to render — one per cell, plus an extra row and column.
 *
 * The pad field is always complete. Content doesn't displace pads, it sits on
 * top of them, so nothing is subtracted for placed areas: leaving gaps punches
 * visible holes in the lattice wherever a block is transparent.
 *
 * The overhang covers viewports that aren't an exact multiple of the cell size.
 * It's clipped, not scrollable.
 */
export function totalCells(columns: number, rows: number): number {
  return (Math.max(0, columns) + 1) * (Math.max(0, rows) + 1);
}

/**
 * Columns the grid should occupy.
 *
 * Floors rather than rounds up: a partial trailing column would make the page
 * fractionally wider than the viewport and leave the track scrollable by a few
 * pixels with nothing to reveal. The pad overhang covers the resulting sliver
 * instead. Scrolling then only happens when the composition genuinely doesn't
 * fit, which is what `minColumns` expresses.
 */
export function fitColumns(
  viewportWidth: number,
  cell: number,
  minColumns: number,
): number {
  if (cell <= 0) return Math.max(1, minColumns);
  return Math.max(minColumns, Math.floor(viewportWidth / cell));
}

/**
 * Vertical offset that centres a block of `contentRows` inside `rows`.
 *
 * Cells are a fixed pixel size, so the row count changes with viewport height.
 * Anchoring content to absolute row numbers would drift up and down the screen;
 * centring keeps the composition put.
 */
export function centreOffset(rows: number, contentRows: number): number {
  return Math.max(0, Math.floor((rows - contentRows) / 2));
}

/** Shifts an area down by `offset` rows. */
export function offsetArea(area: DrumArea, offset: number): DrumArea {
  return { ...area, row: area.row + offset, rowEnd: area.rowEnd + offset };
}

/**
 * A page laid out on the drum lattice.
 *
 * The pads form one unbroken field spanning the whole grid, and projected
 * content is placed over them with `grid-area`. Content shares the same grid,
 * so a card's edges still land exactly on the seams — but it *covers* pads
 * rather than replacing them, which is what keeps the lattice continuous behind
 * transparent blocks like the headline.
 *
 * No z-index is involved: the pad layer is the first child, so every later
 * sibling paints over it in DOM order.
 *
 * Structure follows cruuunchify / v-spotifood.
 */
@Component({
  selector: 'nv-page-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pg"
      [style.--cols]="size().columns"
      [style.--rows]="size().rows"
    >
      <div class="pg__pads" aria-hidden="true">
        @for (pad of pads(); track pad) {
          <span class="pg__pad"></span>
        }
      </div>

      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: block;
      block-size: 100%;
    }

    .pg {
      position: relative;
      display: grid;
      grid-template-columns: repeat(var(--cols), var(--nv-grid-cell));
      grid-template-rows: repeat(var(--rows), var(--nv-grid-cell));
      /*
       * At least as wide as the track. Columns are floored to whole drums, so
       * the page is usually a little narrower than the viewport — without this
       * the pad layer would be clipped to that narrower box and the trailing
       * strip would sit bare. Taking 100% keeps pads to the edge while adding
       * nothing scrollable, since it is exactly the track's width.
       */
      inline-size: max(100%, calc(var(--cols) * var(--nv-grid-cell)));
      block-size: calc(var(--rows) * var(--nv-grid-cell));
      /*
       * clip rather than hidden: it trims the pad overhang without turning this
       * into a scroll container, and unlike hidden it can apply to one axis
       * while the other stays visible — which the badge trail needs.
       */
      overflow-x: clip;
    }

    /*
     * One column and row wider than the page so a viewport that isn't an exact
     * multiple of the cell still has pads to its edges. The excess is clipped
     * by the grid, so it costs no scrollable width.
     */
    .pg__pads {
      grid-area: 1 / 1 / -1 / -1;
      display: grid;
      grid-template-columns: repeat(calc(var(--cols) + 1), var(--nv-grid-cell));
      grid-template-rows: repeat(calc(var(--rows) + 1), var(--nv-grid-cell));
      inline-size: calc((var(--cols) + 1) * var(--nv-grid-cell));
      block-size: calc((var(--rows) + 1) * var(--nv-grid-cell));
      pointer-events: none;
    }

    /* The margin is the seam. Nothing paints a line. */
    .pg__pad {
      background: var(--nv-grid-pad);
      border-radius: var(--nv-grid-radius);
      margin: 0 var(--nv-grid-gap) var(--nv-grid-gap) 0;
    }

    /*
     * Mobile: the lattice stops being a layout device and becomes a backdrop.
     * The grid collapses to two plain columns — most blocks span both and read
     * as a single column, but a page can pair two blocks side by side by taking
     * one column each. Placement comes from the page's own stylesheet here, so
     * pages must drop their drum grid-area bindings at this width.
     *
     * Pads are pinned to the viewport, which also covers the strip behind the
     * header: on desktop the header floats over the grid, but in flow the grid
     * began below it and left that band bare.
     */
    @media (max-width: 900px) {
      .pg {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: none;
        grid-auto-rows: auto;
        align-content: start;
        column-gap: var(--nv-space-4);
        /*
         * One gutter for the whole page, so every block fills the width it is
         * given rather than carrying its own margin. Blocks spanning both columns
         * are therefore exactly the content width.
         */
        padding-inline: var(--nv-space-5);
        inline-size: 100%;
        block-size: auto;
        min-block-size: 100dvh;
        /*
         * Nothing may stick out sideways here. The track is not a scroll rail at
         * this width, so horizontal overflow cannot be scrolled to — it just
         * shifts the page and clips content against the viewport edge.
         */
        overflow-x: clip;
      }

      /*
       * No stacking context here, and no z-index on the pads.
       *
       * Both are tempting, and both break DrumCard: its corner glow relies on a
       * negative z-index escaping the card to land *beneath* this pad layer, so
       * the only light that survives is what leaks through the seams. Isolating
       * the grid traps that glow above the pads and it becomes a halo drawn on
       * top of the card. Content stays above the pads because pinning makes them
       * positioned, and every card is positioned too but later in the DOM — any
       * block that is *not* positioned has to say so for itself.
       *
       * Exactly the viewport, with the drums stretched to fill it rather than the
       * field overhanging.
       *
       * The desktop trick of drawing an extra column and letting it hang over the
       * edge does not work here: this box is the viewport's size, so overhang is
       * real overflow that shifts the page sideways. Auto-fit with a minmax floor
       * lays as many whole drums as fit and then shares the remainder between
       * them, so a viewport that is not a round number of cells gets pads a
       * fraction of a pixel wider instead of a bare strip down the edge.
       */
      .pg__pads {
        position: fixed;
        inset: 0;
        inline-size: auto;
        block-size: auto;
        grid-template-columns: repeat(auto-fit, minmax(var(--nv-grid-cell), 1fr));
        grid-template-rows: repeat(auto-fit, minmax(var(--nv-grid-cell), 1fr));
        grid-auto-rows: var(--nv-grid-cell);
        overflow: clip;
      }
    }
  `,
})
export class PageGrid {
  /** Minimum columns; the grid widens past this to cover the viewport. */
  readonly minColumns = input(18);

  private readonly viewport = signal(readViewport());

  readonly size = computed<PageGridSize>(() => {
    const { width, height } = this.viewport();
    const cell = readCellSize();
    return {
      columns: fitColumns(width, cell, this.minColumns()),
      // Rows can round up freely — vertical overflow is clipped by the track,
      // never scrolled, so a partial bottom row costs nothing.
      rows: Math.max(1, Math.ceil(height / cell)),
    };
  });

  protected readonly pads = computed(() => {
    const { columns, rows } = this.size();
    return Array.from({ length: totalCells(columns, rows) }, (_, i) => i);
  });

  private resizeFrame: number | null = null;

  @HostListener('window:resize')
  protected onResize(): void {
    if (this.resizeFrame !== null) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = null;
      this.viewport.set(readViewport());
    });
  }
}

export function readViewport(): { width: number; height: number } {
  if (typeof window === 'undefined') return { width: 1440, height: 900 };
  return { width: window.innerWidth, height: window.innerHeight };
}

export function readCellSize(): number {
  if (typeof window === 'undefined') return 64;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--nv-grid-cell')
    .trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 64;
}
