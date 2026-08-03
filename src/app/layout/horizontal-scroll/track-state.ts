import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TrackState {
  readonly overflowing = signal(false);

  readonly offset = signal(0);

  private returnHandler: (() => void) | null = null;

  register(handler: () => void): void {
    this.returnHandler = handler;
  }

  unregister(handler: () => void): void {
    if (this.returnHandler === handler) this.returnHandler = null;
  }

  returnToStart(): void {
    this.returnHandler?.();
  }
}
