import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A surface that occupies whole drums.
 *
 * Two rules make cards feel part of the grid rather than dropped on top of it:
 * the card's box is a whole number of cells, and its corner radius matches the
 * pads'. Since the card sits in the same grid, its edges land on the seams, and
 * matching the radius means the rounded corners read as continuing the lattice
 * instead of interrupting it.
 *
 * Hover lights the grid *behind* the card at its four corners, using the same
 * radial glow the pointer casts. It's the same trick as MouseGlow: the light
 * sits under the pads, so it only escapes through the 1px seams and reads as
 * the lattice illuminating around the card — not as a shape drawn on top of it.
 */
@Component({
  selector: 'nv-drum-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    /*
     * Declared on the host rather than by each caller, so the two pointer
     * behaviours travel with the card:
     *  - the cursor takes its focused form, as it does over any control;
     *  - the pointer's own glow steps aside, since the card is already lighting
     *    the grid and two overlapping glows just muddy each other.
     */
    '[attr.data-cursor]': "interactive() ? 'focus' : null",
    '[attr.data-glow]': "interactive() || active() ? 'card' : null",
  },
  template: `
    <div
      class="card"
      [class.card--flat]="flat()"
      [class.is-active]="active()"
    >
      <ng-content />
    </div>

    @if (interactive() || active()) {
      <span class="glow" aria-hidden="true"></span>
    }
  `,
  styles: `
    /*
     * The height chain matters. A card's children are usually absolutely
     * positioned (cover images, scrims), so nothing inside gives the box a
     * height — without an explicit 100% here the host collapses to zero and the
     * card vanishes, or a percentage-sized image falls back to its intrinsic
     * size and overflows its drums. The grid item above has a definite height
     * from the row tracks, so 100% resolves all the way down.
     */
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
      /* Matches the pads so corners continue the lattice. */
      border-radius: var(--nv-grid-radius);
      /*
       * Same seam the pads leave, so gaps read as one system. Overridable because
       * a card is only ever a pixel short of its box to meet a neighbour — where
       * a real gap already separates cards, as in the results grid, the seam is
       * a pixel of nothing.
       */
      margin: 0 var(--nv-card-seam, var(--nv-grid-gap))
        var(--nv-card-seam, var(--nv-grid-gap)) 0;
      background: var(--nv-panel);
      overflow: hidden;
      isolation: isolate;
    }

    .card--flat {
      background: transparent;
    }

    /*
     * Four soft lights, one per corner, on a box that overhangs the card by the
     * glow's reach so each circle is centred on a corner.
     *
     * A negative z-index is what puts it under the pads. The host is positioned but
     * has no z-index of its own, so it isn't a stacking context and a negative
     * child escapes to the page grid's — where negative layers paint before the
     * pads' backgrounds. The card itself stays opaque above, so the only light
     * that survives is what leaks through the seams around the corners.
     */
    /*
     * Colour comes from --nv-card-glow, read with a fallback rather than declared
     * here: declaring it locally would shadow whatever an ancestor sets, and the
     * point is that a caller can tint the light — the search field turns it red
     * while the term is invalid.
     */
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

    /*
     * Stacked layouts drop both grid behaviours.
     *
     * The seam margin exists so a card's edge meets its neighbour the way two
     * pads do; with cards stacked as standalone blocks there is no neighbour, and
     * it just holds them a pixel off the edge they are meant to be flush with.
     *
     * The corner glow goes because it depends on light escaping through the pad
     * seams behind the card. Below this width the pads are a fixed backdrop
     * rather than the layer the card is set into, so there is nothing for the
     * light to leak through and it reads as a halo instead.
     */
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
  /** No surface fill — for cards that are pure imagery. */
  readonly flat = input(false);
  /** Enables the corner crosshairs on hover. */
  readonly interactive = input(false);
  /** Pins the crosshairs on, for the selected item in a set. */
  readonly active = input(false);
}
