// Mock data for the Home page CL implementation.
// Used when the staging API is unreachable.

import { withAppBasePath } from '@/lib/resolveCmsAssetUrl';

/** Shared local thumb when CMS is offline (matches legacy Hero mocks). */
const MOCK_CARD_IMAGE = withAppBasePath('/TN-About-Basavalingaiah-Hiremath.jpg');

export const MOCK_HOME_SONG = {
  id: 1,
  title: 'Main Nijaam Se Naina',
  subtitle: "I Lost My Heart To Nizam's Glance",
  singer: 'FARID AYAZ & ABU MOHAMMED',
  poet: 'AMIR KHUSRO',
  description:
    'The delicacy of locking eyes with the beloved and losing one\'s heart to him combines in this song with a delightful disregard for social convention, represented by the gossiping neighbourhood women.',
  image: MOCK_CARD_IMAGE,
};

export const MOCK_HOME_POEM = {
  id: 2,
  transliteration: `Maati kahe kumhaar se
tu kya roendat moye?
Ik din aisa aayega,
main roendungi toye.`,
  translation: `The potter tells the earth -
"Thus and thus I pound you..."`,
  poet: 'AMIR KHUSRO',
};

export const MOCK_HOME_REFLECTION = {
  id: 3,
  title: "'Shoonya' is not 'nothingness'",
  saysBy: 'KRISHNA NATH',
  description:
    "'Nothing has its own intrinsic character. Everything exists in relation to something else.' The name of this realization is 'shoonya'.",
  image: MOCK_CARD_IMAGE,
};

export const MOCK_HOME_PEOPLE = {
  id: 4,
  title: 'Maukhik Parampara',
  subtitle: 'Oral Traditions',
  introBy: 'VIPUL RIKHI',
  description:
    'While there are many kinds of oral traditions — those which transmit mythology, sacred texts and folklore — our focus here are the oral traditions of Kabir or other mystic poets — the Bhaktas, Sufis and Bauls. While there are many kinds of oral traditions...',
  image: MOCK_CARD_IMAGE,
};

export const MOCK_HOME_FILM = {
  id: 5,
  title: 'Had Anhad',
  subtitle: 'Journeys with Ram & Kabir',
  description:
    'Kabir was a 15th century mystic poet of north India who defied the boundaries between Hindu and Muslim. He had a Muslim name and upbringing, but his poetry repeatedly invokes the widely revered Hindu name for God — Ram. Who is Kabir\'s Ram?',
  filmBy: 'SHABNAM VIRMANI',
  image: MOCK_CARD_IMAGE,
  youtubeVideoId: 'vQ0XwyqYQas',
};
