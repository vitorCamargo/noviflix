import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { I18nService, type Lang } from '../../core/i18n/i18n.service';

@Component({
  selector: 'nv-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lang">
      <button
        type="button"
        class="lang__trigger"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="i18n.t('nav.language')"
        aria-haspopup="listbox"
        (click)="toggle()"
      >
        <svg viewBox="0 0 24 24" class="lang__globe" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.6 2.6 2.6 15 0 18M12 3c-2.6 2.6-2.6 15 0 18" />
        </svg>
        <span class="lang__code">{{ i18n.current().short }}</span>
        <svg viewBox="0 0 24 24" class="lang__chevron" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      @if (open()) {
        <ul class="lang__menu" role="listbox">
          @for (option of i18n.languages; track option.code) {
            <li>
              <button
                type="button"
                role="option"
                class="lang__option"
                [class.is-active]="option.code === i18n.lang()"
                [attr.aria-selected]="option.code === i18n.lang()"
                (click)="select(option.code)"
              >
                <span class="lang__option-short">{{ option.short }}</span>
                <span>{{ option.label }}</span>
                @if (option.code === i18n.lang()) {
                  <svg viewBox="0 0 24 24" class="lang__check" aria-hidden="true">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                }
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
    }

    svg {
      inline-size: 18px;
      block-size: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .lang__trigger {
      display: inline-flex;
      align-items: center;
      gap: var(--nv-space-2);
      padding: var(--nv-space-2) var(--nv-space-3);
      border: 0;
      border-radius: var(--nv-radius-pill);
      background: transparent;
      color: var(--nv-text);
      font-size: var(--nv-text-sm);
      font-weight: 600;
      white-space: nowrap;
      transition:
        color var(--nv-dur-swipe) var(--nv-ease-panel),
        background var(--nv-dur-swipe) var(--nv-ease-panel);

      &:hover {
        color: var(--nv-text-muted);
      }

      &[aria-expanded='true'] {
        background: var(--nv-accent-soft);
        color: var(--nv-accent);
      }
    }

    .lang__code {
      letter-spacing: 0.04em;
    }

    .lang__chevron {
      inline-size: 13px;
      block-size: 13px;
      opacity: 0.7;
    }

    .lang__menu {
      position: absolute;
      inset-block-start: calc(100% + var(--nv-space-2));
      inset-inline-end: 0;
      z-index: var(--nv-z-header);
      min-inline-size: 190px;
      margin: 0;
      padding: var(--nv-space-1);
      list-style: none;
      background: var(--nv-panel);
      border-radius: var(--nv-radius);
      box-shadow: var(--nv-shadow-pop);
      --nv-mask-radius: var(--nv-radius);
      animation: nv-mask-open var(--nv-dur-mask) var(--nv-ease-panel) both;
    }

    .lang__menu li {
      animation: nv-swipe-up var(--nv-dur-swipe) var(--nv-ease-panel) var(--nv-delay-swipe) both;
    }

    .lang__option {
      display: flex;
      align-items: center;
      gap: var(--nv-space-3);
      inline-size: 100%;
      padding: var(--nv-space-2) var(--nv-space-3);
      border: 0;
      border-radius: var(--nv-radius-sm);
      background: transparent;
      color: var(--nv-text-muted);
      font-size: var(--nv-text-sm);
      text-align: start;

      &:hover {
        background: var(--nv-surface-3);
        color: var(--nv-text);
      }

      &.is-active {
        color: var(--nv-accent);
      }
    }

    .lang__option-short {
      min-inline-size: 24px;
      font-weight: 700;
      font-size: var(--nv-text-xs);
      letter-spacing: 0.06em;
      color: var(--nv-text-faint);

      .is-active & {
        color: var(--nv-accent);
      }
    }

    .lang__check {
      margin-inline-start: auto;
      inline-size: 14px;
      block-size: 14px;
    }
  `,
})
export class LanguageSwitcher {
  protected readonly i18n = inject(I18nService);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly open = signal(false);

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  protected select(code: Lang): void {
    this.i18n.setLang(code);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.open.set(false);
  }
}
