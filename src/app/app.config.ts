import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { I18nService } from './core/i18n/i18n.service';
import { tmdbInterceptor } from './core/tmdb/tmdb.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(withFetch(), withInterceptors([tmdbInterceptor])),
    {
      provide: LOCALE_ID,
      useFactory: () => inject(I18nService).locale(),
    },
  ],
};
