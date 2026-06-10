// Mock data for Poems CL implementation. Used when API is unreachable.

export const POEMS_INTRO =
  "The Kabir doha or couplet has been called a 'gaagar mein saagar', or 'ocean in a pot', for even though the poem is small, its import can encompass the world. Read and listen to such pithy poems here, variously termed doha, saakhi, rekhta, sher or beyt, typically sung before a song or woven into it.";

export interface PoemData {
  id: string;
  text: string;        // transliteration (couplet_transliteration)
  hindi?: string;      // devanagari (original_text)
  english?: string;    // english translation (english_translation_text)
  poet: string;        // attributed_poet
  meta_keywords?: string;
  thumbnailUrl?: string;
  noteText?: string;   // note_text
  glossary?: string;   // glossary
  audioUrl?: string;
}

export const MOCK_POEMS: PoemData[] = [
  {
    id: 'p1',
    text: 'Aa panchhi jal piyein,\nnadiye khoote na neer\nDharam kiye nahin dhan khoote,\nkeh gaya das Kabir',
    hindi: 'आ पंछी जल पीयें,\nनदिये खूटे न नीर\nधरम किए नहीं धन खूटे,\nकह गया दास कबीर',
    english:
      "Come, birds, drink water —\nthe river will not run dry.\nDoing dharma does not deplete wealth,\nso said servant Kabir.",
    poet: 'KABIR',
    noteText:
      'This couplet uses the metaphor of a bird drinking from a river that never runs dry — dharma enriches rather than depletes.',
    glossary:
      'Shoonya — not mere emptiness, but the fullness beyond form. Ulat — the upside-down language of mystic poets.',
  },
  {
    id: 'p2',
    text: "Maati kahe kumhaar se\ntu kya roendat moye?\nIk din aisa aayega,\nmain roendungi toye.",
    hindi: 'माटी कहे कुम्हार से\nतू क्या रौंदत मोये?\nइक दिन ऐसा आयेगा,\nमैं रौंदूंगी तोये।',
    english:
      "The clay says to the potter,\n\"Why do you trample me?\nA day will come\nwhen I shall trample you.\"",
    poet: 'KABIR',
  },
  {
    id: 'p3',
    text: 'Bura jo dekhan main chala,\nbura na milya koy\nJo dil khoja apna,\nmujh sa bura na koy',
    hindi: 'बुरा जो देखन मैं चला,\nबुरा न मिल्या कोय\nजो दिल खोजा अपना,\nमुझ सा बुरा न कोय',
    english:
      "When I went searching for a wicked one,\nI found none.\nWhen I searched my own heart,\nnone was wickeder than me.",
    poet: 'KABIR',
  },
];

export const POEMS_RELATED = {
  data: {
    songs: [
      {
        id: 'r1',
        title: 'Had Anhad',
        subtitle: "I Lost My Heart To Nizam's Glance",
        about:
          'The story highlights the gulshan-e-na-afoorda (the UncreatedGarden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
        thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
      },
      {
        id: 'r2',
        title: 'Had Anhad',
        subtitle: "I Lost My Heart To Nizam's Glance",
        about:
          'The story highlights the gulshan-e-na-afoorda (the UncreatedGarden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
        thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
      },
      {
        id: 'r3',
        title: 'Maati Kahe Kumbhar Se...',
        about:
          'Thread the breath-jewels of "That I am"\nOn the endless string in your heart...',
        thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg',
      },
    ],
    poems: [
      { id: 'p11', title: 'Poem 1', about: 'Description', thumbnailUrl: '' },
      { id: 'p12', title: 'Poem 2', about: 'Description', thumbnailUrl: '' },
      { id: 'p13', title: 'Poem 3', about: 'Description', thumbnailUrl: '' },
    ],
    reflections: [
      { id: 'rf1', title: 'Reflection 1', about: 'Description', thumbnailUrl: '' },
    ],
    other: [
      { id: 'o1', title: 'Other 1', about: 'Description', thumbnailUrl: '' },
    ],
  },
  counts: { all: 10, songs: 12, poems: 3, reflections: 1, other: 0 },
};

export const POEMS_GLOSSARY = [
  { term: 'Shoonya', meaning: 'Emptiness' },
  { term: 'Ulat', meaning: 'Upside Down' },
  { term: 'Alakh', meaning: 'Unseeable' },
  { term: 'Darpan', meaning: 'Mirror' },
  { term: 'Shahar', meaning: 'City', highlighted: true },
];

export const TOTAL_POEMS = 201;

/** Resolve mock poem by CMS id, legacy `p1` ids, or 1-based index. */
export function findMockPoemById(id: string): PoemData | undefined {
  const direct = MOCK_POEMS.find((p) => p.id === id);
  if (direct) return direct;
  const legacy = MOCK_POEMS.find((p) => p.id === `p${id}`);
  if (legacy) return legacy;
  const index = Number.parseInt(id, 10);
  if (Number.isFinite(index) && index >= 1 && index <= MOCK_POEMS.length) {
    return MOCK_POEMS[index - 1];
  }
  return undefined;
}
