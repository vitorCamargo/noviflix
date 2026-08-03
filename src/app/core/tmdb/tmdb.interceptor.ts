import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { I18nService } from '../i18n/i18n.service';

export const tmdbInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.tmdb.baseUrl)) return next(req);

  const i18n = inject(I18nService);

  const params = req.params.has('language')
    ? req.params
    : req.params.set('language', i18n.tmdbLang());

  return next(req.clone({ params }));
};
