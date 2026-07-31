import type { Video } from '../../../core/models/tmdb.models';

/**
 * How long the pointer must rest on the card before a trailer is fetched.
 *
 * Without this, sweeping across the hero on the way to something else fires a
 * network request and starts a video the person never asked for. Long enough to
 * read as intent, short enough not to feel unresponsive.
 */
export const HOVER_INTENT_MS = 450;

/**
 * Ranks a clip's suitability as the thing to autoplay. Higher wins.
 *
 * Only YouTube is scored: it is the only site TMDB returns that we have an
 * embed for, so anything else is unplayable here regardless of how apt it is.
 */
export function trailerScore(video: Video): number {
  if (video.site !== 'YouTube') return -1;

  /*
   * The type weights are spaced far enough apart that officialness can never
   * bridge them. Otherwise an official teaser ties an unofficial trailer, and
   * which one plays comes down to array order rather than a decision.
   */
  let score = 0;
  if (video.type === 'Trailer') score += 10;
  else if (video.type === 'Teaser') score += 5;
  // Clips and featurettes are better than nothing but rarely representative.
  else score += 1;

  if (video.official) score += 2;
  return score;
}

/**
 * Best clip to play, or null when nothing is embeddable.
 *
 * Ties keep the earlier entry, since TMDB returns its own preferred order and
 * that is a better tiebreak than anything derivable here.
 */
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

/**
 * Embed URL for a background trailer.
 *
 * `mute=1` is not a preference — browsers refuse to autoplay audible video, so
 * an unmuted embed would simply never start. Controls and keyboard handling are
 * off because the card owns the interaction; `loop` keeps a short trailer from
 * ending on YouTube's related-video screen.
 */
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

  // nocookie host: no tracking cookie is set unless playback actually begins.
  return `https://www.youtube-nocookie.com/embed/${key}?${params}`;
}
