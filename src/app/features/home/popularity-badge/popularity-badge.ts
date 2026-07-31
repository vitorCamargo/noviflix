import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { PopularityTier } from '../popularity';

/**
 * Icon for a popularity status, each with motion that reads as its own idea
 * rather than a generic pulse: a flame gutters, a rocket climbs, a gem catches
 * light, an eye blinks. The movement is what identifies the tier before the
 * label is read.
 *
 * Every animation is slow and small on purpose. This sits beside a headline, so
 * anything brisk would pull the eye away from the film.
 */
@Component({
  selector: 'nv-popularity-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tier]': 'tier()',
  },
  template: `
    @switch (tier()) {
      @case ('blazing') {
        <svg class="icon icon--flicker" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2c3.4 3.9 6.2 6.3 6.2 10.1a6.2 6.2 0 0 1-12.4 0c0-2 .9-3.6 2.1-5.2.4 1.6 1.5 2.3 2.6 2.3C11.4 7.6 11.7 4.6 12 2Z"
          />
          <path class="icon__inner" d="M12 12.4c1.5 1.7 2.4 2.7 2.4 4.1a2.4 2.4 0 0 1-4.8 0c0-1.2.8-2.1 1.6-3 .2.7.6 1 1 1 -.3-.9-.2-1.6-.2-2.1Z" />
        </svg>
      }

      @case ('trending') {
        <svg class="icon icon--climb" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 1.8c2.9 2.8 4.4 6.2 4.4 9.9L12 15.2l-4.4-3.5c0-3.7 1.5-7.1 4.4-9.9Z" />
          <path class="icon__fin" d="M7.6 12.4 4.6 15.6l3.2.7M16.4 12.4l3 3.2-3.2.7" />
          <path class="icon__inner" d="M10.5 17.2c.4 2.1 1.5 4 1.5 4s1.1-1.9 1.5-4a4.2 4.2 0 0 0-3 0Z" />
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
        <svg class="icon icon--glint" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.6 19.4 8 12 21.4 4.6 8 12 2.6Z" />
          <path class="icon__facet" d="M4.6 8h14.8M12 2.6 8.6 8l3.4 13.4M12 2.6 15.4 8 12 21.4" />
        </svg>
      }

      @case ('wellKnown') {
        <svg class="icon icon--twinkle" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.8l2.7 5.8 6.3.8-4.6 4.3 1.2 6.2-5.6-3.1-5.6 3.1 1.2-6.2L3 9.4l6.3-.8L12 2.8Z"
          />
        </svg>
      }

      @case ('divisive') {
        <svg class="icon icon--teeter" viewBox="0 0 24 24" aria-hidden="true">
          <path class="icon__beam" d="M12 3.6v15.2M4.8 7.6h14.4M8 20.4h8" />
          <path
            class="icon__pan"
            d="M7 7.8 4.4 13a2.9 2.9 0 0 0 5.2 0L7 7.8ZM17 7.8 14.4 13a2.9 2.9 0 0 0 5.2 0L17 7.8Z"
          />
        </svg>
      }

      @default {
        <svg class="icon icon--blink" viewBox="0 0 24 24" aria-hidden="true">
          <g class="icon__lid">
            <path
              class="icon__outline"
              d="M2.4 12S6 6.4 12 6.4 21.6 12 21.6 12 18 17.6 12 17.6 2.4 12 2.4 12Z"
            />
            <circle class="icon__pupil" cx="12" cy="12" r="3.1" />
          </g>
        </svg>
      }
    }
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

    /* Sized by the caller, since the same badge sits in a one-drum row on
       desktop and in a much taller card when the layout stacks. */
    .icon {
      inline-size: var(--nv-badge-size, 24px);
      block-size: var(--nv-badge-size, 24px);
      display: block;
      fill: currentColor;
      /* Most tiers are solid shapes; stroked details opt in individually. */
      stroke: none;
      /* Motion originates from the shape's base, not its box centre. */
      transform-origin: 50% 70%;
      will-change: transform;
    }

    /* Hairline details drawn over a solid body. */
    .icon__inner,
    .icon__facet,
    .icon__beam,
    .icon__fin,
    .icon__outline {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .icon__inner {
      fill: hsla(0, 0%, 100%, 0.75);
      stroke: none;
    }

    .icon__facet {
      stroke-width: 1.1;
      opacity: 0.45;
    }

    .icon__pan {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linejoin: round;
    }

    /* Guttering: asymmetric squash, never a clean scale, so it reads as fire. */
    .icon--flicker {
      animation: nv-tier-flicker 2.2s var(--nv-ease) infinite;
    }

    /* Climbing: rises, hangs, drops back. */
    .icon--climb {
      animation: nv-tier-climb 2.6s var(--nv-ease-panel) infinite;
    }

    /* Two-stage beat, like a pulse rather than a single throb. */
    .icon--beat {
      animation: nv-tier-beat 1.9s ease-in-out infinite;
    }

    .icon--glint {
      animation: nv-tier-glint 3.2s var(--nv-ease) infinite;
    }

    .icon--twinkle {
      animation: nv-tier-twinkle 3s var(--nv-ease) infinite;
    }

    /* Rocking about the pivot, which is why the origin sits at the fulcrum. */
    .icon--teeter {
      transform-origin: 50% 80%;
      animation: nv-tier-teeter 3.4s ease-in-out infinite;
    }

    /* The lid closes, not the whole icon — hence scaling only the group. */
    .icon--blink .icon__lid {
      transform-origin: 50% 50%;
      animation: nv-tier-blink 4s var(--nv-ease) infinite;
    }

    @keyframes nv-tier-flicker {
      0%, 100% { transform: scale(1, 1) skewX(0deg); }
      25% { transform: scale(0.94, 1.07) skewX(-2.5deg); }
      55% { transform: scale(1.05, 0.96) skewX(2deg); }
      78% { transform: scale(0.97, 1.03) skewX(-1deg); }
    }

    @keyframes nv-tier-climb {
      0%, 100% { transform: translateY(0); }
      30% { transform: translateY(-3.5px); }
      55% { transform: translateY(-2.5px); }
    }

    @keyframes nv-tier-beat {
      0%, 100% { transform: scale(1); }
      14% { transform: scale(1.13); }
      28% { transform: scale(1.02); }
      42% { transform: scale(1.09); }
    }

    @keyframes nv-tier-glint {
      0%, 100% { opacity: 1; transform: scale(1); }
      46% { opacity: 0.62; transform: scale(0.95); }
      58% { opacity: 1; transform: scale(1.04); }
    }

    @keyframes nv-tier-twinkle {
      0%, 100% { transform: rotate(0deg) scale(1); }
      45% { transform: rotate(9deg) scale(1.07); }
      70% { transform: rotate(-4deg) scale(0.98); }
    }

    @keyframes nv-tier-teeter {
      0%, 100% { transform: rotate(-6deg); }
      50% { transform: rotate(6deg); }
    }

    @keyframes nv-tier-blink {
      0%, 88%, 100% { transform: scaleY(1); }
      93% { transform: scaleY(0.12); }
    }
  `,
})
export class PopularityBadge {
  readonly tier = input.required<PopularityTier>();
}
