import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of, switchMap } from 'rxjs';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import { GuestSessionService } from '../guest-session.service';
import {
  RATING_MAX,
  RATING_MIN,
  RATING_STARS,
  RATING_STEP,
  ratingFromStar,
  snapRating,
  starFill,
} from '../rating';

type SubmitState = 'idle' | 'sending' | 'sent' | 'failed';

/**
 * Half-star rating control, posting to TMDB against a guest session.
 *
 * The stars are one radio group rather than ten buttons: a rating is a single
 * choice from a fixed set, and radios give arrow-key selection, a single tab stop
 * and the right announcement without any of it being reimplemented here.
 */
@Component({
  selector: 'nv-rating-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rating-form.html',
  styleUrl: './rating-form.scss',
})
export class RatingForm {
  private readonly tmdb = inject(TmdbService);
  private readonly guest = inject(GuestSessionService);
  protected readonly i18n = inject(I18nService);

  readonly movieId = input.required<number>();

  protected readonly stars = Array.from({ length: RATING_STARS }, (_, i) => i + 1);
  protected readonly min = RATING_MIN;
  protected readonly max = RATING_MAX;
  protected readonly step = RATING_STEP;

  /** Chosen but unsent. Null until the visitor picks something. */
  protected readonly value = signal<number | null>(null);

  /** Follows the pointer across the stars, without committing anything. */
  protected readonly preview = signal<number | null>(null);

  protected readonly state = signal<SubmitState>('idle');

  /** What the stars should show: the hover if there is one, else the choice. */
  protected readonly shown = computed(() => this.preview() ?? this.value() ?? 0);

  protected readonly canSubmit = computed(
    () => this.value() !== null && this.state() !== 'sending',
  );

  /**
   * Spoken form of the slider's position.
   *
   * A range input announces a bare number, which here would be "seven" with no
   * indication of the scale it sits on.
   */
  protected readonly valueText = computed(() => {
    const picked = this.value();
    return picked === null
      ? null
      : this.i18n.t('movie.ratingOf', { value: picked, max: RATING_MAX });
  });

  protected fill(star: number): 0 | 0.5 | 1 {
    return starFill(star, this.shown());
  }

  protected pick(star: number, half: boolean): void {
    this.value.set(ratingFromStar(star, half));
    // A new choice after a failure or a success starts a fresh attempt, so the
    // previous outcome must stop being reported.
    if (this.state() !== 'sending') this.state.set('idle');
  }

  protected hover(star: number, half: boolean): void {
    this.preview.set(ratingFromStar(star, half));
  }

  protected clearHover(): void {
    this.preview.set(null);
  }

  /** Keyboard path: the range input carries the same value in half steps. */
  protected onSlider(event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    this.value.set(snapRating(raw));
    if (this.state() !== 'sending') this.state.set('idle');
  }

  protected submit(): void {
    const rating = this.value();
    if (rating === null || this.state() === 'sending') return;

    this.state.set('sending');

    /*
     * The session is fetched first and every time, because it may have expired
     * since the page loaded. The service returns a cached id when one is still
     * good, so this is usually free.
     */
    this.guest
      .sessionId()
      .pipe(
        switchMap((sessionId) =>
          this.tmdb.rateMovie(this.movieId(), rating, sessionId),
        ),
        catchError((error: unknown) => of(error instanceof HttpErrorResponse ? error : null)),
      )
      .subscribe((result) => {
        if (result && !(result instanceof HttpErrorResponse) && result.success) {
          this.state.set('sent');
          return;
        }

        const status = result instanceof HttpErrorResponse ? result.status : 0;

        /*
         * Only an auth failure means the session is the problem. Discarding it on
         * anything else — a proxy misconfiguration, a network drop — would burn a
         * fresh session on every retry while never addressing the actual cause.
         */
        if (status === 401 || status === 403) this.guest.clear();

        // Surfaced because the visible message deliberately says nothing technical,
        // and without this a 405 from the proxy is indistinguishable from a refusal
        // by TMDB.
        console.error('[noviflix] rating failed', { status, movieId: this.movieId() });
        this.state.set('failed');
      });
  }
}
