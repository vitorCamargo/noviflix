import { describe, expect, it } from 'vitest';
import {
  AVATAR_STEP_MS,
  ENTRANCE_BUDGET_MS,
  TRAIL_STEP_MS,
  beatDelay,
  beatOrder,
  stepDelay,
} from './home-entrance';

/** The longest either staggered group can get, so the budget is checked against a real page. */
const TRAIL_DOTS = 14;
const AVATARS = 5;

describe('home entrance', () => {
  it('opens on the headline, with nothing before it', () => {
    expect(beatDelay('headline')).toBe(0);

    for (const beat of beatOrder()) {
      expect(beatDelay(beat), beat).toBeGreaterThanOrEqual(0);
    }
  });

  it('reads the sentence in order: line, line, blurb, field', () => {
    expect(beatDelay('headline')).toBeLessThan(beatDelay('headlineTail'));
    expect(beatDelay('headlineTail')).toBeLessThan(beatDelay('subhead'));
    expect(beatDelay('subhead')).toBeLessThan(beatDelay('search'));
  });

  it('puts the dots behind type that is already there', () => {
    expect(beatDelay('dots')).toBeGreaterThan(beatDelay('headlineTail'));
  });

  it('opens the film before the cards hanging off it', () => {
    expect(beatDelay('hero')).toBeLessThan(beatDelay('poster'));
    expect(beatDelay('poster')).toBeLessThan(beatDelay('stats'));
    expect(beatDelay('stats')).toBeLessThan(beatDelay('badge'));
  });

  it('holds the hero title until the image is most of the way open', () => {
    expect(beatDelay('heroText')).toBeGreaterThan(beatDelay('hero'));
  });

  it('staggers a group from its own beat', () => {
    expect(stepDelay('carousel', 0, AVATAR_STEP_MS)).toBe(beatDelay('carousel'));
    expect(stepDelay('carousel', 3, AVATAR_STEP_MS)).toBe(
      beatDelay('carousel') + 3 * AVATAR_STEP_MS,
    );
  });

  it('treats a negative index as the first item rather than going backwards', () => {
    expect(stepDelay('badge', -2, TRAIL_STEP_MS)).toBe(beatDelay('badge'));
  });

  it('finishes inside the budget, staggers included', () => {
    const last = Math.max(
      ...beatOrder().map((beat) => beatDelay(beat)),
      stepDelay('badge', TRAIL_DOTS - 1, TRAIL_STEP_MS),
      stepDelay('carousel', AVATARS - 1, AVATAR_STEP_MS),
    );

    expect(last).toBeLessThanOrEqual(ENTRANCE_BUDGET_MS);
  });
});
