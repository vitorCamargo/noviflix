import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  signal,
} from '@angular/core';

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

export function toGridArea(area: DrumArea): string {
  return `${area.row} / ${area.col} / ${area.rowEnd} / ${area.colEnd}`;
}

export function areaCells(area: DrumArea): number {
  return Math.max(0, area.rowEnd - area.row) * Math.max(0, area.colEnd - area.col);
}

export function totalCells(columns: number, rows: number): number {
  return (Math.max(0, columns) + 1) * (Math.max(0, rows) + 1);
}

export function fitColumns(viewportWidth: number, cell: number, minColumns: number): number {
  if (cell <= 0) return Math.max(1, minColumns);
  return Math.max(minColumns, Math.floor(viewportWidth / cell));
}

export function centreOffset(rows: number, contentRows: number): number {
  return Math.max(0, Math.floor((rows - contentRows) / 2));
}

export function offsetArea(area: DrumArea, offset: number): DrumArea {
  return { ...area, row: area.row + offset, rowEnd: area.rowEnd + offset };
}

@Component({
  selector: 'nv-page-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pg" [style.--cols]="size().columns" [style.--rows]="size().rows">
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
      inline-size: max(100%, calc(var(--cols) * var(--nv-grid-cell)));
      block-size: calc(var(--rows) * var(--nv-grid-cell));
      overflow-x: clip;
    }

    .pg__pads {
      grid-area: 1 / 1 / -1 / -1;
      display: grid;
      grid-template-columns: repeat(calc(var(--cols) + 1), var(--nv-grid-cell));
      grid-template-rows: repeat(calc(var(--rows) + 1), var(--nv-grid-cell));
      inline-size: calc((var(--cols) + 1) * var(--nv-grid-cell));
      block-size: calc((var(--rows) + 1) * var(--nv-grid-cell));
      pointer-events: none;
    }

    .pg__pad {
      background: var(--nv-grid-pad);
      border-radius: var(--nv-grid-radius);
      margin: 0 var(--nv-grid-gap) var(--nv-grid-gap) 0;
    }

    @media (max-width: 900px) {
      .pg {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: none;
        grid-auto-rows: auto;
        align-content: start;
        column-gap: var(--nv-space-4);
        padding-inline: var(--nv-space-5);
        inline-size: 100%;
        block-size: auto;
        min-block-size: 100dvh;
        overflow-x: clip;
      }

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
  readonly minColumns = input(18);

  private readonly viewport = signal(readViewport());

  readonly size = computed<PageGridSize>(() => {
    const { width, height } = this.viewport();
    const cell = readCellSize();
    return {
      columns: fitColumns(width, cell, this.minColumns()),
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
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--nv-grid-cell').trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 64;
}
