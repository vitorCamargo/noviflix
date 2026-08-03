import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { LanguageSwitcher } from '../../shared/language-switcher/language-switcher';
import { AboutPopover } from '../about-popover/about-popover';
import { GuestSessionBadge } from '../guest-session-badge/guest-session-badge';

@Component({
  selector: 'nv-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LanguageSwitcher, AboutPopover, GuestSessionBadge],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  protected readonly i18n = inject(I18nService);
}
