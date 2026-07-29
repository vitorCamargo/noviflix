import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'nv-page-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ph">
      <p class="ph__kicker">{{ kicker() }}</p>
      <h1 class="ph__title">{{ title() }}</h1>
      <p class="ph__body">{{ body() }}</p>
      <ng-content />
    </section>
  `,
  styles: `
    @use '../../../styles/mixins' as *;

    :host {
      display: block;
      block-size: 100%;
    }

    .ph {
      @include container;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: var(--nv-space-3);
      padding-block: var(--nv-space-8);
      block-size: 100%;
    }

    .ph__kicker {
      @include kicker;
      margin: 0;
    }

    .ph__title {
      font-size: var(--nv-text-3xl);
      font-weight: 900;
    }

    .ph__body {
      margin: 0;
      max-inline-size: 60ch;
      color: var(--nv-text-muted);
    }
  `,
})
export class PagePlaceholder {
  readonly kicker = input('');
  readonly title = input.required<string>();
  readonly body = input('');
}
