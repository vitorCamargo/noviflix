import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { I18nService } from '../../../core/i18n/i18n.service';
import { CollectionCreateService } from '../collection-create.service';
import { CollectionPickerService } from '../collection-picker.service';
import { CollectionsService } from '../collections.service';
import { DESCRIPTION_MAX, TITLE_MAX } from '../collection-store';
import {
  COLLECTION_ERROR,
  isCollectionValid,
  normaliseField,
  validateDescription,
  validateTitle,
} from '../collection-form';

/**
 * Create a collection, as a dialog rather than a page.
 *
 * Two fields do not need a route: sending someone to a page and back loses whatever they were
 * doing, which matters most in the case this exists for — reaching for a new collection halfway
 * through adding films to one.
 *
 * When opened from the add panel it also drops the pending films into the new collection. That
 * is the reason for reaching for it there, and making it a second step would be a step nobody
 * wants.
 */
@Component({
  selector: 'nv-collection-create-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './collection-create-dialog.html',
  styleUrl: './collection-create-dialog.scss',
})
export class CollectionCreateDialog {
  protected readonly i18n = inject(I18nService);
  private readonly dialog = inject(CollectionCreateService);
  private readonly picker = inject(CollectionPickerService);
  private readonly collections = inject(CollectionsService);

  protected readonly open = this.dialog.open;

  protected readonly titleMax = TITLE_MAX;
  protected readonly descriptionMax = DESCRIPTION_MAX;

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
  });

  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /** Which fields have been left or submitted, so untouched ones stay quiet. */
  private readonly shown = signal({ name: false, description: false });

  /** Films that will land in the new collection, when opened mid-add. */
  protected readonly pending = computed(() =>
    this.dialog.fromPicker() ? this.picker.pending() : [],
  );

  protected readonly nameError = computed(() =>
    this.shown().name ? this.message(validateTitle(this.value().name), TITLE_MAX) : null,
  );

  protected readonly descriptionError = computed(() =>
    this.shown().description
      ? this.message(validateDescription(this.value().description), DESCRIPTION_MAX)
      : null,
  );

  protected readonly canSubmit = computed(() =>
    isCollectionValid(this.value().name, this.value().description),
  );

  protected readonly nameLength = computed(
    () => normaliseField(this.value().name).length,
  );

  protected readonly descriptionLength = computed(
    () => normaliseField(this.value().description).length,
  );

  constructor() {
    /*
     * Reset and focused on each open.
     *
     * The dialog is never destroyed — it lives at the app root — so without this it would
     * reopen holding whatever was typed the last time, including the errors.
     */
    effect(() => {
      const isOpen = this.open();

      untracked(() => {
        if (!isOpen) return;

        this.form.reset({ name: '', description: '' });
        this.shown.set({ name: false, description: false });
        // After the view has rendered the field, which it has not at the moment the signal
        // flips.
        queueMicrotask(() => this.field()?.nativeElement.focus());
      });
    });
  }

  protected touch(field: 'name' | 'description'): void {
    this.shown.update((current) => ({ ...current, [field]: true }));
  }

  protected submit(): void {
    this.shown.set({ name: true, description: true });

    const { name, description } = this.form.getRawValue();
    if (!isCollectionValid(name, description)) return;

    const created = this.collections.create(
      normaliseField(name),
      normaliseField(description),
    );

    const films = this.pending();
    if (films.length) {
      this.collections.addTo(created.id, films);
      // Closes the panel too and drops the selection: the films have landed, and leaving them
      // marked would invite adding them again to no effect.
      this.picker.finish();
    }

    this.dialog.close();
  }

  protected close(): void {
    this.dialog.close();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.close();
  }

  private message(
    errors: ReturnType<typeof validateTitle>,
    max: number,
  ): string | null {
    if (!errors) return null;

    if (errors[COLLECTION_ERROR.required]) {
      return this.i18n.t('collections.errorRequired');
    }
    if (errors[COLLECTION_ERROR.tooLong]) {
      return this.i18n.t('collections.errorTooLong', { max });
    }
    return null;
  }
}
