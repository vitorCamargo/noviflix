import { Injectable, signal } from '@angular/core';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: number;
  message: string;
  action?: ToastAction;
}

export const TOAST_MS = 3200;

export const TOAST_ACTION_MS = 6500;

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

  act(toast: Toast): void {
    toast.action?.run();
    this.dismiss(toast.id);
  }
}
