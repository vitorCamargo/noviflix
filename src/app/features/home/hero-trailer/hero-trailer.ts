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

    .video {
      position: absolute;
      inset: 0;
      z-index: 1;
      overflow: hidden;
      opacity: 0;
      transition: opacity var(--nv-slow) var(--nv-ease-panel);
      pointer-events: none;
    }

    .video.is-ready {
      opacity: 1;
    }

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

    .btn {
      position: absolute;
      inset-block-start: var(--btn-inset-block, var(--nv-space-5));
      inset-inline-start: var(--btn-inset-inline, var(--nv-space-5));
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
  readonly hovered = input(false);

  readonly stateChange = output<TrailerState>();

  protected readonly state = signal<TrailerState>('idle');

  private readonly trailerKey = signal<string | null>(null);

  protected readonly embed = computed(() => {
    const key = this.trailerKey();
    if (!key) return null;
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

  private readonly cache = new Map<number, Video | null>();

  private intentTimer: ReturnType<typeof setTimeout> | null = null;
  private requestToken = 0;

  constructor() {
    effect(() => {
      this.movieId();
      this.reset();
    });

    effect(() => {
      const hovered = this.hovered();

      untracked(() => {
        if (!hovered) {
          this.clearIntent();
          if (this.state() !== 'idle') this.reset();
          return;
        }

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

  protected toggle(): void {
    if (this.state() === 'idle') {
      void this.start();
      return;
    }
    this.reset();
  }

  protected onEmbedReady(): void {
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
    if (token !== this.requestToken) return;

    if (!trailer) {
      this.state.set('unavailable');
      return;
    }

    this.trailerKey.set(trailer.key);
  }

  private reset(): void {
    this.clearIntent();
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
