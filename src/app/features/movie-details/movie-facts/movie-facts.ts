import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { MovieDetails } from '../../../core/models/tmdb.models';
import {
  EMPTY_FIELD,
  formatLanguages,
  formatMoney,
  formatRuntime,
  formatVoteAverage,
  formatVoteCount,
} from '../movie-format';

@Component({
  selector: 'nv-movie-facts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './movie-facts.html',
  styleUrl: './movie-facts.scss',
})
export class MovieFacts {
  protected readonly i18n = inject(I18nService);

  readonly movie = input.required<MovieDetails>();

  protected readonly empty = EMPTY_FIELD;

  protected readonly score = computed(() => formatVoteAverage(this.movie().vote_average));

  protected readonly votes = computed(() =>
    formatVoteCount(this.movie().vote_count, this.i18n.locale()),
  );

  protected readonly releaseDate = computed(() =>
    this.movie().release_date ? this.i18n.formatDate(this.movie().release_date) : null,
  );

  protected readonly budget = computed(() => formatMoney(this.movie().budget, this.i18n.locale()));

  protected readonly revenue = computed(() =>
    formatMoney(this.movie().revenue, this.i18n.locale()),
  );

  protected readonly runtime = computed(() =>
    formatRuntime(this.movie().runtime, this.i18n.locale()),
  );

  protected readonly languages = computed(() =>
    formatLanguages(this.movie().spoken_languages, this.i18n.locale()),
  );
}
