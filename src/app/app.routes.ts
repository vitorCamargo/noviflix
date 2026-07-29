import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'Noviflix',
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/search/search-results').then((m) => m.SearchResults),
    title: 'Noviflix · Search',
  },
  {
    path: 'movie/:id',
    loadComponent: () =>
      import('./features/movie-details/movie-details-page').then(
        (m) => m.MovieDetailsPage,
      ),
  },
  {
    path: 'collections',
    loadComponent: () =>
      import('./features/collections/collections').then((m) => m.Collections),
    title: 'Noviflix · Collections',
  },
  {
    path: 'collections/:id',
    loadComponent: () =>
      import('./features/collection-details/collection-details').then(
        (m) => m.CollectionDetailsPage,
      ),
  },
  {
    path: 'movie/:id',
    outlet: 'modal',
    loadComponent: () =>
      import('./features/movie-details/movie-details-modal').then(
        (m) => m.MovieDetailsModal,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
