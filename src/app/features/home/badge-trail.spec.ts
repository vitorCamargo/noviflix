import { TRAIL_RADIUS, badgeTrail } from './badge-trail';

describe('badgeTrail', () => {
  const dots = badgeTrail();

  it('is deterministic', () => {
    expect(badgeTrail()).toEqual(dots);
  });

  it('is symmetric about the badge', () => {
    const left = dots.filter((d) => d.x < -0.001);
    const right = dots.filter((d) => d.x > 0.001);
    expect(left).toHaveLength(right.length);
  });

  it('completes the circle', () => {
    const deepest = Math.max(...dots.map((d) => d.y));
    expect(deepest).toBeGreaterThan(TRAIL_RADIUS * 1.9);
  });

  it('keeps every dot on the circle', () => {
    for (const dot of dots) {
      expect(Math.hypot(dot.x, dot.y - TRAIL_RADIUS)).toBeCloseTo(TRAIL_RADIUS, 5);
    }
  });

  it('leaves only a small gap at the apex', () => {
    const nearestToBadge = Math.min(...dots.map((d) => Math.hypot(d.x, d.y)));
    expect(nearestToBadge).toBeGreaterThan(20);
    expect(nearestToBadge).toBeLessThan(60);
  });

  it('is brightest near the badge and dims round the back', () => {
    const nearest = dots.reduce((a, b) => (Math.hypot(a.x, a.y) < Math.hypot(b.x, b.y) ? a : b));
    const farthest = dots.reduce((a, b) => (a.y > b.y ? a : b));

    expect(nearest.opacity).toBeGreaterThan(farthest.opacity);
    expect(nearest.size).toBeGreaterThan(farthest.size);
    expect(dots.every((d) => d.opacity > 0 && d.opacity <= 1)).toBe(true);
  });

  it('handles degenerate inputs', () => {
    expect(badgeTrail(0)).toEqual([]);
    expect(badgeTrail(TRAIL_RADIUS, 0)).toEqual([]);
  });
});
