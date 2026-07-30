import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  signal,
} from '@angular/core';

export const MIN_COLUMNS = 16;

export const MAX_PADS = 2400;

export interface GridDimensions {
  columns: number;
  rows: number;
}

export function computeGrid(
  viewportWidth: number,
  viewportHeight: number,
  cell: number,
  minColumns = MIN_COLUMNS,
  maxPads = MAX_PADS,
): GridDimensions {
  if (cell <= 0) return { columns: minColumns, rows: 1 };

  const rows = Math.max(1, Math.ceil(viewportHeight / cell));
  let columns = Math.max(minColumns, Math.ceil(viewportWidth / cell));

  if (rows * columns > maxPads) {
    columns = Math.max(1, Math.floor(maxPads / rows));
  }

  return { columns, rows };
}

@Component({
  selector: 'nv-grid-backdrop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="grid"
      aria-hidden="true"
      [style.--cols]="dimensions().columns"
      [style.--rows]="dimensions().rows"
    >
      @for (pad of pads(); track pad) {
        <span class="grid__pad"></span>
      }
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: var(--nv-z-grid);
      overflow: hidden;
      pointer-events: none;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(var(--cols), var(--nv-grid-cell));
      grid-template-rows: repeat(var(--rows), var(--nv-grid-cell));
      inline-size: calc(var(--cols) * var(--nv-grid-cell));
      block-size: calc(var(--rows) * var(--nv-grid-cell));
    }

    /* The margin is the seam. Nothing paints a line. */
    .grid__pad {
      background: var(--nv-grid-pad);
      border-radius: var(--nv-grid-radius);
      margin: 0 var(--nv-grid-gap) var(--nv-grid-gap) 0;
    }
  `,
})
export class GridBackdrop {
  private readonly viewport = signal(readViewport());

  protected readonly dimensions = computed(() => {
    const { width, height } = this.viewport();
    return computeGrid(width, height, readCellSize());
  });

  protected readonly pads = computed(() => {
    const { columns, rows } = this.dimensions();
    return Array.from({ length: columns * rows }, (_, i) => i);
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

function readViewport(): { width: number; height: number } {
  if (typeof window === 'undefined') return { width: 1280, height: 800 };
  return { width: window.innerWidth, height: window.innerHeight };
}

function readCellSize(): number {
  if (typeof window === 'undefined') return 64;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--nv-grid-cell')
    .trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 64;
}
