import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { LanguageSwitcher } from '../../shared/language-switcher/language-switcher';
import { AboutPopover } from '../about-popover/about-popover';

/**
 * One drum tall, sitting in the grid's first row and starting at its second
 * column, so the whole bar lands on the lattice like everything else.
 */
@Component({
  selector: 'nv-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LanguageSwitcher, AboutPopover],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  protected readonly i18n = inject(I18nService);
}
