// Mock data for Films CL implementation.

export interface FilmEntry {
  id: string;
  title: string;
  subtitle: string;
  director: string;
  duration: string;
  year: string;
  languages: string;
  description: string;
  thumbnailUrl?: string;
}

export interface FilmSeries {
  id: string;
  title: string;
  intro: string;
  films: FilmEntry[];
}

export const MOCK_FILM_SERIES: FilmSeries[] = [
  {
    id: 's1',
    title: 'Journeys with Kabir',
    intro:
      'The Kabir Project consists of many journeys inspired by Bhakti, Sufi, and Baul poems and songs as they flow in the rural folk traditions. Spanning over two decades, our inspirations in the wisdom of these poems has taken the shape of films.',
    films: [
      {
        id: 'f1',
        title: 'Chalo Hamara Des',
        subtitle: 'Journeys With Kabir And Friends',
        director: 'SHABNAM VIRMANI',
        duration: '97:25 mins',
        year: '2009',
        languages: 'English, Hindi, Kannada',
        description:
          "A journey in search of the 'des' (country) invoked in the poetry of Kabir, a 15th century Indian mystic, this film interweaves the stories of two people from two very different countries — Indian folk singer Prahlad Tipanya and North American scholar Linda Hess. Where is Kabir's country?",
        thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
      },
      {
        id: 'f2',
        title: 'Chalo Hamara Des',
        subtitle: 'Journeys With Kabir And Friends',
        director: 'SHABNAM VIRMANI',
        duration: '97:25 mins',
        year: '2009',
        languages: 'English, Hindi, Kannada',
        description:
          "A journey in search of the 'des' (country) invoked in the poetry of Kabir, a 15th century Indian mystic, this film interweaves the stories of two people from two very different countries — Indian folk singer Prahlad Tipanya and North American scholar Linda Hess. Where is Kabir's country?",
        thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
      },
      {
        id: 'f3',
        title: 'Chalo Hamara Des',
        subtitle: 'Journeys With Kabir And Friends',
        director: 'SHABNAM VIRMANI',
        duration: '97:25 mins',
        year: '2009',
        languages: 'English, Hindi, Kannada',
        description:
          "A journey in search of the 'des' (country) invoked in the poetry of Kabir, a 15th century Indian mystic, this film interweaves the stories of two people from two very different countries — Indian folk singer Prahlad Tipanya and North American scholar Linda Hess. Where is Kabir's country?",
        thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
      },
      {
        id: 'f4',
        title: 'Chalo Hamara Des',
        subtitle: 'Journeys With Kabir And Friends',
        director: 'SHABNAM VIRMANI',
        duration: '97:25 mins',
        year: '2009',
        languages: 'English, Hindi, Kannada',
        description:
          "A journey in search of the 'des' (country) invoked in the poetry of Kabir, a 15th century Indian mystic, this film interweaves the stories of two people from two very different countries — Indian folk singer Prahlad Tipanya and North American scholar Linda Hess. Where is Kabir's country?",
        thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
      },
    ],
  },
  {
    id: 's2',
    title: 'Ajab Mulakatein',
    intro:
      'The Kabir Project consists of many journeys inspired by Bhakti, Sufi, and Baul poems and songs as they flow in the rural folk traditions. Spanning over two decades, our inspirations in the wisdom of these poems has taken the shape of...',
    films: [
      {
        id: 'f5',
        title: 'Chalo Hamara Des',
        subtitle: 'Journeys With Kabir And Friends',
        director: 'SHABNAM VIRMANI',
        duration: '97:25 mins',
        year: '2009',
        languages: 'English, Hindi, Kannada',
        description:
          "A journey in search of the 'des' (country) invoked in the poetry of Kabir, a 15th century Indian mystic, this film interweaves the stories of two people from two very different countries — Indian folk singer Prahlad Tipanya and North American scholar Linda Hess. Where is Kabir's country?",
        thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
      },
    ],
  },
];

export const MOCK_FILM_DETAIL = {
  ...MOCK_FILM_SERIES[0].films[0],
  description:
    "In this opening sequence from the film Chalo Hamara Des, we go with Prahlad ji into his home turf — the villages of Malwa, Madhya Pradesh — where he has learnt, imbibed and now re-expresses Kabir in profound and inspiring ways. Here we witness his incredible capacity to engage audiences with the poems of Kabir, opening up their innermost ego in direct, challenging and self-reflective ways.",
};

export const FILM_RELATED = {
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
        about: 'Thread the breath-jewels of "That I am"\nOn the endless string in your heart...',
        thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
      },
    ],
    poems: [],
    reflections: [],
    other: [],
  },
  counts: { all: 3, songs: 3, poems: 0, reflections: 0, other: 0 },
};

export const MOCK_FILM_EPISODES = [
  {
    id: 'ep1',
    title: 'Opening — Malwa',
    subtitle: 'Journeys with Kabir and Friends',
    duration: '12:40',
    thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
    videoId: '',
  },
  {
    id: 'ep2',
    title: 'Prahlad Tipanya',
    subtitle: 'Singing Kabir in the village',
    duration: '18:05',
    thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
    videoId: '',
  },
  {
    id: 'ep3',
    title: 'Linda Hess',
    subtitle: 'Scholar and friend',
    duration: '14:22',
    thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
    videoId: '',
  },
];

export const FILM_GLOSSARY = [
  { term: 'Shoonya', meaning: 'Emptiness' },
  { term: 'Ulat', meaning: 'Upside Down' },
  { term: 'Alakh', meaning: 'Unseeable' },
  { term: 'Darpan', meaning: 'Mirror' },
  { term: 'Shahar', meaning: 'City', highlighted: true },
];

// [Claude] updated to match live API total from Api/film_list
export const TOTAL_FILMS = 24;
