import { Injectable, signal } from '@angular/core';

/** One thing the visitor can do about what just happened. Undo, in practice. */
export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: number;
  message: string;
  action?: ToastAction;
}

/** How long a message stays. Long enough to read a sentence, short enough not to linger. */
export const TOAST_MS = 3200;

/**
 * Longer, for a message carrying an action.
 *
 * Reading a sentence and then deciding to act on it takes more time than reading it, and this is
 * the only chance to take the decision back.
 */
export const TOAST_ACTION_MS = 6500;

/**
 * Brief confirmations of things that already happened.
 *
 * For outcomes with no natural place on screen — creating a collection from a menu that closes
 * straight afterwards leaves nothing to show the result, and silence reads as failure.
 *
 * A message may carry one action, which is how a destructive step becomes recoverable: deleting a
 * collection and offering it back reads better than a dialog asking permission for something the
 * visitor already meant to do.
 *
 * Still not the place for errors that need a decision. A message that disappears is the wrong home
 * for anything the visitor *has* to act on — an undo is optional by definition.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly items = signal<readonly Toast[]>([]);

  readonly toasts = this.items.asReadonly();

  private nextId = 1;

  show(message: string, action?: ToastAction): void {
    const id = this.nextId++;
    this.items.update((current) => [...current, { id, message, action }]);

    setTimeout(() => this.dismiss(id), action ? TOAST_ACTION_MS : TOAST_MS);
  }

  dismiss(id: number): void {
    this.items.update((current) => current.filter((toast) => toast.id !== id));
  }

  /** Takes the offer, then takes the message away: it has nothing left to offer. */
  act(toast: Toast): void {
    toast.action?.run();
    this.dismiss(toast.id);
  }
}
