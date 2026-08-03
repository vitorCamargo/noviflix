import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CollectionViewService {
  readonly openId = signal<string | null>(null);

  open(id: string): void {
    this.openId.set(id);
  }

  close(): void {
    this.openId.set(null);
  }
}
