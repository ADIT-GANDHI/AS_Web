export interface Person {
  id: number;
  name: string;
  hindiName: string;
  primaryOccupation: string;
  display: boolean;
  publish: boolean;
}
export interface Link {
  rel: string;
  url: string;
}
export interface Word {
  id: number;
  wordOriginal: string;
  wordTranslation: string;
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
  wordTransliteration: string;
  hindiIntroExcerpt: string;
  englishIntroExcerpt: string;
  meaning: string;
  writers: Person[];
  rootWord: boolean;
  publish: boolean;
  thumbnailUrl: string | null;
  showOnLandingPage: boolean;
}
export interface SongText {
  id: number;
  original: string;
  translation: string;
  transliteration: string;
}
export interface Category {
  id: number;
  name: string;
  categoryType: string;
}
export interface Title {
  id: number;
  originalTitle: string;
  englishTranslation: string;
  englishTransliteration: string;
  category: Category;
}
export interface Couplet {
  id: number;
  originalTitle: string;
  englishTranslation: string;
  englishTransliteration: string;
  attributedToPoet: string | null;
  poets: Person[];
  thumbnailUrl: string;
  isPublished: boolean;
}
export interface Story {
  id: number;
  mainTitle: string;
  secondTitle: string;
  verb: string;
  description: string;
  storyCategory: Category;
  storyNewCategory: Category | null;
  authors: Person[];
  isEcho: boolean;
  isStory: boolean;
  isClassRoomIdea: boolean;
  isClassRoomExperiment: boolean;
  thumbnailUrl: string;
  isPublished: boolean;
  showOnLandingPage: boolean;
}

export interface Song {
  id: number;
  isAuthoringComplete: boolean;
  showOnLandingPage: boolean;
  youtubeVideoId: string | null;
  soundCloudTrackId: string | null;
  thumbnailURL: string;
  duration: string;
  singers: Person[];
  poets: Person[];
  links: Link[];
  words: Word[];
  songText: SongText;
  downloadURL: string;
  about: string;
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  umbrellaTitle: Title;
  songTitle: Title;
  gathering: null; // Can be a separate interface if used
  songCategory: Category;
  mediaCategory: Category;
  songGenre: Category[]; // Assuming same structure
  reflections: any[]; // Define if structure known
  couplets: Couplet[];
  films: any[]; // Define if structure known
  episodes: any[]; // Define if structure known
  people: Person[];
  stories: Story[];
  echos: any[]; // Define if structure known
  contributes: any[]; // Define if structure known
  relatedSongs: any[]; // Define if structure known
}
