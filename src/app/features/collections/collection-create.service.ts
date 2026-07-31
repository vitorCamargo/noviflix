import { Injectable, signal } from '@angular/core';
import type { UserCollection } from '../../core/models/user-collection.models';

/**
 * Whether the collection form is open, and what it is for.
 *
 * Its own service, small as it is, because several places open it — the collections page, the add
 * panel, and the page's edit control — and none of them contains the dialog.
 */
@Injectable({ providedIn: 'root' })
export class CollectionCreateService {
  readonly open = signal(false);

  /**
   * True when the dialog was opened from the add panel.
   *
   * The dialog uses it to decide whether creating should also drop the pending films in — the
   * whole point of reaching for "new collection" mid-add is that the films go there.
   */
  readonly fromPicker = signal(false);

  /**
   * The collection being edited, or null when making a new one.
   *
   * Editing reuses this form rather than getting its own: it is the same two fields, both required
   * either way, so a second form would be the same rules written twice.
   */
  readonly editing = signal<UserCollection | null>(null);

  openDialog(fromPicker = false): void {
    this.editing.set(null);
    this.fromPicker.set(fromPicker);
    this.open.set(true);
  }

  openEdit(collection: UserCollection): void {
    this.editing.set(collection);
    this.fromPicker.set(false);
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
    this.fromPicker.set(false);
    this.editing.set(null);
  }
}
