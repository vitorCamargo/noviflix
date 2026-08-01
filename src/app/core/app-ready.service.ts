import { Injectable, signal } from '@angular/core';

/**
 * Whether the first screen is worth showing.
 *
 * The boot screen waits on this rather than on a timer, so the introduction lasts as long as the app
 * takes to have something behind it — and no longer. Reported by whichever page owns the first
 * screen, since only that page knows what it was waiting for: the home page has a batch of films to
 * fetch, while the rest have nothing to wait on and never touch this.
 *
 * One way only. A page can say it is ready; nothing can take it back, because the screen it belongs
 * to has already gone.
 */
@Injectable({ providedIn: 'root' })
export class AppReadyService {
  private readonly settled = signal(false);

  readonly ready = this.settled.asReadonly();

  markReady(): void {
    this.settled.set(true);
  }
}
