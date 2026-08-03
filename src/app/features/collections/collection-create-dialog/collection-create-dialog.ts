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

  protected readonly isEditing = computed(() => this.dialog.editing() !== null);

  protected readonly heading = computed(() =>
    this.i18n.t(this.isEditing() ? 'collections.editTitle' : 'collections.createTitle'),
  );

  protected readonly submitLabel = computed(() =>
    this.i18n.t(this.isEditing() ? 'collections.editSubmit' : 'collections.createSubmit'),
  );

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

  private readonly shown = signal({ name: false, description: false });

  protected readonly pending = computed(() =>
    this.dialog.fromPicker() ? this.picker.pending() : [],
  );

  private readonly changed = computed(() => {
    const editing = this.dialog.editing();
    if (!editing) return true;

    return (
      normaliseField(this.value().name) !== editing.name ||
      normaliseField(this.value().description) !== editing.description
    );
  });

  protected readonly nameError = computed(() =>
    this.shown().name ? this.message(validateTitle(this.value().name), TITLE_MAX) : null,
  );

  protected readonly descriptionError = computed(() =>
    this.shown().description
      ? this.message(validateDescription(this.value().description), DESCRIPTION_MAX)
      : null,
  );

  protected readonly canSubmit = computed(
    () => isCollectionValid(this.value().name, this.value().description) && this.changed(),
  );

  protected readonly nameLength = computed(() => normaliseField(this.value().name).length);

  protected readonly descriptionLength = computed(
    () => normaliseField(this.value().description).length,
  );

  constructor() {
    effect(() => {
      const isOpen = this.open();

      untracked(() => {
        if (!isOpen) return;

        const editing = this.dialog.editing();

        this.form.reset({
          name: editing?.name ?? '',
          description: editing?.description ?? '',
        });
        this.shown.set({ name: false, description: false });
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

    const editing = this.dialog.editing();
    if (editing) {
      this.collections.rename(editing.id, normaliseField(name), normaliseField(description));
      this.dialog.close();
      return;
    }

    const created = this.collections.create(normaliseField(name), normaliseField(description));

    const films = this.pending();
    if (films.length) {
      this.collections.addTo(created.id, films);
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

  private message(errors: ReturnType<typeof validateTitle>, max: number): string | null {
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
