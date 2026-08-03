import { HOVER_INTENT_MS, embedUrl, pickTrailer, trailerScore } from './trailer';
import type { Video } from '../../../core/models/tmdb.models';

const video = (over: Partial<Video>): Video =>
  ({
    id: 'x',
    key: 'abc',
    name: 'clip',
    site: 'YouTube',
    type: 'Trailer',
    official: false,
    ...over,
  }) as Video;

describe('trailerScore', () => {
  it('rejects sites we have no embed for', () => {
    expect(trailerScore(video({ site: 'Vimeo' }))).toBe(-1);
  });

  it('ranks trailers over teasers over anything else', () => {
    const trailer = trailerScore(video({ type: 'Trailer' }));
    const teaser = trailerScore(video({ type: 'Teaser' }));
    const clip = trailerScore(video({ type: 'Featurette' }));

    expect(trailer).toBeGreaterThan(teaser);
    expect(teaser).toBeGreaterThan(clip);
  });

  it('prefers official uploads at equal type', () => {
    expect(trailerScore(video({ official: true }))).toBeGreaterThan(
      trailerScore(video({ official: false })),
    );
  });

  it('weighs type above officialness', () => {
    expect(trailerScore(video({ type: 'Trailer', official: false }))).toBeGreaterThan(
      trailerScore(video({ type: 'Teaser', official: true })),
    );
  });
});

describe('pickTrailer', () => {
  it('picks the best-scoring clip', () => {
    const best = pickTrailer([
      video({ key: 'teaser', type: 'Teaser', official: true }),
      video({ key: 'official', type: 'Trailer', official: true }),
      video({ key: 'fan', type: 'Trailer', official: false }),
    ]);
    expect(best?.key).toBe('official');
  });

  it('keeps the earlier of equally good clips', () => {
    const best = pickTrailer([
      video({ key: 'first', type: 'Trailer', official: true }),
      video({ key: 'second', type: 'Trailer', official: true }),
    ]);
    expect(best?.key).toBe('first');
  });

  it('is null when nothing is embeddable', () => {
    expect(pickTrailer([video({ site: 'Vimeo' })])).toBeNull();
    expect(pickTrailer([])).toBeNull();
  });
});

describe('embedUrl', () => {
  const url = embedUrl('KEY123');

  it('targets the key on the no-cookie host', () => {
    expect(url).toContain('youtube-nocookie.com/embed/KEY123');
  });

  it('autoplays muted', () => {
    expect(url).toContain('autoplay=1');
    expect(url).toContain('mute=1');
  });

  it('hides the embed chrome, since the card owns the interaction', () => {
    expect(url).toContain('controls=0');
    expect(url).toContain('disablekb=1');
    expect(url).toContain('rel=0');
  });

  it('loops back to the same clip', () => {
    expect(url).toContain('loop=1');
    expect(url).toContain('playlist=KEY123');
  });
});

describe('HOVER_INTENT_MS', () => {
  it('is long enough to read as intent and short enough to feel responsive', () => {
    expect(HOVER_INTENT_MS).toBeGreaterThanOrEqual(250);
    expect(HOVER_INTENT_MS).toBeLessThanOrEqual(700);
  });
});
