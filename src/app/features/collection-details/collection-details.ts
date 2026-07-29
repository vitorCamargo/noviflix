import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { I18nService } from '../../core/i18n/i18n.service';
import { PagePlaceholder } from '../../shared/page-placeholder/page-placeholder';

@Component({
  selector: 'nv-collection-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PagePlaceholder],
  template: `
    <nv-page-placeholder
      [kicker]="'id = ' + id()"
      [title]="i18n.t('page.collectionDetails.title')"
      [body]="i18n.t('page.collectionDetails.body')"
    />
  `,
})
export class CollectionDetailsPage {
  protected readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);

  private readonly params = toSignal(this.route.paramMap, { initialValue: null });

  protected readonly id = computed(() => this.params()?.get('id') ?? '');
}
