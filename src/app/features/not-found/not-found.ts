import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'nv-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="nf">
      <p class="nf__code">404</p>
      <h1 class="nf__title">{{ i18n.t('error.notFound') }}</h1>
      <a class="nf__link" routerLink="/">{{ i18n.t('error.goHome') }}</a>
    </div>
  `,
  styles: `
    @use '../../../styles/mixins' as *;

    .nf {
      @include container;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--nv-space-3);
      min-block-size: 60dvh;
      text-align: center;
    }

    .nf__code {
      margin: 0;
      font-size: var(--nv-text-4xl);
      font-weight: 900;
      color: var(--nv-accent);
      text-shadow: 0 0 44px var(--nv-accent-glow);
    }

    .nf__title {
      font-size: var(--nv-text-xl);
      font-weight: 600;
      color: var(--nv-text-muted);
    }

    .nf__link {
      margin-block-start: var(--nv-space-3);
      padding: var(--nv-space-3) var(--nv-space-5);
      border-radius: var(--nv-radius-pill);
      background: var(--nv-accent);
      color: var(--nv-accent-ink);
      font-size: var(--nv-text-sm);
      font-weight: 700;
    }
  `,
})
export class NotFound {
  protected readonly i18n = inject(I18nService);
}
