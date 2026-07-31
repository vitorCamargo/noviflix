import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TmdbService } from '../../../core/tmdb/tmdb.service';
import type { MovieSummary } from '../../../core/models/tmdb.models';
import { DrumCard } from '../../../shared/drum-card/drum-card';
import { CollectionPickerService } from '../../collections/collection-picker.service';

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
  imports: [DrumCard],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.scss',
})
export class MovieCard {
  private readonly tmdb = inject(TmdbService);
  private readonly picker = inject(CollectionPickerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);

  readonly movie = input.required<MovieSummary>();

  /**
   * Selection for adding to a collection.
   *
   * Read straight from the picker rather than passed down: every card in the grid would
   * otherwise need the selected set threaded through it, and the grid would need to know
   * about collections at all.
   */
  protected readonly selected = computed(() => this.picker.isSelected(this.movie().id));

  /**
   * Takes a plain Event, because it serves both a click and a keypress.
   *
   * Either way the default has to be stopped: the control sits inside the card's link, so a
   * click would navigate and Space would scroll the page.
   */
  protected toggleSelect(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.picker.toggle(this.movie());
  }


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

  /**
   * URL that puts this film in the pop-up, resolved from the root.
   *
   * The root matters. This card also renders *inside* the pop-up, in a film's related strip, and
   * there a relative command is applied to the modal outlet itself — producing
   * `(modal:movie/1/(modal:movie/2))`, a URL the router matches nothing against, so clicking the
   * link appeared to do nothing at all. Anchoring to the root replaces the modal segment instead of
   * nesting inside it.
   */
  private readonly modalTree = computed(() =>
    this.router.createUrlTree([{ outlets: { modal: ['movie', this.movie().id] } }], {
      relativeTo: this.route.root,
    }),
  );

  /** Kept as an href so middle-click and open-in-new-tab still behave. */
  protected readonly modalHref = computed(() =>
    this.router.serializeUrl(this.modalTree()),
  );

  /**
   * Navigates in code rather than through routerLink.
   *
   * Same reason as the URL above: routerLink resolves against the route it lives in, which is the
   * wrong one whenever this card is inside the pop-up.
   */
  protected openDetails(event: MouseEvent): void {
    event.stopPropagation();

    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;

    event.preventDefault();
    void this.router.navigateByUrl(this.modalTree());
  }
}
