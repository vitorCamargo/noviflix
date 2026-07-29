import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { PagePlaceholder } from '../../shared/page-placeholder/page-placeholder';

@Component({
  selector: 'nv-collections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PagePlaceholder],
  template: `
    <nv-page-placeholder
      [title]="i18n.t('page.collections.title')"
      [body]="i18n.t('page.collections.body')"
    />
  `,
})
export class Collections {
  protected readonly i18n = inject(I18nService);
}
