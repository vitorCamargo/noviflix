import { Injectable, signal } from '@angular/core';

/**
 * Shared state about the content track.
 *
 * The directive owns the element and knows whether it overflows; the hint sits
 * elsewhere in the tree and needs to know. A tiny service beats threading an
 * input through the shell, and keeps the hint free of DOM measurement.
 */
@Injectable({ providedIn: 'root' })
export class TrackState {
  /** True when there is more track than viewport, so navigation is possible. */
  readonly overflowing = signal(false);
}
