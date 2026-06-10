import { Couplet, Person, Song, Story, Word } from '../Home/SongCard/types';

interface WordIntroduction {
  id: number;
  wordIntroHindi: string;
  wordIntroEnglish: string;
}

export interface Reflection {
  thumbnailURL: string;
  id: number;
  title: string;
  speaker: {
    display: boolean;
    publish: boolean;
    id: number;
    name: string;
    hindiName: string;
    primaryOccupation: string;
  };
  published: boolean;
  excerpt: string;
  duration: string; // e.g. "01:49"
  verb: string; // e.g. "by"
  contentType: 'video' | 'audio' | 'text' | string; // you can make this stricter if needed
  showOnMainFcPage: boolean;
  isClassRoomReflection: boolean;
}

export interface IWords extends Word {
  wordIntroduction: WordIntroduction;
  reflections: Reflection[];
  relatedWords: Word[];
  songs: Song[];
  people: Person[];
  episodes: any[];
  synonyms: any[];
  stories: Story[];
  films: any[]; // Define if structure known
  echos: any[]; // Define if structure known
  contributes: any[]; // Define if structure known
  couplets: Couplet[];
  displayAjabShaharTeam: true;
  defaultReflection: null;
  diacritic: string;
  isRootWord: boolean;
}
