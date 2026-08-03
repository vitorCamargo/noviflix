import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'Noviflix',
  },
  {
    path: 'movie/:id',
    loadComponent: () =>
      import('./features/movie-details/movie-details-page').then((m) => m.MovieDetailsPage),
  },
  {
    path: 'collections',
    loadComponent: () => import('./features/collections/collections').then((m) => m.Collections),
    title: 'Noviflix · Collections',
  },
  {
    path: 'movie/:id',
    outlet: 'modal',
    loadComponent: () =>
      import('./features/movie-details/movie-details-modal').then((m) => m.MovieDetailsModal),
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
