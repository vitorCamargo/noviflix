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
  /*
   * One route for all of it, and none for a single collection.
   *
   * Creating is two fields, so it is a dialog — sending someone to a page and back would lose
   * whatever they were doing, which matters most in the case it exists for: reaching for a new
   * collection halfway through adding films to one.
   *
   * A collection's films are a pane on that same page rather than a page of their own, so there is
   * nothing for `collections/:id` to load: it would be an address for part of a page.
   */
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
