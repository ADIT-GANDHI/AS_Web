// ──────────────────────────────────────────────────────────────
// Mock data for the Song Detail page CL implementation.
// Used when the remote CMS API is down.
// ──────────────────────────────────────────────────────────────

export const MOCK_DETAIL = {
  id: 1,
  Songtitle_transliteration: 'Aarshi Nogor',
  songTitleTransliteration: 'Aarshi Nogor',
  song_title_transliteration: 'Aarshi Nogor',
  songtitletraan: 'City Of Mirrors',
  songTitle: 'City Of Mirrors',
  umbrellaTitle: 'Aarshi Nogor',
  singer_name: 'PARVATHY BAUL',
  singer: 'PARVATHY BAUL',
  poet: 'LALON FAKIR',
  year: '2009',
  song_year: '2009',
  location: 'Trivandrum',
  song_location: 'Trivandrum',
  thumbnail_url: '',
  thumbnailUrl: '',
  youtube_video_id: '', // empty so we use placeholder
  youtubeVideoId: '',
  metaDescription:
    'In this enigmatic song, Baul saint-poet Lalon evokes the dazzling Arshi Nogor — A City of Mirrors. In this city, lives a neighbour who has no hands, no feet and yet, his boundless spirit beckons us to jump into swirling waters without a boat or a boatman to carry us across. Who could this neighbour be?',
  about:
    'In this enigmatic song, Baul saint-poet Lalon evokes the dazzling Arshi Nogor — A City of Mirrors. In this city, lives a neighbour who has no hands, no feet and yet, his boundless spirit beckons us to jump into swirling waters without a boat or a boatman to carry us across. Who could this neighbour be?',
  songLyricsTranslated: `Aachhe baareer kaachhe aarshi nogor
Podoshi boshot kore
Taare dhori dhori mone kori
Dhora de na more
Ek jon podoshi boshot kore

Graam bediye agaadh paani
Taate naai toroni naai ko tori (kandari?)
O tui kemon kore paar jaabi
Bhoy dekhi ontore
Ek jon podoshi boshot kore

Kebol boshei podosheer kotha
Jaar hosto podo skondho maatha naai re
Shetho khonek thaake shunnopore
Khonek bhaashe neere
Ek jon podoshi boshot kore

Shei podoshir jodi sannyaaye chaaisto
Tobe jom jaatona doore jeto ek baare
Ae taan Shiroj Lalon ek shaadhe nai
Lokhe joyon doore
Ek jon podoshi boshot kore`,
  songnotes:
    "Here's a that gives you a lay of this land, Ajab Shahar — a wondrous city of songs, poems, images and conversations from Bhakti, Sufi & Baul oral traditions from India and around. Here's a that gives you a lay of this land, Ajab Shahar — a wondrous city of songs, poems, images and conversations from Bhakti, Sufi & Baul oral traditions from India and around.",
  metaKeyword: '',
};

export const MOCK_VERSIONS = [
  {
    id: 101,
    Songtitle_transliteration: 'Ab Thaara Laal',
    umbrellaTitleText: 'Ab Thaara Laal',
    songtitletraan: 'City Of Mirrors',
    songTitle: 'City Of Mirrors',
    singer: 'KALURAM BAMANIYA',
    poet: 'LALON FAKIR',
    thumbnailUrl: '/placeholder.svg',
    year: '2006',
    song_year: '2006',
  },
  {
    id: 102,
    Songtitle_transliteration: 'Ab Thaara Laal',
    umbrellaTitleText: 'Ab Thaara Laal',
    songtitletraan: 'City Of Mirrors',
    songTitle: 'City Of Mirrors',
    singer: 'PARVATY BAUL',
    poet: 'LALON FAKIR',
    thumbnailUrl: '/placeholder.svg',
    year: '2008',
    song_year: '2008',
  },
  {
    id: 103,
    Songtitle_transliteration: 'Ab Thaara Laal',
    umbrellaTitleText: 'Ab Thaara Laal',
    songtitletraan: 'City Of Mirrors',
    songTitle: 'City Of Mirrors',
    singer: 'Farid Ayaz',
    poet: 'LALON FAKIR',
    thumbnailUrl: '/placeholder.svg',
    year: '2011',
    song_year: '2011',
  },
  {
    id: 104,
    Songtitle_transliteration: 'Ab Thaara Laal',
    umbrellaTitleText: 'Ab Thaara Laal',
    songtitletraan: 'City Of Mirrors',
    songTitle: 'City Of Mirrors',
    singer: 'PARVATY BAUL',
    poet: 'LALON FAKIR',
    thumbnailUrl: '/placeholder.svg',
    year: '2014',
    song_year: '2014',
  },
];

