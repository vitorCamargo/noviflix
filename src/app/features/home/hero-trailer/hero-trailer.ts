import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { catchError, of } from 'rxjs';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import type { Video } from '../../../core/models/tmdb.models';
import { HOVER_INTENT_MS, embedUrl, pickTrailer } from './trailer';

/**
 * `loading` covers both fetching the video list and waiting for the embed to be
 * ready — from the viewer's side those are one wait, so they are one state.
 *
 * `unavailable` is distinct from `idle`: it means we asked and there is nothing
 * to play, so the control should stop offering.
 */
export type TrailerState = 'idle' | 'loading' | 'playing' | 'unavailable';

@Component({
  selector: 'nv-hero-trailer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (embed(); as src) {
      <div class="video" [class.is-ready]="state() === 'playing'">
        <iframe
          [src]="src"
          title=""
          aria-hidden="true"
          tabindex="-1"
          frameborder="0"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="autoplay; encrypted-media; picture-in-picture"
          (load)="onEmbedReady()"
        ></iframe>
      </div>
    }

    @if (state() !== 'unavailable') {
      <button
        type="button"
        class="btn"
        [class.is-busy]="state() === 'loading'"
        [attr.aria-label]="label()"
        [attr.aria-busy]="state() === 'loading'"
        (click)="toggle()"
      >
        @switch (state()) {
          @case ('loading') {
            <svg class="btn__spinner" viewBox="0 0 32 32" aria-hidden="true">
              <circle cx="16" cy="16" r="12" />
            </svg>
          }
          @case ('playing') {
            <svg class="btn__glyph" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="7" y="5" width="3.6" height="14" rx="1.2" />
              <rect x="13.4" y="5" width="3.6" height="14" rx="1.2" />
            </svg>
          }
          @default {
            <svg class="btn__glyph" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.5 5.2 19 12 8.5 18.8Z" />
            </svg>
          }
        }
      </button>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    /*
     * Sits over the backdrop rather than replacing it. Nothing has to coordinate
     * hiding the image — the video simply covers it, and removing the video
     * reveals it again, so the reset is just an unmount.
     */
    .video {
      position: absolute;
      inset: 0;
      z-index: 1;
      overflow: hidden;
      opacity: 0;
      transition: opacity var(--nv-slow) var(--nv-ease-panel);
      /* Keeps the card authoritative over hover and clicks, not the embed. */
      pointer-events: none;
    }

    .video.is-ready {
      opacity: 1;
    }

    /*
     * Cover behaviour for a fixed-ratio iframe: the aspect ratio holds while
     * both minimums force it past the card's bounds, so it crops rather than
     * letterboxes. object-fit does not apply to iframes.
     *
     * The scale on top is overscan — see the token for why it is the only way
     * to be rid of YouTube's title and control bands. Individual transform
     * properties compose translate before scale, so the element stays centred.
     */
    .video iframe {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: 50%;
      translate: -50% -50%;
      scale: var(--nv-trailer-overscan);
      min-inline-size: 100%;
      min-block-size: 100%;
      inline-size: auto;
      block-size: auto;
      aspect-ratio: 16 / 9;
      border: 0;
    }

    /*
     * Top-left, because every other corner of the hero is claimed: the poster
     * overlaps top-right, the popularity card bottom-right, and the title and
     * genre chips occupy the bottom-left. Offsets are exposed as properties so
     * the caller can move it if the composition changes again.
     */
    .btn {
      position: absolute;
      inset-block-start: var(--btn-inset-block, var(--nv-space-5));
      inset-inline-start: var(--btn-inset-inline, var(--nv-space-5));
      /* Above the scrim and the title block, both of which cover the video. */
      z-index: 4;
      display: grid;
      place-items: center;
      inline-size: 52px;
      block-size: 52px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: var(--nv-bg-raised);
      color: var(--nv-accent);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.55);
      transition: transform var(--nv-fast) var(--nv-ease);
    }

    .btn:hover {
      transform: scale(1.07);
    }

    .btn__glyph {
      inline-size: 22px;
      block-size: 22px;
      fill: currentColor;
    }

    /* An arc rather than a full ring, so rotation is legible as progress. */
    .btn__spinner {
      inline-size: 26px;
      block-size: 26px;
      fill: none;
      animation: nv-trailer-spin 900ms linear infinite;
    }

    .btn__spinner circle {
      fill: none;
      stroke: currentColor;
      stroke-width: 3;
      stroke-linecap: round;
      /* Roughly a third of the circumference, leaving the rest open. */
      stroke-dasharray: 26 75;
    }

    @keyframes nv-trailer-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class HeroTrailer implements OnDestroy {
  private readonly tmdb = inject(TmdbService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly i18n = inject(I18nService);

  readonly movieId = input<number | null>(null);
  /** Pointer resting anywhere on the card. */
  readonly hovered = input(false);

  readonly stateChange = output<TrailerState>();

  protected readonly state = signal<TrailerState>('idle');

  private readonly trailerKey = signal<string | null>(null);

  protected readonly embed = computed(() => {
    const key = this.trailerKey();
    if (!key) return null;
    // The URL is built here from a TMDB video key, never from user input.
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl(key));
  });

  protected readonly label = computed(() => {
    switch (this.state()) {
      case 'loading':
        return this.i18n.t('trailer.loading');
      case 'playing':
        return this.i18n.t('trailer.pause');
      default:
        return this.i18n.t('trailer.play');
    }
  });

  /**
   * Video lists already fetched, so re-hovering the same card is free.
   * `null` records "asked, nothing playable" — worth remembering too.
   */
  private readonly cache = new Map<number, Video | null>();

  private intentTimer: ReturnType<typeof setTimeout> | null = null;
  /** Guards against a resolved fetch for a card the pointer has since left. */
  private requestToken = 0;

  constructor() {
    // Changing card always returns to the backdrop; the previous trailer has
    // nothing to do with the film now on screen.
    effect(() => {
      this.movieId();
      this.reset();
    });

    /*
     * Reacts to hover changing, and *only* to hover changing.
     *
     * The state reads have to be untracked. Left tracked, they made this effect
     * depend on the very state it tears down: pressing the button set `loading`,
     * which re-ran the effect, which saw no hover and reset — so click-to-play
     * cancelled itself the instant it started. That made the button dead on
     * touch, where hover never becomes true at all.
     */
    effect(() => {
      const hovered = this.hovered();

      untracked(() => {
        if (!hovered) {
          this.clearIntent();
          // Leaving cancels an in-flight load as well as stopping playback.
          if (this.state() !== 'idle') this.reset();
          return;
        }

        // Motion-triggered video is exactly what this setting asks us not to do,
        // so hover does nothing and the button remains the way in.
        if (prefersReducedMotion()) return;
        if (this.state() !== 'idle') return;

        this.clearIntent();
        this.intentTimer = setTimeout(() => {
          this.intentTimer = null;
          void this.start();
        }, HOVER_INTENT_MS);
      });
    });

    effect(() => this.stateChange.emit(this.state()));
  }

  ngOnDestroy(): void {
    this.clearIntent();
  }

  /** Click is deliberate, so it skips the hover-intent delay entirely. */
  protected toggle(): void {
    if (this.state() === 'idle') {
      void this.start();
      return;
    }
    this.reset();
  }

  protected onEmbedReady(): void {
    // Only promote if still loading — a late load event after the pointer left
    // must not restart playback.
    if (this.state() === 'loading') this.state.set('playing');
  }

  private async start(): Promise<void> {
    const id = this.movieId();
    if (id == null) return;

    this.state.set('loading');
    const token = ++this.requestToken;

    const cached = this.cache.get(id);
    if (cached !== undefined) {
      this.apply(cached, token);
      return;
    }

    const videos = await new Promise<Video[]>((resolve) => {
      this.tmdb
        .videos(id)
        .pipe(catchError(() => of([] as Video[])))
        .subscribe(resolve);
    });

    const trailer = pickTrailer(videos);
    this.cache.set(id, trailer);
    this.apply(trailer, token);
  }

  private apply(trailer: Video | null, token: number): void {
    // A newer request, or a reset, happened while this was resolving.
    if (token !== this.requestToken) return;

    if (!trailer) {
      this.state.set('unavailable');
      return;
    }

    // Stays in `loading` until the iframe reports ready, so the spinner covers
    // the embed handshake and not just the fetch.
    this.trailerKey.set(trailer.key);
  }

  private reset(): void {
    this.clearIntent();
    // Invalidates any in-flight request.
    this.requestToken++;
    this.trailerKey.set(null);
    this.state.set('idle');
  }

  private clearIntent(): void {
    if (this.intentTimer !== null) {
      clearTimeout(this.intentTimer);
      this.intentTimer = null;
    }
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}
