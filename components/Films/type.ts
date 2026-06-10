import { Couplet, Person, Story, Word } from '../Home/SongCard/types';
import { Reflection } from '../Reflections/types';

export interface FilmSong {
  id: number;
  englishTranslationTitle: string;
  englishTransliterationTitle: string;
  singers: Person[];
  poet: Person[]; // "poet" is a list here
  duration: string;
  category: string;
  thumbnailUrl: string;
  publish: boolean;
  contentFormat: string;
  showOnLandingPage: boolean;
}

export interface FilmSummary {
  id: number;
  originalTitle: string | null;
  englishTranslation: string;
  englishTransliteration: string;
  directors: Person[];
  publish: boolean;
  duration: string;
  description: string;
  thumbnailUrl: string;
  showOnLandingPage: boolean;
}

export interface FilmEpisode {
  id: number;
  originalTitle: string | null;
  englishTranslation: string | null;
  englishTransliteration: string;
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  episodeNumber: number;
  duration: string;
  directors: Person[];
  description: string;
  aboutText: string;
  thumbnailUrl: string;
  youtubeVideoId: string;
  words: Word[];
  songs: FilmSong[];
  people: Person[];
  reflections: Reflection[];
  film: FilmSummary;
  couplets: Couplet[];
  stories: Story[];
  contributes: any[];
  showOnLandingPage: boolean;
  isPublished: boolean;
}

export interface Film {
  id: number;
  originalTitle: string | null;
  englishTranslation: string;
  englishTransliteration: string;
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  duration: string;
  yearOfProduction: string;
  description: string;
  profileText: string;
  aboutText: string;
  thumbnailUrl: string;
  youtubeVideoId: string;
  directors: Person[];
  producers: Person[];
  primaryWords: Word[];
  secondaryWords: Word[] | null;
  primarySongs: FilmSong[];
  secondarySongs: FilmSong[];
  primaryPeople: Person[];
  secondaryPeople: Person[] | null;
  primaryReflections: Reflection[];
  secondaryReflections: Reflection[] | null;
  relatedCouplets: Couplet[];
  stories: Story[];
  contributes: any[]; // Define if structure is known
  filmEpisodes: FilmEpisode[];
  showOnLandingPage: boolean;
  isPublished: boolean;
}
