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
  'movie.loading': 'Loading details',
  'movie.failedTitle': 'Could not load this film',
  'movie.failedBody':
    'The request did not go through, or no film exists with that id. Going back and opening it again usually resolves it.',
  'movie.sections': 'Movie sections',
  'movie.tab.facts': 'Movie details',
  'movie.tab.cast': 'Cast',
  'movie.tab.related': 'Related',
  'movie.noCast': 'No cast has been listed for this film.',
  'movie.noRelated': 'No related films have been suggested for this one.',

  'movie.overview': 'Overview',
  'movie.noOverview': 'No synopsis has been written in this language yet.',
  'movie.facts': 'Details',
  'movie.budget': 'Budget',
  'movie.revenue': 'Revenue',
  'movie.runtime': 'Runtime',
  'movie.languages': 'Spoken languages',
  'movie.releaseDate': 'Release date',
  'movie.voteCountLabel': 'Vote count',
  'movie.voteCount': 'from {count} votes',

  // Rating
  'movie.rate': 'Rate',
  'movie.addToCollection': 'Add to collection',
  'movie.rateHeading': 'Rate this film',
  'movie.rateHint': 'Choose a score for {title}. Half stars count.',
  'movie.rateThis': 'Your rating',
  'movie.rateSubmit': 'Submit rating',
  'movie.rateUpdate': 'Update rating',
  'movie.rateSending': 'Sending…',
  'movie.rateSent': 'Thanks — your rating was recorded.',
  'movie.rateFailed': 'That did not go through. Try again.',
  'movie.ratingOf': '{value} out of {max}',

  'movie.voteAverage': 'Average rating',
  'movie.unrated': 'Not rated',
  'movie.openDetails': 'Open details for {title}',
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

  // Collections
  'collections.count': '{count} films',
  'collections.open': 'Open {name}',
  'collections.new': 'New collection',
  'collections.newSub': 'Group films you want to keep together.',
  'collections.emptyBody': 'Nothing saved yet. Make a collection and start filling it.',
  'collections.backToList': 'Collections',
  'collections.createTitle': 'New collection',
  'collections.createLead':
    'Give it a name and say what belongs in it. Both are required.',
  'collections.fieldTitle': 'Title',
  'collections.fieldTitlePlaceholder': 'Saturday nights',
  'collections.fieldDescription': 'Description',
  'collections.fieldDescriptionPlaceholder': 'What this collection is for.',
  'collections.createSubmit': 'Create collection',
  'collections.cancel': 'Cancel',
  'collections.errorRequired': 'This is required.',
  'collections.errorTooLong': 'Keep this under {max} characters.',
  'collections.missingTitle': 'This collection is gone',
  'collections.missingBody':
    'It may have been removed, or the link may belong to a different browser — collections are kept on the device that made them.',
  'collections.emptyDetail':
    'Nothing here yet. Search for films and add them from the results.',
  'collections.removeMovie': 'Remove {title} from this collection',

  // Adding to a collection
  'collections.select': 'Select {title}',
  'collections.selected': '{count} selected',
  'collections.addSelected': 'Add to collection',
  'collections.clearSelection': 'Clear',
  'collections.pickerTitle': 'Add to a collection',
  'collections.pickerLead': 'Choose where these {count} films should go.',
  'collections.pickerEmpty': 'No collections yet. Make one and they will land there.',
  'collections.find': 'Find a collection',
  'collections.noMatch': 'No collection matches that.',
  'collections.createWithFilms':
    'Name it, and the {count} films you picked will go straight in.',
  // Quick-create has no form to ask for these, so it invents them. Numbered past what exists, so
  // several are still tellable apart in the list.
  'collections.generatedName': 'Collection',
  'collections.generatedDescription': 'Started from a film you liked.',
  'collections.createdWith': 'Created {name} with {count} films.',
  'collections.alreadyIn': '{count} already in',
  'collections.addedCount': 'Added {count} to {name}.',
  // Every chosen film was already there, so nothing changed — said plainly rather than
  // reporting a success that did nothing.
  'collections.addedNone': 'Already in {name}.',

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

  'guest.trigger': 'Guest session',
  'guest.title': 'Guest session',
  'guest.remaining': 'left',
  'guest.until': 'Expires at {time}',
  'guest.none': 'No session yet.',
  'guest.creating': 'Starting a session…',
  'guest.expired': 'This session has expired.',
  'guest.extend': 'Extend session',
  'guest.extending': 'Extending…',

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
