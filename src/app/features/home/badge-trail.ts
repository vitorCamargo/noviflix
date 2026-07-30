export interface TrailDot {
  /** Offset from the badge centre, in px. */
  x: number;
  y: number;
  size: number;
  opacity: number;
}

/** Radius of the circle the dots sit on. */
export const TRAIL_RADIUS = 132;

/**
 * Angular gap either side of the apex, in degrees.
 *
 * Small, so dots come right up to the badge — but not zero, or the topmost
 * ones would sit underneath it.
 */
export const TRAIL_GAP = 11;

export const TRAIL_COUNT = 24;

/**
 * A full ring of dots with the badge at its top.
 *
 * The circle's centre sits one radius directly below the badge, so the badge is
 * the apex of a complete circle rather than the peak of an arc. Dots continue
 * all the way round and pass behind the cards, which is what makes the ring
 * read as sitting in the scene rather than being drawn on top of it.
 */
export function badgeTrail(
  radius = TRAIL_RADIUS,
  count = TRAIL_COUNT,
  gap = TRAIL_GAP,
): TrailDot[] {
  if (count <= 0 || radius <= 0) return [];

  const dots: TrailDot[] = [];

  for (let i = 0; i < count; i++) {
    // Evenly spaced round the whole circle, measured from the apex.
    const fromApex = -180 + (i / count) * 360;

    if (Math.abs(fromApex) < gap) continue;

    const radians = (fromApex * Math.PI) / 180;

    const x = Math.sin(radians) * radius;
    const y = radius - Math.cos(radians) * radius;

    // Brightest near the badge, dimming round the back of the ring.
    const falloff = Math.abs(fromApex) / 180;

    dots.push({
      x,
      y,
      size: 6 - falloff * 1.5,
      opacity: 1 - falloff * 0.45,
    });
  }
  return dots;
}
