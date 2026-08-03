import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { PopularityTier } from '../popularity';

/**
 * Icon for a popularity status, each with motion that reads as its own idea rather than a generic
 * pulse: a flame gutters, a rocket climbs on its exhaust, a heart beats twice, a gem catches the
 * light, a star's sparkle glints, scales rock, an eye looks about and blinks. The movement is what
 * identifies the tier before the label is read.
 *
 * Two rules learned from the first draft of these. Amplitude has to be a visible fraction of the
 * glyph — two pixels of travel on a 24px icon is motion nobody sees, and "animated" that cannot be
 * told from static is worse than static. And the most legible motion belongs to a *part*, not the
 * whole: an exhaust that flickers under a steady rocket reads instantly, where the same flicker on
 * the whole rocket reads as jitter.
 *
 * Behind each icon sits an aura in the tier's own colour, breathing slowly. It is what makes the
 * badge read as alive from across the composition, before the icon's own movement can be resolved.
 */
@Component({
  selector: 'nv-popularity-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tier]': 'tier()',
  },
  template: `
    <span class="orb">
      <span class="aura" aria-hidden="true"></span>

      @switch (tier()) {
        @case ('blazing') {
          <svg class="icon icon--flame" viewBox="0 0 24 24" aria-hidden="true">
            <path
              class="flame__body"
              d="M12 2c3.4 3.9 6.2 6.3 6.2 10.1a6.2 6.2 0 0 1-12.4 0c0-2 .9-3.6 2.1-5.2.4 1.6 1.5 2.3 2.6 2.3C11.4 7.6 11.7 4.6 12 2Z"
            />
            <path
              class="flame__core"
              d="M12 11.6c1.6 1.9 2.6 3 2.6 4.5a2.6 2.6 0 0 1-5.2 0c0-1.3.8-2.3 1.7-3.3.2.8.6 1.2 1.1 1.2-.3-1-.2-1.8-.2-2.4Z"
            />
          </svg>
        }

        @case ('trending') {
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <g class="rocket">
              <path
                d="M12 1.6c2.6 2.3 3.9 5.1 3.9 8.1 0 1.5-.3 3-.9 4.3H9c-.6-1.3-.9-2.8-.9-4.3 0-3 1.3-5.8 3.9-8.1Z"
              />
              <circle class="rocket__window" cx="12" cy="8.6" r="1.7" />
              <path class="rocket__fin" d="M8.4 11.2 5.6 14.6l3 .7M15.6 11.2l2.8 3.4-3 .7" />
            </g>
            <path
              class="rocket__exhaust"
              d="M12 16.4c1.1 1.2 1.7 2.6 1.7 4h-3.4c0-1.4.6-2.8 1.7-4Z"
            />
          </svg>
        }

        @case ('acclaimed') {
          <svg class="icon icon--beat" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 20.3s-8-4.6-8-9.7a4.6 4.6 0 0 1 8-3.1 4.6 4.6 0 0 1 8 3.1c0 5.1-8 9.7-8 9.7Z"
            />
          </svg>
        }

        @case ('hiddenGem') {
          <svg class="icon icon--gem" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3.2 18.8 8 12 20.8 5.2 8 12 3.2Z" />
            <path class="gem__facet" d="M5.2 8h13.6M12 3.2 9 8l3 12.8M12 3.2 15 8l-3 12.8" />
            <!-- The glint: a four-point spark crossing the stone's shoulder. -->
            <path
              class="gem__spark"
              d="M17.6 2.6l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5.5-1.3Z"
            />
          </svg>
        }

        @case ('wellKnown') {
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              class="star"
              d="M12 3.4l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.4l-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.4Z"
            />
            <path
              class="star__spark"
              d="M19.4 2.4l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6.6-1.5Z"
            />
          </svg>
        }

        @case ('divisive') {
          <svg class="icon icon--teeter" viewBox="0 0 24 24" aria-hidden="true">
            <path class="scale__beam" d="M12 3.6v15.2M4.8 7.6h14.4M8 20.4h8" />
            <path
              class="scale__pan"
              d="M7 7.8 4.4 13a2.9 2.9 0 0 0 5.2 0L7 7.8ZM17 7.8 14.4 13a2.9 2.9 0 0 0 5.2 0L17 7.8Z"
            />
          </svg>
        }

        @default {
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <g class="eye">
              <path
                class="eye__outline"
                d="M2.4 12S6 6.4 12 6.4 21.6 12 21.6 12 18 17.6 12 17.6 2.4 12 2.4 12Z"
              />
              <circle class="eye__pupil" cx="12" cy="12" r="3.1" />
            </g>
          </svg>
        }
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      /* Falls back to lowkey, which is also the default icon branch. */
      color: var(--nv-tier-lowkey);
    }

    :host([data-tier='blazing']) { color: var(--nv-tier-blazing); }
    :host([data-tier='trending']) { color: var(--nv-tier-trending); }
    :host([data-tier='acclaimed']) { color: var(--nv-tier-acclaimed); }
    :host([data-tier='hiddenGem']) { color: var(--nv-tier-gem); }
    :host([data-tier='wellKnown']) { color: var(--nv-tier-known); }
    :host([data-tier='divisive']) { color: var(--nv-tier-divisive); }

    .orb {
      position: relative;
      display: inline-grid;
      place-items: center;
    }

    /*
     * The tier's colour, breathing behind the glyph.
     *
     * This is the part that reads from a distance: the icons' own motion resolves only up close,
     * and a badge whose life depended on it looked static — which is what prompted this rewrite.
     */
    .aura {
      position: absolute;
      inset: -38%;
      border-radius: 50%;
      background: radial-gradient(circle, currentColor 0%, transparent 68%);
      opacity: 0.2;
      animation: nv-tier-aura 2.6s ease-in-out infinite;
      pointer-events: none;
    }

    /* Sized by the caller, since the same badge sits in a one-drum row on desktop and in a much
       taller card when the layout stacks. */
    .icon {
      position: relative;
      inline-size: var(--nv-badge-size, 24px);
      block-size: var(--nv-badge-size, 24px);
      display: block;
      fill: currentColor;
      stroke: none;
      transform-origin: 50% 70%;
    }

    // ------------------------------------------------------------------ flame

    /* The body gutters — asymmetric squash and lean, never a clean scale, so it reads as fire. */
    .icon--flame {
      animation: nv-tier-flicker 1.6s var(--nv-ease) infinite;
    }

    /* The hot core dances against the body, twice as fast and out of phase. */
    .flame__core {
      fill: hsla(0, 0%, 100%, 0.8);
      transform-origin: 50% 85%;
      animation: nv-tier-core 0.8s ease-in-out infinite alternate;
    }

    // ----------------------------------------------------------------- rocket

    /* The ship climbs and settles; the work shows in the exhaust, not the hull. */
    .rocket {
      animation: nv-tier-climb 2.2s var(--nv-ease-panel) infinite;
    }

    .rocket__window {
      fill: hsla(0, 0%, 100%, 0.85);
    }

    .rocket__fin {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Burning: fast, uneven stretches from the nozzle, sharing the climb so the plume stays
       attached to the ship. */
    .rocket__exhaust {
      opacity: 0.9;
      transform-origin: 50% 68%;
      animation: nv-tier-burn 0.5s ease-in-out infinite alternate;
    }

    // ------------------------------------------------------------------ heart

    /* Lub-dub, then rest — a pulse, not a metronome. */
    .icon--beat {
      transform-origin: 50% 55%;
      animation: nv-tier-beat 1.6s ease-in-out infinite;
    }

    // -------------------------------------------------------------------- gem

    /* The stone shimmers by narrowing, as a cut face does turning through light. */
    .icon--gem {
      transform-origin: 50% 50%;
      animation: nv-tier-shimmer 2.8s var(--nv-ease) infinite;
    }

    .gem__facet {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.1;
      opacity: 0.45;
    }

    .gem__spark {
      fill: hsla(0, 0%, 100%, 0.95);
      transform-origin: 74% 17%;
      animation: nv-tier-spark 2.8s var(--nv-ease) infinite;
    }

    // ------------------------------------------------------------------- star

    .star {
      transform-origin: 50% 55%;
      animation: nv-tier-twinkle 2.8s var(--nv-ease) infinite;
    }

    /* Its own beat, offset from the star's, so the two never move as one piece. */
    .star__spark {
      fill: hsla(0, 0%, 100%, 0.95);
      transform-origin: 82% 17%;
      animation: nv-tier-spark 2.8s var(--nv-ease) 1.1s infinite;
    }

    // ----------------------------------------------------------------- scales

    /* Rocking about the pivot, which is why the origin sits at the fulcrum. */
    .icon--teeter {
      transform-origin: 50% 80%;
      animation: nv-tier-teeter 2.6s ease-in-out infinite;
    }

    .scale__beam {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .scale__pan {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linejoin: round;
    }

    // -------------------------------------------------------------------- eye

    .eye__outline {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Looks left, looks right, then blinks — watching, which is what lowkey means here. */
    .eye__pupil {
      animation: nv-tier-gaze 4s var(--nv-ease) infinite;
    }

    .eye {
      transform-origin: 50% 50%;
      animation: nv-tier-blink 4s var(--nv-ease) infinite;
    }

    // -------------------------------------------------------------- keyframes

    @keyframes nv-tier-aura {
      0%, 100% { opacity: 0.14; transform: scale(0.85); }
      50% { opacity: 0.42; transform: scale(1.18); }
    }

    @keyframes nv-tier-flicker {
      0%, 100% { transform: scale(1, 1) skewX(0deg); }
      22% { transform: scale(0.9, 1.12) skewX(-3.5deg); }
      48% { transform: scale(1.08, 0.93) skewX(3deg); }
      74% { transform: scale(0.95, 1.06) skewX(-2deg); }
    }

    @keyframes nv-tier-core {
      from { transform: scale(0.85, 0.8) translateY(6%); opacity: 0.7; }
      to { transform: scale(1.1, 1.15) translateY(-4%); opacity: 1; }
    }

    @keyframes nv-tier-climb {
      0%, 100% { transform: translateY(6%) rotate(0deg); }
      35% { transform: translateY(-8%) rotate(-2.5deg); }
      60% { transform: translateY(-5%) rotate(2deg); }
    }

    @keyframes nv-tier-burn {
      from { transform: translateY(6%) scale(0.7, 0.55); opacity: 0.55; }
      to { transform: translateY(-5%) scale(1.15, 1.3); opacity: 1; }
    }

    @keyframes nv-tier-beat {
      0%, 100% { transform: scale(1); }
      12% { transform: scale(1.22); }
      24% { transform: scale(1.02); }
      36% { transform: scale(1.16); }
      52% { transform: scale(1); }
    }

    @keyframes nv-tier-shimmer {
      0%, 100% { transform: scaleX(1); opacity: 1; }
      45% { transform: scaleX(0.82); opacity: 0.75; }
      60% { transform: scaleX(1.05); opacity: 1; }
    }

    @keyframes nv-tier-spark {
      0%, 55%, 100% { transform: scale(0); opacity: 0; }
      65% { transform: scale(1.4) rotate(20deg); opacity: 1; }
      80% { transform: scale(0.9) rotate(45deg); opacity: 0.8; }
      92% { transform: scale(0); opacity: 0; }
    }

    @keyframes nv-tier-twinkle {
      0%, 100% { transform: rotate(0deg) scale(1); }
      40% { transform: rotate(14deg) scale(1.12); }
      68% { transform: rotate(-7deg) scale(0.95); }
    }

    @keyframes nv-tier-teeter {
      0%, 100% { transform: rotate(-9deg); }
      50% { transform: rotate(9deg); }
    }

    @keyframes nv-tier-blink {
      0%, 86%, 100% { transform: scaleY(1); }
      92% { transform: scaleY(0.1); }
    }

    @keyframes nv-tier-gaze {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-1.8px); }
      55% { transform: translateX(1.8px); }
      80% { transform: translateX(0); }
    }

    /* Still, for anyone who asked for that. The aura keeps a faint constant tint, so the tier's
       colour survives even with every movement gone. */
    @media (prefers-reduced-motion: reduce) {
      .aura,
      .icon,
      .rocket,
      .rocket__exhaust,
      .flame__core,
      .gem__spark,
      .star__spark,
      .star,
      .eye,
      .eye__pupil {
        animation: none;
      }

      .aura {
        opacity: 0.22;
      }

      /* Hidden while still: the sparks only exist mid-animation, and their resting frame is
         invisible only because the animation said so. */
      .gem__spark,
      .star__spark {
        display: none;
      }
    }
  `,
})
export class PopularityBadge {
  readonly tier = input.required<PopularityTier>();
}
