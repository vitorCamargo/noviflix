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
  headline: 0,
  headlineTail: 90,
  subhead: 200,
  dots: 240,
  search: 300,
  hero: 360,
  heroText: 700,
  poster: 560,
  stats: 660,
  badge: 760,
  carousel: 820,
};

export const TRAIL_STEP_MS = 45;

export const AVATAR_STEP_MS = 70;

export const ENTRANCE_BUDGET_MS = 1500;

export function beatDelay(beat: HomeBeat): number {
  return BEATS[beat];
}

export function stepDelay(beat: HomeBeat, index: number, step: number): number {
  return BEATS[beat] + Math.max(0, index) * step;
}

export function beatOrder(): HomeBeat[] {
  return (Object.keys(BEATS) as HomeBeat[]).sort((a, b) => BEATS[a] - BEATS[b]);
}
