import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let i18n: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    i18n = TestBed.inject(I18nService);
    i18n.setLang('en');
  });

  it('translates a known key', () => {
    expect(i18n.t('nav.collections')).toBe('Collections');
  });

  it('switches dictionary when the language changes', () => {
    i18n.setLang('pt-BR');
    expect(i18n.t('nav.collections')).toBe('Coleções');
  });

  it('interpolates parameters', () => {
    expect(i18n.t('page.home.title', { unused: 'x' })).toBe('Home');
  });

  it('maps the language onto a TMDB tag', () => {
    i18n.setLang('pt-BR');
    expect(i18n.tmdbLang()).toBe('pt-BR');
    i18n.setLang('en');
    expect(i18n.tmdbLang()).toBe('en-US');
  });

  it('persists the choice', () => {
    i18n.setLang('pt-BR');
    expect(localStorage.getItem('noviflix.lang')).toBe('pt-BR');
  });

  it('falls back to the key when nothing matches', () => {
    expect(i18n.t('does.not.exist' as never)).toBe('does.not.exist');
  });
});
