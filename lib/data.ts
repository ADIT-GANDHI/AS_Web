export interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image?: string;
  video?: string;
  category: "songs" | "poems" | "reflections" | "people" | "films";
  author?: string;
  tags?: string[];
}

export const contentData: ContentItem[] = [
  {
    id: "1",
    title: "Main Nijaam Se Naina",
    subtitle: "I Lost My Heart To Nizam's Glance",
    description:
      "The delicacy of locking eyes with the beloved and losing one’s heart to him combines in this song with a delightful disregard for social convention, represented by the gossiping neighbourhood women...",
    video: "https://www.youtube.com/watch?v=KfcBrpqub50",
    category: "songs",
    author: "HAJI MALANG AYLA & ABID MOHAMMAD",
    tags: ["classical", "traditional"],
  },
  {
    id: "2",
    title: "Maukhik Parampara",
    subtitle: "Oral Traditions",
    description:
      "While there are many kinds of oral traditions - stories, songs, proverbs, sacred texts, genealogies, myths, legends, jokes, riddles, tongue twisters, word games, recitations, life histories, personal narratives, and epics. What there are many kinds of oral traditions.",
    category: "reflections",
    author: "RAVI VAIDYA SINGH",
    tags: ["tradition", "culture"],
  },
  {
    id: "3",
    title: "‘Shoonya’ is not  ’nothingness",
    subtitle: "tu kya roondai moye",
    description:"Nothing has its own intrinsic character. Everything exists in relation to something else. The name of this realization is‘shoonya...",
    image: "/potter-working-with-clay-traditional-art.png",
    category: "poems",
    author: "KABIR VANI VAIDYA",
    tags: ["kabir", "philosophy"],
  },
  {
    id: "4",
    title: "Maukhik Parampara",
     subtitle: "Oral Traditions",
    description:
      "While there are many kinds of oral traditions – those which transmit mythology, sacred texts and folklore – our focus here are the oral traditions of Kabir or other mystic poets – the Bhaktas, Sufis and Bauls. While there are many kinds of oral traditions.",
    image: "/meditation-spiritual-philosophy-discussion.png",
    category: "reflections",
    author: "RAJA KRISHNA NATH",
    tags: ["philosophy", "spirituality"],
  },

  {
    id: "5",
    title: "Had Anhad",
    subtitle: "Journeys with Ram & Kabir",
    description:
      "A film by SHABNAM VIRMANI. Ram is a 19th century mystic poet of north India who defied the boundaries between Hindu and Muslim. He had a Muslim name and upbringing, but Hindu name for God - Ram Who is Ram's Ram?",
    video: "https://www.youtube.com/watch?v=KfcBrpqub50",
    category: "films",
    author: "SHABNAM VIRMANI",
    tags: ["documentary", "spirituality"],
  },
];

export const navigationItems = [
  { name: "SONGS", href: "/songs" },
  { name: "POEMS", href: "/poems" },
  { name: "REFLECTIONS", href: "/reflections" },
  { name: "PEOPLE", href: "/people" },
  { name: "FILMS", href: "/films" },
];

export const footerLinks = {
  main: [
    { name: "SONGS", href: "/songs" },
    { name: "POEMS", href: "/poems" },
    { name: "REFLECTIONS", href: "/reflections" },
    { name: "PEOPLE", href: "/people" },
    { name: "FILMS", href: "/films" },
    { name: "RADIO", href: "/radio" },
    { name: "GLOSSARY", href: "/glossary" },
    { name: "AJAB NEWS", href: "/ajab-news" },
  ],
  social: [
    { name: "Youtube", href: "#" },
    { name: "Instagram", href: "#" },
  ],
};

export const searchCategories = [
  { name: "ALL RESULTS", key: "all" },
  { name: "SONGS", key: "songs" },
  { name: "POEMS", key: "poems" },
  { name: "REFLECTIONS", key: "reflections" },
  { name: "PEOPLE", key: "people" },
  { name: "FILMS", key: "films" },
];

