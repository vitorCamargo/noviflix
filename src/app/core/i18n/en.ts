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
  'home.searchSlot': 'Search goes here',
  'home.featuredCast': 'Featured cast',
  'home.popularity': 'Popularity',
  'home.votes': '{count} votes',
  'home.tier.blazing': 'Blazing hot',
  'home.tier.lowkey': 'Lowkey',
  'home.tier.wellKnown': 'Well Known',
  'home.tier.trending': 'Trending',

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
  'about.privacy': 'Privacy',
  'about.privacyBody':
    'Noviflix has no account and no server. Your collections and language choice stay in this browser, and nothing you do here is sent anywhere except to TMDB to look up movies.',
  'about.author': 'Author',
  'about.builtBy': 'Built by {name}',
  'about.resources': 'Resources',
  'about.exploreCode': 'Explore codebase',
  'about.designNotes': 'Design notes',
  'about.openLink': 'Open',
  'about.comingSoon': 'Coming soon',
  'about.madeWith': 'Made with Angular',
  'about.version': 'version {version}',

  'scroll.hint': 'Swipe or scroll to navigate',

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
