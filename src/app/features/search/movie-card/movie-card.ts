import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import type { MovieSummary } from '../../../core/models/tmdb.models';
import { DrumCard } from '../../../shared/drum-card/drum-card';

/**
 * One search result, built on the poster card's layout: artwork with a meta strip
 * beneath it.
 *
 * The card itself opens the details pop-up. The external-link button next to the
 * title opens the same film as a full page instead — two destinations for one
 * record, so they can't both be the card's click. Nesting a link inside a link is
 * invalid anyway, which is why the card is a button and the escape hatch is the
 * anchor rather than the other way round.
 */
@Component({
  selector: 'nv-movie-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DrumCard, RouterLink],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.scss',
})
export class MovieCard {
  private readonly tmdb = inject(TmdbService);
  protected readonly i18n = inject(I18nService);

  readonly movie = input.required<MovieSummary>();

  protected readonly poster = computed(() =>
    this.tmdb.imageUrl(this.movie().poster_path, 'w342'),
  );

  /**
   * One decimal place, and a dash when TMDB has no score.
   *
   * An unrated film reports 0, which would otherwise render as a confident "0.0"
   * — a bad review rather than the absence of one.
   */
  protected readonly score = computed(() => {
    const value = this.movie().vote_average;
    if (!value) return null;
    return value.toFixed(1);
  });

  protected readonly year = computed(() => {
    const date = this.movie().release_date;
    return date ? date.slice(0, 4) : null;
  });

  /** Named-outlet link, so the pop-up is a URL rather than component state. */
  protected readonly modalLink = computed(() => [
    { outlets: { modal: ['movie', this.movie().id] } },
  ]);
}
