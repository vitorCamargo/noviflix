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

  protected readonly term = new FormControl(this.store.query(), {
    nonNullable: true,
  });

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  private readonly value = toSignal(this.term.valueChanges, {
    initialValue: this.term.value,
  });

  protected readonly focused = signal(false);

  protected readonly busy = computed(() => this.store.state() === 'loading');

  private readonly settled = signal(false);

  protected readonly errors = computed(() => {
    if (!this.settled()) return null;
    this.value();
    return this.term.errors;
  });

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
        distinctUntilChanged(),
        tap((term) => this.settled.set(term.length > 0)),
        takeUntilDestroyed(),
      )
      .subscribe((term) => {
        if (!term || isSearchable(term)) this.store.search(term);
      });
  }

  protected onBlur(): void {
    this.focused.set(false);
    if (normaliseSearchTerm(this.value())) this.settled.set(true);
  }

  protected readonly hasValue = computed(() => normaliseSearchTerm(this.value()).length > 0);

  protected clear(): void {
    this.term.setValue('');
    this.settled.set(false);

    this.store.clear();
    this.field()?.nativeElement.focus();
  }
}
