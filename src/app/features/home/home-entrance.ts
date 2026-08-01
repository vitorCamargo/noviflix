/**
 * The order the home composition assembles itself in, as plain data.
 *
 * The blocks are placed by drum coordinates, which says nothing about *when* each one arrives — and
 * arriving all at once reads as a page that was simply switched on. The table below is the reading
 * order: the sentence first, then what it is about, then the details hanging off that.
 *
 * Milliseconds after the first-load screen begins to clear, so the composition assembles into the
 * space the screen leaves rather than starting behind it.
 */

/** Every block that arrives on its own beat. */
export type HomeBeat =
  | 'headline'
  | 'headlineTail'
  | 'subhead'
  | 'dots'
  | 'search'
  | 'hero'
  | 'heroText'
  | 'poster'
  | 'stats'
  | 'badge'
  | 'carousel';

const BEATS: Record<HomeBeat, number> = {
  // The sentence, one line after the other — the pause between them is what makes it read as
  // written rather than displayed.
  headline: 0,
  headlineTail: 90,
  subhead: 200,
  // Behind the type, and only once there is type for it to sit behind.
  dots: 240,
  search: 300,
  // The film itself, opening as the words settle.
  hero: 360,
  // Its title waits for the image to be most of the way open, or it reads as a caption on nothing.
  heroText: 700,
  poster: 560,
  stats: 660,
  badge: 760,
  carousel: 820,
};

/** Between one trail dot and the next, so the arc draws rather than appears. */
export const TRAIL_STEP_MS = 45;

/** Between one avatar and the next, in the order they sit in the strip. */
export const AVATAR_STEP_MS = 70;

/**
 * How long the whole entrance may take.
 *
 * A budget, not a measurement: an introduction is over before the visitor decides to do something,
 * and past about a second and a half they are already reaching for the search field. The test holds
 * every beat, including the staggered tails, inside this.
 */
export const ENTRANCE_BUDGET_MS = 1500;

/** The delay for one beat, in milliseconds. */
export function beatDelay(beat: HomeBeat): number {
  return BEATS[beat];
}

/** The delay for the nth item of a staggered group. */
export function stepDelay(beat: HomeBeat, index: number, step: number): number {
  return BEATS[beat] + Math.max(0, index) * step;
}

/** The beats in the order they fire, for anything that needs to reason about the sequence. */
export function beatOrder(): HomeBeat[] {
  return (Object.keys(BEATS) as HomeBeat[]).sort((a, b) => BEATS[a] - BEATS[b]);
}
