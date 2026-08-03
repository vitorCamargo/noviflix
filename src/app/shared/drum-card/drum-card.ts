import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'nv-drum-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-cursor]': "interactive() ? 'focus' : null",
    '[attr.data-glow]': "lit() ? 'card' : null",
  },
  template: `
    <div class="card" [class.card--flat]="flat()" [class.is-active]="active()">
      <ng-content />
    </div>

    @if (lit()) {
      <span class="glow" aria-hidden="true"></span>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      block-size: 100%;
      inline-size: 100%;
      min-inline-size: 0;
      min-block-size: 0;
    }

    .card {
      position: relative;
      block-size: 100%;
      inline-size: 100%;
      border-radius: var(--nv-grid-radius);
      margin: 0 var(--nv-card-seam, var(--nv-grid-gap)) var(--nv-card-seam, var(--nv-grid-gap)) 0;
      background: var(--nv-card-surface, var(--nv-panel));
      overflow: hidden;
      isolation: isolate;
    }

    .card--flat {
      background: transparent;
    }

    .glow {
      --reach: 104px;
      --core: color-mix(in srgb, var(--nv-card-glow, #ffffff) 50%, transparent);
      --halo: color-mix(in srgb, var(--nv-card-glow, #ffffff) 10%, transparent);

      position: absolute;
      inset: calc(var(--reach) * -1);
      z-index: -1;
      pointer-events: none;
      opacity: 0;
      transition: opacity var(--nv-normal) var(--nv-ease);
      background:
        radial-gradient(
          circle var(--reach) at var(--reach) var(--reach),
          var(--core),
          var(--halo) 25%,
          transparent 70%
        ),
        radial-gradient(
          circle var(--reach) at calc(100% - var(--reach)) var(--reach),
          var(--core),
          var(--halo) 25%,
          transparent 70%
        ),
        radial-gradient(
          circle var(--reach) at var(--reach) calc(100% - var(--reach)),
          var(--core),
          var(--halo) 25%,
          transparent 70%
        ),
        radial-gradient(
          circle var(--reach) at calc(100% - var(--reach)) calc(100% - var(--reach)),
          var(--core),
          var(--halo) 25%,
          transparent 70%
        );
    }

    :host(:hover) .glow,
    :host(:focus-within) .glow {
      opacity: 1;
    }

    .card.is-active ~ .glow {
      opacity: 1;
    }

    @media (max-width: 900px) {
      .card {
        margin: 0;
      }

      .glow {
        display: none;
      }
    }
  `,
})
export class DrumCard {
  readonly flat = input(false);
  readonly interactive = input(false);
  readonly active = input(false);
  readonly glow = input(true);

  protected readonly lit = computed(() => this.glow() && (this.interactive() || this.active()));
}
