import { Injectable, signal } from '@angular/core';

/**
 * Whether the create dialog is open.
 *
 * Its own service, small as it is, because three places open it — the collections page, the
 * add panel, and an empty collection's own page — and none of them contains the dialog.
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

  openDialog(fromPicker = false): void {
    this.fromPicker.set(fromPicker);
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
    this.fromPicker.set(false);
  }
}
