import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Cell indices for a dot matrix.
 *
 * Only the count matters for rendering — CSS grid places them — but returning
 * coordinates keeps the shape testable and leaves room for per-dot variation
 * later.
 */
export interface DotCell {
  row: number;
  col: number;
}

export function buildDots(columns: number, rows: number): DotCell[] {
  if (columns <= 0 || rows <= 0) return [];

  const cells: DotCell[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      cells.push({ row, col });
    }
  }
  return cells;
}

/**
 * Accent dot matrix beside the headline.
 *
 * Laid out with a fixed gap rather than percentage positions: percentages
 * inherit the container's aspect ratio, so a wide box spreads the columns
 * further apart than the rows and the matrix stops reading as square-pitched.
 * A fixed gap keeps the spacing equal on both axes whatever the container does,
 * and a 4x5 grid then naturally forms an upright rectangle.
 */
@Component({
  selector: 'nv-dot-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="field"
      aria-hidden="true"
      [style.--dot-cols]="columns()"
      [style.--dot-gap.px]="gap()"
    >
      @for (dot of dots(); track $index) {
        <span class="field__dot"></span>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      pointer-events: none;
    }

    /*
     * The dot size has to be declared here, on the grid itself. It is used by
     * grid-template-columns, and a custom property set on the children is not
     * in scope for the parent's own declarations — that resolved to nothing and
     * collapsed the matrix into a single column.
     */
    .field {
      --dot-size: 5px;
      display: grid;
      grid-template-columns: repeat(var(--dot-cols), var(--dot-size));
      gap: var(--dot-gap);
      /* Shrink to the matrix rather than stretching to the parent, which is
         what keeps the pitch even. */
      inline-size: max-content;
    }

    .field__dot {
      inline-size: var(--dot-size);
      block-size: var(--dot-size);
      border-radius: 50%;
      background: var(--nv-accent);
    }
  `,
})
export class DotField {
  readonly columns = input(4);
  readonly rows = input(5);
  /** Equal spacing on both axes, in px. */
  readonly gap = input(44);

  protected readonly dots = computed(() => buildDots(this.columns(), this.rows()));
}
