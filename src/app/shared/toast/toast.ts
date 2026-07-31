import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, type Toast } from './toast.service';

/**
 * The toast stack, rendered once at the app root.
 *
 * Bottom centre, above the scroll hint's corner and the selection bar, because it reports the
 * result of an action rather than offering one — it should not sit where a control was just
 * pressed.
 */
@Component({
  selector: 'nv-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toasts().length) {
      <!-- A live region, so the outcome is announced rather than only shown. Nothing here takes
           focus: the visitor is mid-task and a message is not worth interrupting it. -->
      <div class="ts" role="status" aria-live="polite">
        @for (toast of toasts(); track toast.id) {
          @if (toast.action; as action) {
            <!-- A plain box here, not a dismissible button: the offer is the point, and a
                 button inside a button is neither valid nor operable. -->
            <div class="ts__item">
              <svg class="ts__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l5 5 9-11" />
              </svg>
              <span>{{ toast.message }}</span>
              <button type="button" class="ts__action" (click)="act(toast)">
                {{ action.label }}
              </button>
            </div>
          } @else {
            <button type="button" class="ts__item" (click)="dismiss(toast.id)">
              <svg class="ts__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l5 5 9-11" />
              </svg>
              <span>{{ toast.message }}</span>
            </button>
          }
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .ts {
      position: fixed;
      inset-block-end: calc(var(--nv-space-6) + 52px);
      inset-inline-start: 50%;
      translate: -50% 0;
      z-index: calc(var(--nv-z-modal) + 4);
      display: flex;
      flex-direction: column;
      gap: var(--nv-space-2);
      align-items: center;
      pointer-events: none;
    }

    /*
     * A button, because it is dismissible — clicking a message that will not go away is a small
     * frustration, and a div would give no affordance for it.
     */
    .ts__item {
      display: flex;
      align-items: center;
      gap: var(--nv-space-3);
      max-inline-size: min(420px, calc(100vw - var(--nv-space-6) * 2));
      padding: var(--nv-space-3) var(--nv-space-5);
      border: 0;
      border-radius: var(--nv-radius-pill);
      background: var(--nv-panel);
      color: var(--nv-text);
      font-size: var(--nv-text-sm);
      font-weight: 600;
      text-align: start;
      box-shadow: var(--nv-shadow-pop);
      pointer-events: auto;
      animation: nv-rise var(--nv-fast) var(--nv-ease);
    }

    /* Set apart from the message by a rule rather than a gap, so it reads as a control and
       not as the tail of the sentence. */
    .ts__action {
      margin-inline-start: var(--nv-space-2);
      padding-inline-start: var(--nv-space-3);
      border: 0;
      border-inline-start: 1px solid var(--nv-border);
      background: none;
      color: var(--nv-accent);
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    .ts__icon {
      inline-size: 16px;
      block-size: 16px;
      flex: none;
      fill: none;
      stroke: var(--nv-accent);
      stroke-width: 2.6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    @media (max-width: 640px) {
      .ts {
        inset-block-end: var(--nv-space-6);
      }
    }
  `,
})
export class ToastStack {
  private readonly service = inject(ToastService);

  protected readonly toasts = this.service.toasts;

  protected dismiss(id: number): void {
    this.service.dismiss(id);
  }

  protected act(toast: Toast): void {
    this.service.act(toast);
  }
}
