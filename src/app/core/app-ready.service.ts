import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppReadyService {
  private readonly settled = signal(false);

  readonly ready = this.settled.asReadonly();

  markReady(): void {
    this.settled.set(true);
  }

  private readonly shown = signal(false);

  readonly revealed = this.shown.asReadonly();

  markRevealed(): void {
    this.shown.set(true);
  }
}
