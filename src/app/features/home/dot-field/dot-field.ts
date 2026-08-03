import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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

    .field {
      --dot-size: 5px;
      display: grid;
      grid-template-columns: repeat(var(--dot-cols), var(--dot-size));
      gap: var(--dot-gap);
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
  readonly gap = input(44);

  protected readonly dots = computed(() => buildDots(this.columns(), this.rows()));
}
