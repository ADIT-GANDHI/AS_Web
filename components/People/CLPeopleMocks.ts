// Mock data for People CL implementation.

export const PEOPLE_INTRO =
  "Find here all such people whose life, art and practice has somehow been touched by mystic poetry, a motley crew of poets and singers, known and unknown, scholars and intellectuals, lettered and unlettered, artists, activists and more.";

export interface PersonCard {
  id: string;
  name: string;
  role: string;
  description: string;
  thumbnailUrl?: string;
}

export const MOCK_PEOPLE: PersonCard[] = [
  {
    id: 'p1',
    name: 'Abdul Hussain Abdullah Turk',
    role: 'SUFI SINGER, THINKER, FOLKLORIST',
    description:
      "Abdul Hussain AbdullahTurk (1950-2015), or 'Bawa Bha' as he was fondly called in Kutch, Gujarat, was a man whose heart was steeped in the poetry of the famous 17th century Sufi poet Shah Abdul Latif Bhitai and the sounds of the Kutchi Sindhi raag. He not only understood the nuances of poetry and music of the Sindh and music of was a man whose heart was steeped in the history of...",
    thumbnailUrl: '/people/abdul-hussain-abdullah-turk.jpg',
  },
  {
    id: 'p2',
    name: 'Abdullah Ismail Jat',
    role: 'FOLK SINGER',
    description:
      'Abdullah Ismail Jat is a member of the herding community of village JatVandh, Bhuj in the Kutch district of Gujarat. He is a passionate singer of the kalaams of Sindhi Sufi poet Shah Abdul Latif Bhitai and a visible presence in the oral traditions of Shah Latif in Kutch.',
    thumbnailUrl: '/people/abdullah-ismail-jat.jpg',
  },
  {
    id: 'p3',
    name: 'Akho Das',
    role: 'BHAKTI POET',
    description:
      'Akho Das (1591–1656), also known as Akha Bhagat was a 16th century bhakti poet from Gujarat. According to the tales people tell about Akho, he became an ascetic at a young age. He was working at the Royal Mint in Ahmedabad and got falsely accused of a fraud. Disillusioned with the material world and holding contempt for its pettiness, Akho left on a solitary spiritual journey which took him to Gokul.',
    thumbnailUrl: '/people/akho-das.jpg',
  },
  {
    id: 'p4',
    name: 'Amalak Ram',
    role: 'KABIR SINGER',
    description:
      'Amalak Ram is a passionate singer of Kabir bhajans from Rajasthan. His earthy voice and contemplative renditions have brought audiences across India closer to the spirit of the mystic poet.',
    thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
  },
  {
    id: 'p5',
    name: 'Arun Goyal',
    role: 'SCHOLAR, TRANSLATOR',
    description:
      'Arun Goyal is a noted scholar and translator who has worked extensively on Sufi and Bhakti poetry, bringing many obscure mystic poets into mainstream awareness through his accessible translations and commentary.',
    thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
  },
];

export const MOCK_PERSON_DETAIL = {
  id: 'p1',
  name: 'Abdul Hussain Abdullah Turk',
  role: 'SUFI SINGER, THINKER, FOLKLORIST',
  thumbnailUrl: '/people/abdul-hussain-abdullah-turk.jpg',
  gallery: [
    '/people/abdul-hussain-abdullah-turk.jpg',
    '/people/abdul-detail-2.jpg',
    '/people/abdul-hussain-abdullah-turk.jpg',
  ],
  about:
    "Abdul Hussain Abdullah Turk (1950-2015), or 'Bawa Bha' as he was fondly called in Kutch, Gujarat, was a man whose heart was steeped in the poetry of the famous 17th century Sufi poet Shah Abdul Latif Bhitai and the sounds of the Kutchi Sindhi raag. He not only understood the nuances of poetry and music of the Sindh region intimately, but also shared both his audiences in a manner infused with the message of peace, oneness and humanity.\n\n'Bawa Bha' was born on 7th September, 1950, in a family of 10 siblings in a small village called Dhrolo near Mundra in Kutch, where he had Shah Abdul Latif Bhitai and the sounds of the Kutchi Sindhi raag. He recently celebrated the success of poetic and music of the Sindh region intimately, but also shared both his audiences in a manner infused with the message of peace, oneness and humanity.",
  galleryCaption: '7th September, 1950, in a family of 10 siblings in a small village called Dhrolo near Mundra in Kutch, where he had Shah Abdul Latif Bhitai. He studied formally upto 7th standard in Mundra’s',
};

export const PERSON_RELATED = {
  data: {
    songs: [
      {
        id: 's1',
        title: 'Had Anhad',
        subtitle: "I Lost My Heart To Nizam's Glance",
        about:
          'The story highlights the gulshan-e-na-afreeda (the Uncreated Garden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
        thumbnailUrl: '/people/related-had-anhad-1.jpg',
      },
      {
        id: 's2',
        title: 'Had Anhad',
        subtitle: "I Lost My Heart To Nizam's Glance",
        about:
          'The story highlights the gulshan-e-na-afreeda (the Uncreated Garden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
        thumbnailUrl: '/people/related-had-anhad-2.jpg',
      },
      {
        id: 's3',
        title: 'Maati Kahe Kumbhar Se...',
        about: 'Thread the breath-jewels of "That I am"\nOn the endless string in your heart...',
        thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
      },
    ],
    poems: [],
    films: [],
  },
  counts: { all: 3, songs: 3, poems: 0, films: 0 },
};

export const TOTAL_PEOPLE = 183;
