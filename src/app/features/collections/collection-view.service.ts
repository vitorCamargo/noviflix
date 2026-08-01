import { Injectable, signal } from '@angular/core';

/**
 * Which collection's films are on show, if any.
 *
 * Its own service because the card that opens the pop-up and the pop-up itself sit in different
 * places: the cards are on the page, the overlay lives at the app root so that only one of it can
 * exist and nothing on the page can clip it.
 *
 * An id rather than the collection, so the overlay always reads the current version of it — a film
 * removed while it is open changes the store, and holding a copy here would show the old one.
 *
 * Not in the URL. The films are a pop-up over this page rather than a page of their own, and an
 * address for part of a page promises something that can be linked to and reloaded.
 */
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
