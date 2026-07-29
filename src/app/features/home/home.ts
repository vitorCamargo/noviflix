import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { PagePlaceholder } from '../../shared/page-placeholder/page-placeholder';

@Component({
  selector: 'nv-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PagePlaceholder, RouterLink],
  template: `
    <nv-page-placeholder
      [kicker]="i18n.t('app.tagline')"
      [title]="i18n.t('page.home.title')"
      [body]="i18n.t('page.home.body')"
    >
      <a
        class="demo"
        [routerLink]="[{ outlets: { modal: ['movie', '550'] } }]"
        >{{ i18n.t('page.home.demoModal') }}</a
      >
    </nv-page-placeholder>
  `,
  styles: `
    .demo {
      align-self: flex-start;
      margin-block-start: var(--nv-space-4);
      padding: var(--nv-space-3) var(--nv-space-5);
      border: 1px solid var(--nv-accent-line);
      border-radius: var(--nv-radius-pill);
      background: var(--nv-accent-soft);
      color: var(--nv-accent);
      font-size: var(--nv-text-sm);
      font-weight: 600;

      &:hover {
        background: var(--nv-accent);
        color: var(--nv-accent-ink);
      }
    }
  `,
})
export class Home {
  protected readonly i18n = inject(I18nService);
}
