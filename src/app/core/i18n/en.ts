export const en = {
  'app.name': 'Noviflix',
  'app.tagline': 'Discover how you watch.',

  'nav.home': 'Home',
  'nav.collections': 'Collections',
  'nav.language': 'Language',

  'page.home.title': 'Home',
  'page.home.body': 'Search and featured movies land here.',
  'page.home.demoModal': 'Open the details pop-up',

  // Headline is split so the accent word can be styled separately, and so
  // translators can reorder it — the emphasis doesn't fall last in every
  // language.
  'home.headlineLead': 'Discover how',
  'home.headlineTailBefore': 'you',
  'home.headlineAccent': 'watch.',
  'home.subhead': 'Explore what is in cinemas now and build your own collections.',
  'search.placeholder': 'Search for a movie',
  'search.label': 'Search for a movie',
  'search.searching': 'Searching',
  'search.clear': 'Clear search',
  // Says what is wrong and what to do, rather than restating the rule.
  'search.error.tooShort': 'Type at least {min} characters to search.',
  'search.error.charset': 'Use letters and numbers only.',

  'search.resultCount': '{count} results for “{query}”',
  'search.retry': 'Try again',
  'movie.voteAverage': 'Average rating',
  'movie.unrated': 'Not rated',
  'movie.openDetails': 'Open details for {title}',
  'movie.openFull': 'Open {title} on its own page',
  'search.emptyTitle': 'Nothing found for “{query}”',
  'search.emptyBody':
    'Check the spelling, or try a shorter phrase — a single distinctive word usually works better than a full title.',
  'search.failed': 'Search unavailable',
  'search.failedTitle': 'Could not reach the movie database',
  'search.failedBody':
    'The request did not go through. Your connection may be down, or the service may be busy — searching again usually resolves it.',
  'home.featuredCast': 'Featured cast',
  'trailer.play': 'Play trailer',
  'trailer.pause': 'Stop trailer',
  'trailer.loading': 'Loading trailer',

  'home.popularity': 'Popularity',
  // Newest release in the set — recency, not volume.
  'home.tier.blazing': 'Blazing hot',
  // Commands most of the batch's attention.
  'home.tier.trending': 'Trending',
  // Strong score with enough votes to trust it.
  'home.tier.acclaimed': 'Acclaimed',
  // Well liked but hasn't broken through.
  'home.tier.hiddenGem': 'Hidden gem',
  'home.tier.wellKnown': 'Well known',
  // Plenty of votes, low score — people disagree.
  'home.tier.divisive': 'Divisive',
  'home.tier.lowkey': 'Lowkey',

  'page.search.title': 'Search results',
  'page.search.body': 'Results for the current query land here.',

  'page.movie.title': 'Movie details',
  'page.movie.body': 'Full details for one movie land here.',

  'page.movieModal.title': 'Movie details (pop-up)',
  'page.movieModal.body': 'Same details, overlaid on the page behind.',

  'page.collections.title': 'My collections',
  'page.collections.body': 'Your saved collections land here, kept in this browser.',

  'page.collectionDetails.title': 'Collection',
  'page.collectionDetails.body': 'The movies inside one collection land here.',

  'about.trigger': 'About',
  'about.title': 'About the app',
  'about.leadBefore': 'Noviflix is a movie discovery app built on ',
  'about.tmdbApi': "TMDB's API",
  'about.leadAfter': '.',
  'about.notAffiliated': 'It is not endorsed or certified by TMDB.',
  'about.author': 'Author',
  'about.builtBy': 'Built by {name}',
  'about.links': 'Links',
  'about.madeWith': 'Made with Angular',
  'about.version': 'version {version}',

  'scroll.hint': 'Swipe or scroll to navigate',
  // Two labels because two axes: the desktop page travels sideways, the stacked
  // one downward, and "top" would be wrong on the first.
  'scroll.toStart': 'Back to start',
  'scroll.toTop': 'Back to top',

  'common.close': 'Close',
  'common.openFull': 'Open full page',
  'common.back': 'Back',
  'common.forward': 'Forward',
  'common.share': 'Share this',

  'error.notFound': 'We could not find that page.',
  'error.goHome': 'Back to home',
} as const;

export type TranslationKey = keyof typeof en;
export type Dictionary = Record<TranslationKey, string>;
