import { Injectable, computed, signal } from '@angular/core';
import { en, type TranslationKey } from './en';
import { ptBR } from './pt-BR';

export type Lang = 'en' | 'pt-BR';

export interface LangOption {
  code: Lang;
  short: string;
  label: string;
  tmdb: string;
  locale: string;
}

export const LANGUAGES: readonly LangOption[] = [
  { code: 'en', short: 'EN', label: 'English', tmdb: 'en-US', locale: 'en-US' },
  { code: 'pt-BR', short: 'PT', label: 'Português', tmdb: 'pt-BR', locale: 'pt-BR' },
] as const;

const STORAGE_KEY = 'noviflix.lang';

function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';

  const stored = window.localStorage?.getItem(STORAGE_KEY);
  if (stored && LANGUAGES.some((l) => l.code === stored)) return stored as Lang;

  const nav = window.navigator?.language?.toLowerCase() ?? 'en';
  return nav.startsWith('pt') ? 'pt-BR' : 'en';
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly dictionaries: Record<Lang, Record<string, string>> = {
    en,
    'pt-BR': ptBR,
  };

  readonly lang = signal<Lang>(detectInitialLang());

  readonly languages = LANGUAGES;

  readonly current = computed(() => LANGUAGES.find((l) => l.code === this.lang()) ?? LANGUAGES[0]);

  readonly tmdbLang = computed(() => this.current().tmdb);

  readonly locale = computed(() => this.current().locale);

  constructor() {
    this.syncDocument(this.lang());
  }

  setLang(code: Lang): void {
    if (code === this.lang()) return;
    this.lang.set(code);
    this.syncDocument(code);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(STORAGE_KEY, code);
    }
  }

  readonly t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = this.dictionaries[this.lang()];
    let value = dict[key] ?? en[key] ?? key;

    if (params) {
      for (const [token, replacement] of Object.entries(params)) {
        value = value.split(`{${token}}`).join(String(replacement));
      }
    }
    return value;
  };

  readonly formatDate = (
    value: string | null | undefined,
    options: Intl.DateTimeFormatOptions = { dateStyle: 'long' },
  ): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(this.locale(), options).format(date);
  };

  readonly formatNumber = (value: number | null | undefined): string => {
    if (value == null) return '—';
    return new Intl.NumberFormat(this.locale(), { notation: 'compact' }).format(value);
  };

  private syncDocument(code: Lang): void {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = code;
  }
}
