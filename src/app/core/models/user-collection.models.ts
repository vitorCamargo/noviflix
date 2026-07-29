export interface SavedMovie {
  id: number;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  addedAt: string;
}

export interface UserCollection {
  id: string;
  name: string;
  description: string;
  items: SavedMovie[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionStore {
  version: 1;
  collections: UserCollection[];
}

export const COLLECTION_STORAGE_KEY = 'noviflix.collections';
