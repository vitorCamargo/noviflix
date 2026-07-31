import type { Dictionary } from './en';

export const ptBR: Dictionary = {
  'app.name': 'Noviflix',
  'app.tagline': 'Descubra como você assiste.',

  'nav.home': 'Início',
  'nav.collections': 'Coleções',
  'nav.language': 'Idioma',

  'page.home.title': 'Início',
  'page.home.body': 'A busca e os filmes em destaque entram aqui.',
  'page.home.demoModal': 'Abrir o pop-up de detalhes',

  'home.headlineLead': 'Descubra como',
  'home.headlineTailBefore': 'você',
  'home.headlineAccent': 'assiste.',
  'home.subhead': 'Veja o que está em cartaz e monte suas próprias coleções.',
  'search.placeholder': 'Busque um filme',
  'search.label': 'Busque um filme',
  'search.searching': 'Buscando',
  'search.clear': 'Limpar busca',
  'search.error.tooShort': 'Digite ao menos {min} caracteres para buscar.',
  'search.error.charset': 'Use apenas letras e números.',

  'search.resultCount': '{count} resultados para “{query}”',
  'search.retry': 'Tentar de novo',
  'movie.loading': 'Carregando detalhes',
  'movie.failedTitle': 'Não foi possível carregar este filme',
  'movie.failedBody':
    'A requisição não foi concluída, ou não existe filme com esse id. Voltar e abrir de novo costuma resolver.',
  'movie.sections': 'Seções do filme',
  'movie.tab.facts': 'Detalhes do filme',
  'movie.tab.cast': 'Elenco',
  'movie.tab.related': 'Relacionados',
  'movie.noCast': 'Nenhum elenco foi listado para este filme.',
  'movie.noRelated': 'Nenhum filme relacionado foi sugerido para este.',

  'movie.overview': 'Sinopse',
  'movie.noOverview': 'Ainda não há sinopse escrita neste idioma.',
  'movie.facts': 'Detalhes',
  'movie.budget': 'Orçamento',
  'movie.revenue': 'Receita',
  'movie.runtime': 'Duração',
  'movie.languages': 'Idiomas falados',
  'movie.releaseDate': 'Data de estreia',
  'movie.voteCountLabel': 'Total de votos',
  'movie.voteCount': 'de {count} votos',

  // Avaliação
  'movie.rate': 'Avaliar',
  'movie.addToCollection': 'Adicionar à coleção',
  'movie.rateHeading': 'Avalie este filme',
  'movie.rateHint': 'Escolha uma nota para {title}. Meias estrelas contam.',
  'movie.rateThis': 'Sua nota',
  'movie.rateSubmit': 'Enviar nota',
  'movie.rateUpdate': 'Atualizar nota',
  'movie.rateSending': 'Enviando…',
  'movie.rateSent': 'Obrigado — sua nota foi registrada.',
  'movie.rateFailed': 'Não foi possível enviar. Tente de novo.',
  'movie.ratingOf': '{value} de {max}',

  'movie.voteAverage': 'Nota média',
  'movie.unrated': 'Sem nota',
  'movie.openDetails': 'Abrir detalhes de {title}',
  'search.emptyTitle': 'Nada encontrado para “{query}”',
  'search.emptyBody':
    'Confira a grafia ou tente algo mais curto — uma única palavra marcante costuma funcionar melhor que o título completo.',
  'search.failed': 'Busca indisponível',
  'search.failedTitle': 'Não foi possível acessar o banco de filmes',
  'search.failedBody':
    'A requisição não foi concluída. Sua conexão pode estar fora do ar ou o serviço pode estar ocupado — buscar de novo costuma resolver.',
  'home.featuredCast': 'Elenco em destaque',
  'trailer.play': 'Ver trailer',
  'trailer.pause': 'Parar trailer',
  'trailer.loading': 'Carregando trailer',

  'home.popularity': 'Popularidade',
  'home.tier.blazing': 'Novidade',
  'home.tier.trending': 'Em alta',
  'home.tier.acclaimed': 'Aclamado',
  'home.tier.hiddenGem': 'Joia rara',
  'home.tier.wellKnown': 'Conhecido',
  'home.tier.divisive': 'Controverso',
  'home.tier.lowkey': 'Discreto',

  'page.search.title': 'Resultados da busca',
  'page.search.body': 'Os resultados da busca atual entram aqui.',

  'page.movie.title': 'Detalhes do filme',
  'page.movie.body': 'Os detalhes completos de um filme entram aqui.',

  'page.movieModal.title': 'Detalhes do filme (pop-up)',
  'page.movieModal.body': 'Os mesmos detalhes, sobrepostos à página de trás.',

  'page.collections.title': 'Minhas coleções',
  'page.collections.body': 'Suas coleções salvas entram aqui, guardadas neste navegador.',

  'page.collectionDetails.title': 'Coleção',
  'page.collectionDetails.body': 'Os filmes de uma coleção entram aqui.',

  // Coleções
  'collections.count': '{count} filmes',
  'collections.open': 'Abrir {name}',
  'collections.new': 'Nova coleção',
  'collections.newSub': 'Junte filmes que você quer manter por perto.',
  'collections.emptyBody':
    'Nada salvo ainda. Crie uma coleção e comece a preenchê-la.',
  'collections.backToList': 'Coleções',
  'collections.createTitle': 'Nova coleção',
  'collections.createLead':
    'Dê um nome e diga o que entra nela. Os dois são obrigatórios.',
  'collections.fieldTitle': 'Título',
  'collections.fieldTitlePlaceholder': 'Noites de sábado',
  'collections.fieldDescription': 'Descrição',
  'collections.fieldDescriptionPlaceholder': 'Para que serve esta coleção.',
  'collections.createSubmit': 'Criar coleção',
  'collections.cancel': 'Cancelar',
  'collections.errorRequired': 'Campo obrigatório.',
  'collections.errorTooLong': 'Use menos de {max} caracteres.',
  'collections.missingTitle': 'Esta coleção não existe mais',
  'collections.missingBody':
    'Ela pode ter sido removida, ou o link pode ser de outro navegador — coleções ficam no dispositivo que as criou.',
  'collections.emptyDetail':
    'Nada aqui ainda. Busque filmes e adicione a partir dos resultados.',
  'collections.removeMovie': 'Remover {title} desta coleção',

  // Adicionar a uma coleção
  'collections.select': 'Selecionar {title}',
  'collections.selected': '{count} selecionados',
  'collections.addSelected': 'Adicionar à coleção',
  'collections.clearSelection': 'Limpar',
  'collections.pickerTitle': 'Adicionar a uma coleção',
  'collections.pickerLead': 'Escolha onde estes {count} filmes devem entrar.',
  'collections.pickerEmpty':
    'Nenhuma coleção ainda. Crie uma e eles vão para lá.',
  'collections.find': 'Encontrar uma coleção',
  'collections.noMatch': 'Nenhuma coleção corresponde a isso.',
  'collections.createWithFilms':
    'Dê um nome e os {count} filmes escolhidos entram direto nela.',
  'collections.generatedName': 'Coleção',
  'collections.generatedDescription': 'Começou com um filme que você gostou.',
  'collections.createdWith': '{name} criada com {count} filmes.',
  'collections.alreadyIn': '{count} já estão nela',
  'collections.addedCount': '{count} adicionados a {name}.',
  'collections.addedNone': 'Já estão em {name}.',

  'about.trigger': 'Sobre',
  'about.title': 'Sobre o app',
  'about.leadBefore': 'Noviflix é um app de descoberta de filmes feito com a ',
  'about.tmdbApi': 'API do TMDB',
  'about.leadAfter': '.',
  'about.notAffiliated': 'Não é endossado nem certificado pelo TMDB.',
  'about.author': 'Autor',
  'about.builtBy': 'Feito por {name}',
  'about.links': 'Links',
  'about.madeWith': 'Feito com Angular',
  'about.version': 'versão {version}',

  'guest.trigger': 'Sessão de visitante',
  'guest.title': 'Sessão de visitante',
  'guest.remaining': 'restantes',
  'guest.until': 'Expira às {time}',
  'guest.none': 'Nenhuma sessão ainda.',
  'guest.creating': 'Iniciando uma sessão…',
  'guest.expired': 'Esta sessão expirou.',
  'guest.extend': 'Estender sessão',
  'guest.extending': 'Estendendo…',

  'scroll.hint': 'Arraste ou role para navegar',
  'scroll.toStart': 'Voltar ao início',
  'scroll.toTop': 'Voltar ao topo',

  'common.close': 'Fechar',
  'common.openFull': 'Abrir página completa',
  'common.back': 'Voltar',
  'common.forward': 'Avançar',
  'common.share': 'Compartilhar',

  'error.notFound': 'Não encontramos essa página.',
  'error.goHome': 'Voltar ao início',
};
