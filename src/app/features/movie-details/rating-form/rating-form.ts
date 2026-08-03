import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of, switchMap } from 'rxjs';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import { GuestRatingsService } from '../guest-ratings.service';
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

@Component({
  selector: 'nv-rating-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rating-form.html',
  styleUrl: './rating-form.scss',
})
export class RatingForm {
  private readonly tmdb = inject(TmdbService);
  private readonly guest = inject(GuestSessionService);
  private readonly ratings = inject(GuestRatingsService);
  protected readonly i18n = inject(I18nService);

  readonly movieId = input.required<number>();

  protected readonly stars = Array.from({ length: RATING_STARS }, (_, i) => i + 1);
  protected readonly min = RATING_MIN;
  protected readonly max = RATING_MAX;
  protected readonly step = RATING_STEP;

  protected readonly value = signal<number | null>(null);

  protected readonly saved = computed(() => this.ratings.ratingFor(this.movieId()));

  protected readonly preview = signal<number | null>(null);

  protected readonly state = signal<SubmitState>('idle');

  protected readonly shown = computed(() => this.preview() ?? this.value() ?? 0);

  protected readonly canSubmit = computed(
    () => this.value() !== null && this.state() !== 'sending',
  );

  protected readonly updating = computed(() => this.saved() !== null);

  protected readonly valueText = computed(() => {
    const picked = this.value();
    return picked === null
      ? null
      : this.i18n.t('movie.ratingOf', { value: picked, max: RATING_MAX });
  });

  constructor() {
    this.ratings.ensureLoaded().subscribe({ error: () => undefined });

    effect(() => {
      const saved = this.saved();

      untracked(() => {
        if (saved !== null && this.value() === null) this.value.set(saved);
      });
    });
  }

  protected fill(star: number): 0 | 0.5 | 1 {
    return starFill(star, this.shown());
  }

  protected pick(star: number, half: boolean): void {
    this.value.set(ratingFromStar(star, half));
    if (this.state() !== 'sending') this.state.set('idle');
  }

  protected hover(star: number, half: boolean): void {
    this.preview.set(ratingFromStar(star, half));
  }

  protected clearHover(): void {
    this.preview.set(null);
  }

  protected onSlider(event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    this.value.set(snapRating(raw));
    if (this.state() !== 'sending') this.state.set('idle');
  }

  protected submit(): void {
    const rating = this.value();
    if (rating === null || this.state() === 'sending') return;

    this.state.set('sending');

    this.guest
      .ensure()
      .pipe(
        switchMap((sessionId) => this.tmdb.rateMovie(this.movieId(), rating, sessionId)),
        catchError((error: unknown) => of(error instanceof HttpErrorResponse ? error : null)),
      )
      .subscribe((result) => {
        if (result && !(result instanceof HttpErrorResponse) && result.success) {
          this.ratings.remember(this.movieId(), rating);
          this.state.set('sent');
          return;
        }

        const status = result instanceof HttpErrorResponse ? result.status : 0;

        if (status === 401 || status === 403) this.guest.clear();

        console.error('[noviflix] rating failed', { status, movieId: this.movieId() });
        this.state.set('failed');
      });
  }
}
