import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, tap } from 'rxjs';
import { I18nService } from '../../../core/i18n/i18n.service';
import { DrumCard } from '../../../shared/drum-card/drum-card';
import { SearchStore } from '../../search/search-store';
import { SearchTermValidator } from '../../../shared/search-term/search-term.directive';
import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_ERROR,
  SEARCH_MIN_LENGTH,
  isSearchable,
  normaliseSearchTerm,
} from '../../../shared/search-term/search-term';

/**
 * The search input.
 *
 * Validation is not implemented here — it lives in `SearchTermValidator`, applied
 * as an attribute on the input. This component only decides *when* a complaint is
 * worth showing, which is a presentation question and a different one from
 * whether the value is valid.
 *
 * Searching is driven by typing rather than by a button. There is deliberately no
 * submit control: with a debounce there is nothing for it to do that waiting a
 * moment doesn't already do, and offering both invites the reading that the
 * button is what actually commits the search.
 */
@Component({
  selector: 'nv-search-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, SearchTermValidator, DrumCard],
  templateUrl: './search-field.html',
  styleUrl: './search-field.scss',
})
export class SearchField {
  private readonly store = inject(SearchStore);
  protected readonly i18n = inject(I18nService);

  protected readonly minLength = SEARCH_MIN_LENGTH;

  protected readonly term = new FormControl('', { nonNullable: true });

  /** Returned to after clearing, so the next term can be typed straight away. */
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  /** Mirrors the control into a signal so the template can react to it. */
  private readonly value = toSignal(this.term.valueChanges, {
    initialValue: this.term.value,
  });

  /** Drives the card's corner glow, matching the hero's. */
  protected readonly focused = signal(false);

  /** Taken from the store, so the spinner tracks the actual request. */
  protected readonly busy = computed(() => this.store.state() === 'loading');

  /**
   * Errors wait for the typing to settle, or for the field to be left.
   *
   * Validating on every keystroke would mark the field invalid at one and two
   * characters — while the user is still typing a perfectly good term — so the
   * message would be an accusation about unfinished input.
   */
  private readonly settled = signal(false);

  protected readonly errors = computed(() => {
    if (!this.settled()) return null;
    // Read the value so this recomputes as typing continues once shown.
    this.value();
    return this.term.errors;
  });

  /** Character rule first: it explains what the length message cannot. */
  protected readonly message = computed(() => {
    const errors = this.errors();
    if (!errors) return null;

    if (errors[SEARCH_ERROR.charset]) {
      return this.i18n.t('search.error.charset');
    }
    if (errors[SEARCH_ERROR.tooShort]) {
      return this.i18n.t('search.error.tooShort', { min: this.minLength });
    }
    return null;
  });

  constructor() {
    this.term.valueChanges
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        map(normaliseSearchTerm),
        // Collapses no-op edits — adding a trailing space, or retyping the same
        // word — so they don't each cost a request.
        distinctUntilChanged(),
        tap((term) => this.settled.set(term.length > 0)),
        takeUntilDestroyed(),
      )
      .subscribe((term) => {
        /*
         * Empty is an instruction, not a no-op: it tells the store to stop, which
         * is what brings the page's own content back. A non-empty invalid term
         * does nothing at all — it neither searches nor discards what is already
         * on screen, since half-typed input shouldn't clear the page.
         */
        if (!term || isSearchable(term)) this.store.search(term);
      });
  }

  protected onBlur(): void {
    this.focused.set(false);
    // Nothing to complain about if they never typed anything.
    if (normaliseSearchTerm(this.value())) this.settled.set(true);
  }

  /** Whether there is anything to clear, ignoring whitespace. */
  protected readonly hasValue = computed(
    () => normaliseSearchTerm(this.value()).length > 0,
  );

  protected clear(): void {
    this.term.setValue('');
    this.settled.set(false);

    /*
     * Cleared immediately rather than waiting for the debounce to deliver the
     * empty term. Pressing clear is an explicit instruction, and half a second of
     * stale results after it would look like the button had failed. The debounced
     * empty value still arrives and is a no-op by then.
     */
    this.store.clear();
    this.field()?.nativeElement.focus();
  }
}