// Figma 361:1512 (Related) shows three SONGS items when the SONGS tab is
// active: two "Had Anhad" entries (pink Lora title + thumbnail) and one
// "Maati Kahe Kumbhar Se…" entry rendered with a handwritten Kabir-verse
// thumbnail and a dark (non-pink) Lora title. We model that variant with two
// optional flags so the JSX can pick the right styling per item:
//   - `titleStyle: 'dark'` → render the title in var(--ajab-ink-900) instead
//     of the default var(--ajab-pink-related)
//   - `thumbStyle: 'handwritten'` → swap the thumb background image for the
//     calligraphic Kabir verse exported from Figma node 361:1517
export const MOCK_RELATED = {
  data: {
    songs: [
      {
        id: 'r1',
        Songtitle_transliteration: 'Had Anhad',
        songtitletraan: 'I Lost My Heart To Nizam’s Glance',
        about:
          'The story highlights the gulshan-e-na-afoorda (the UncreatedGarden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
        thumbnailUrl: '/placeholder.svg',
      },
      {
        id: 'r2',
        Songtitle_transliteration: 'Had Anhad',
        songtitletraan: 'I Lost My Heart To Nizam’s Glance',
        about:
          'The story highlights the gulshan-e-na-afoorda (the UncreatedGarden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
        thumbnailUrl: '/placeholder.svg',
      },
      {
        id: 'r3',
        Songtitle_transliteration: 'Maati Kahe Kumbhar Se...',
        about:
          'Thread the breath-jewels of \u2018That I am\u2019\nOn the endless string in your heart...',
        thumbnailUrl: '/placeholder.svg',
        titleStyle: 'dark',
        thumbStyle: 'handwritten',
      },
    ],
    poems: [
      {
        id: 'p1',
        title: 'Maati Kahe Kumbhar Se',
        about: 'Thread the breath-jewels of "That I am" On the endless string in your heart...',
        thumbnailUrl: '/placeholder.svg',
      },
      { id: 'p2', title: 'Poem 2', about: 'Description', thumbnailUrl: '' },
      { id: 'p3', title: 'Poem 3', about: 'Description', thumbnailUrl: '' },
    ],
    reflections: [{ id: 'rf1', title: 'Reflection 1', about: 'Description', thumbnailUrl: '' }],
    other: [{ id: 'o1', title: 'Other 1', about: 'Description', thumbnailUrl: '' }],
  },
  counts: { all: 8, songs: 3, poems: 3, reflections: 1, other: 1 },
};

// Figma 361:1570 / 361:1571 — terms render as two lines:
//   Line 1: Shoonya Emptiness   Ulat Upside Down
//   Line 2: Alakh Unseeable   Darpan Mirror   Shahar City (pink)
// Keep them in two arrays so the JSX can emit two rows explicitly instead
// of relying on inline wrap, which is content-width dependent.
export const GLOSSARY_TERMS_LINE_1 = [
  { term: 'Shoonya', meaning: 'Emptiness' },
  { term: 'Ulat', meaning: 'Upside Down' },
];

export const GLOSSARY_TERMS_LINE_2 = [
  { term: 'Alakh', meaning: 'Unseeable' },
  { term: 'Darpan', meaning: 'Mirror' },
  { term: 'Shahar', meaning: 'City' },
];

// Back-compat: flattened version used by other modules (Poems, Reflections,
// Films) that just want a single ordered list.
export const GLOSSARY_TERMS = [...GLOSSARY_TERMS_LINE_1, ...GLOSSARY_TERMS_LINE_2];
