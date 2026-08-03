import { Injectable, signal } from '@angular/core';
import type { UserCollection } from '../../core/models/user-collection.models';

@Injectable({ providedIn: 'root' })
export class CollectionCreateService {
  readonly open = signal(false);

  readonly fromPicker = signal(false);

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
