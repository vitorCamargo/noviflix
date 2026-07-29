import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { I18nService } from '../../core/i18n/i18n.service';
import { PagePlaceholder } from '../../shared/page-placeholder/page-placeholder';

@Component({
  selector: 'nv-search-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PagePlaceholder],
  template: `
    <nv-page-placeholder
      [kicker]="query() ? 'q = ' + query() : ''"
      [title]="i18n.t('page.search.title')"
      [body]="i18n.t('page.search.body')"
    />
  `,
})
export class SearchResults {
  protected readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: null,
  });

  protected readonly query = computed(() => this.queryParams()?.get('q') ?? '');
}
