import type { Video } from '../../../core/models/tmdb.models';

export const HOVER_INTENT_MS = 450;

export function trailerScore(video: Video): number {
  if (video.site !== 'YouTube') return -1;

  let score = 0;
  if (video.type === 'Trailer') score += 10;
  else if (video.type === 'Teaser') score += 5;
  else score += 1;

  if (video.official) score += 2;
  return score;
}

export function pickTrailer(videos: readonly Video[]): Video | null {
  let best: Video | null = null;
  let bestScore = 0;

  for (const video of videos) {
    const score = trailerScore(video);
    if (score > bestScore) {
      best = video;
      bestScore = score;
    }
  }
  return best;
}

export function embedUrl(key: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    disablekb: '1',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    loop: '1',
    playlist: key,
    iv_load_policy: '3',
  });

  return `https://www.youtube-nocookie.com/embed/${key}?${params}`;
}
