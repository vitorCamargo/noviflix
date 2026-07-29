import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { APP_INFO } from '../../core/app-info';
import { I18nService } from '../../core/i18n/i18n.service';
import { Popover } from '../../shared/popover/popover';

@Component({
  selector: 'nv-about-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Popover],
  templateUrl: './about-popover.html',
  styleUrl: './about-popover.scss',
})
export class AboutPopover {
  protected readonly i18n = inject(I18nService);
  protected readonly info = APP_INFO;
}
