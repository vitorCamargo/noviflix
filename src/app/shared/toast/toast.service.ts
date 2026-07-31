import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
}

/** How long a message stays. Long enough to read a sentence, short enough not to linger. */
export const TOAST_MS = 3200;

/**
 * Brief confirmations of things that already happened.
 *
 * For outcomes with no natural place on screen — creating a collection from a menu that closes
 * straight afterwards leaves nothing to show the result, and silence reads as failure.
 *
 * Deliberately not for errors that need a decision. A message that disappears is the wrong place
 * for anything the visitor has to act on.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly items = signal<readonly Toast[]>([]);

  readonly toasts = this.items.asReadonly();

  private nextId = 1;

  show(message: string): void {
    const id = this.nextId++;
    this.items.update((current) => [...current, { id, message }]);

    setTimeout(() => this.dismiss(id), TOAST_MS);
  }

  dismiss(id: number): void {
    this.items.update((current) => current.filter((toast) => toast.id !== id));
  }
}
