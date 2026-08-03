export interface TrailDot {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export const TRAIL_RADIUS = 132;

export const TRAIL_GAP = 11;

export const TRAIL_COUNT = 24;

export function badgeTrail(
  radius = TRAIL_RADIUS,
  count = TRAIL_COUNT,
  gap = TRAIL_GAP,
): TrailDot[] {
  if (count <= 0 || radius <= 0) return [];

  const dots: TrailDot[] = [];

  for (let i = 0; i < count; i++) {
    const fromApex = -180 + (i / count) * 360;

    if (Math.abs(fromApex) < gap) continue;

    const radians = (fromApex * Math.PI) / 180;

    const x = Math.sin(radians) * radius;
    const y = radius - Math.cos(radians) * radius;

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
