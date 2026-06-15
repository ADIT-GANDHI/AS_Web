// Mock data for Reflections CL implementation.

export const REFLECTIONS_INTRO =
  "Through mediums as diverse as interviews, essays, audio and visual stories, 'reflections' ponder on the key ideas, figures and motifs found in mystic poems, and reflect on their relevance for our inner and outer worlds.";

export type MediaType = 'INTERVIEW' | 'VISUAL STORY' | 'ESSAY' | 'AUDIO STORY';

export interface ReflectionCard {
  id: string;
  title: string;
  saysBy: string;
  description: string;
  mediaType: MediaType;
  thumbnailUrl?: string;
  /** Glossary word ids from CMS `related_keywords` (comma-separated). */
  relatedKeywordIds?: string[];
}

export const MOCK_REFLECTIONS: ReflectionCard[] = [
  {
    id: 'r1',
    title: "'Shoonya' is not 'nothingness'",
    saysBy: 'KRISHNA NATH',
    description:
      "'Nothing has its own intrinsic character. Everything exists in relation to something else. The name of this realization is'shoonya'.'' - Krishna Nath",
    mediaType: 'INTERVIEW',
    thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
  },
  {
    id: 'r2',
    title: 'Baul has Buddhist roots',
    saysBy: 'PARVATHY BAUL',
    description:
      "'What my gurus have taught me is that don't get stuck with one idea. Search. So I feel the need of bringing these Baul poems of Buddhist monks of that time back to our repertoire.'",
    mediaType: 'VISUAL STORY',
    thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
  },
  {
    id: 'r3',
    title: 'Both social activits and religious leaders misuse Kabir',
    saysBy: 'KAPILTIWARI',
    description:
      "'Those who use Kabir for the sake of social movements, it is surprising that Kabir's spirituality and mystical experience finds no favour with them.'",
    mediaType: 'ESSAY',
    thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
  },
  {
    id: 'r4',
    title: 'Baul has Buddhist roots',
    saysBy: 'PARVATHY BAUL',
    description:
      "'What my gurus have taught me is that don't get stuck with one idea. Search. So I feel the need of bringing these Baul poems of Buddhist monks of that time back to our repertoire.'",
    mediaType: 'INTERVIEW',
    thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
  },
  {
    id: 'r5',
    title: "'Shoonya' is not 'nothingness'",
    saysBy: 'KRISHNA NATH',
    description:
      "'Nothing has its own intrinsic character. Everything exists in relation to something else. The name of this realization is'shoonya'' - Krishna Nath",
    mediaType: 'AUDIO STORY',
    thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
  },
  {
    id: 'r6',
    title: 'Both social activits and religious leaders misuse Kabir',
    saysBy: 'KAPILTIWARI',
    description:
      "'Those who use Kabir for the sake of social movements, it is surprising that Kabir's spirituality and mystical experience finds no favour with them.'",
    mediaType: 'INTERVIEW',
    thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
  },
];

export const MOCK_REFLECTION_DETAIL = {
  id: 'r1',
  title: "'Shoonya' is not 'nothingness'",
  saysBy: 'KRISHNA NATH',
  location: 'Bengaluru',
  year: '2012',
  videoId: '',
  description:
    "'Nothing has its own intrinsic character. Everything exists in relation to something else. The name of this realization is shoonya.' Krishna Nath unpacks the Bhakti and Sufi understanding of emptiness — not as void, but as the open, relational ground from which all forms emerge. In this conversation we trace the word's roots through Kabir, Lalon and the wider mystic tradition, and the way poets have used 'shoonya' both as critique and invitation.",
};

export const REFLECTIONS_RELATED = {
  data: {
    songs: [
      {
        id: 's1',
        title: 'Had Anhad',
        subtitle: "I Lost My Heart To Nizam's Glance",
        about:
          'The story highlights the gulshan-e-na-afreeda (the Uncreated Garden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
        thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
      },
      {
        id: 's2',
        title: 'Had Anhad',
        subtitle: "I Lost My Heart To Nizam's Glance",
        about:
          'The story highlights the gulshan-e-na-afreeda (the Uncreated Garden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
        thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
      },
      {
        id: 's3',
        title: 'Maati Kahe Kumbhar Se...',
        about: "Thread the breath-jewels of 'That I am'\nOn the endless string in your heart...",
        thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
      },
    ],
    poems: [
      { id: 'p1', title: 'Poem 1', about: 'Description', thumbnailUrl: '' },
      { id: 'p2', title: 'Poem 2', about: 'Description', thumbnailUrl: '' },
      { id: 'p3', title: 'Poem 3', about: 'Description', thumbnailUrl: '' },
    ],
    reflections: [{ id: 'rf1', title: 'Reflection 1', about: 'Description', thumbnailUrl: '' }],
    other: [{ id: 'o1', title: 'Other 1', about: 'Description', thumbnailUrl: '' }],
  },
  counts: { all: 8, songs: 3, poems: 3, reflections: 1, other: 1 } as const,
};

export const REFLECTIONS_GLOSSARY = [
  { term: 'Shoonya', meaning: 'Emptiness' },
  { term: 'Ulat', meaning: 'Upside Down' },
  { term: 'Alakh', meaning: 'Unseeable' },
  { term: 'Darpan', meaning: 'Mirror' },
  { term: 'Shahar', meaning: 'City' },
];

export const TOTAL_REFLECTIONS = 90;

/** Filter panel lists — Format is hardcoded (API format field unreliable). */
export const REFLECTIONS_FORMAT_OPTIONS = [
  'Interview',
  'Visual Story',
  'Essay',
  'Audio Story',
] as const;

export const REFLECTIONS_FALLBACK_SPEAKERS = [
  'Abdullah Ismail Jat',
  'Amolak Ram',
  'Arun Goyal',
  'Krishna Nath',
  'Kapil Tiwari',
  'Parvathy Baul',
  'Vipul Rikhi',
];

export const REFLECTIONS_FALLBACK_THEMES = [
  'Devotion',
  'Death and Impermanence',
  'Love',
  'Wisdom',
  'Unity',
  'Inner Search',
  'Oral Traditions',
];
