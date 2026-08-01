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

  /**
   * Whether the first screen may now animate itself in.
   *
   * Separate from `ready`, and set later: the page is built behind the first-load screen, so an
   * entrance that started when the data arrived would play out of sight and be over by the time the
   * screen cleared. The boot screen flips this as it begins to clear, and the composition assembles
   * into the space it leaves.
   *
   * One way only, again. Navigating back to a page does not replay its entrance — the introduction
   * belongs to arriving at the app, not to visiting a route.
   */
  private readonly shown = signal(false);

  readonly revealed = this.shown.asReadonly();

  markRevealed(): void {
    this.shown.set(true);
  }
}
