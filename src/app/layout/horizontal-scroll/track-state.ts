import { Injectable, signal } from '@angular/core';

/**
 * Shared state about the content track.
 *
 * The directive owns the element and knows whether it overflows; the hint and the
 * return-to-start control sit elsewhere in the tree and need to know. A tiny
 * service beats threading inputs through the shell, and keeps those components
 * free of DOM measurement.
 */
@Injectable({ providedIn: 'root' })
export class TrackState {
  /** True when there is more track than viewport, so navigation is possible. */
  readonly overflowing = signal(false);

  /** How far the track has been scrolled from its start, in pixels. */
  readonly offset = signal(0);

  /**
   * Set by the directive, called by anything that wants the track back at zero.
   *
   * A registered callback rather than exposing the element: the easing already
   * lives in the directive, and handing the node out would mean a second place
   * animating the same scroll position — the two would fight mid-gesture.
   */
  private returnHandler: (() => void) | null = null;

  register(handler: () => void): void {
    this.returnHandler = handler;
  }

  /** Clears only if still the current handler, so a late teardown can't unset a
      newer track's callback. */
  unregister(handler: () => void): void {
    if (this.returnHandler === handler) this.returnHandler = null;
  }

  /** Eases the track back to its start. A no-op when no track is mounted. */
  returnToStart(): void {
    this.returnHandler?.();
  }
}
