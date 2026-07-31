export interface Paginated<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface MovieSummary {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  popularity?: number;
  adult?: boolean;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface CollectionRef {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface SpokenLanguage {
  iso_639_1: string;
  /** Localised name, present only when the request carried a language. */
  name: string;
  english_name?: string;
}

export interface MovieDetails extends MovieSummary {
  runtime: number | null;
  status: string;
  tagline: string | null;
  budget: number;
  revenue: number;
  spoken_languages: SpokenLanguage[];
  homepage: string | null;
  imdb_id: string | null;
  genres: Genre[];
  production_companies: ProductionCompany[];
  belongs_to_collection: CollectionRef | null;
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: Video[] };
  recommendations?: Paginated<MovieSummary>;
  similar?: Paginated<MovieSummary>;
}

export interface CollectionSummary {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface CollectionDetails extends CollectionSummary {
  parts: MovieSummary[];
}

export type LoadState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Guest session, which is what lets an anonymous visitor rate a film.
 *
 * `expires_at` is a UTC string without a timezone marker, so it has to be parsed
 * deliberately rather than handed to `new Date()` and hoped for.
 */
export interface GuestSession {
  success: boolean;
  guest_session_id: string;
  expires_at: string;
}

export interface RatingResponse {
  success: boolean;
  status_code: number;
  status_message: string;
}
