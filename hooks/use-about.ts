import { useEffect, useMemo, useState } from 'react';

import {
  ABOUT_MENU_ORDER,
  orderAboutMenuKeys,
  type AboutBrand,
  type AboutEntry,
  type AboutMenuMap,
} from '@/lib/aboutMenus';

export type { AboutEntry } from '@/lib/aboutMenus';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { resolveCmsAssetUrl } from '@/lib/resolveCmsAssetUrl';

const ABOUT_API_URL = `${AJAB_API_BASE}/Api/about`;

/* [Claude] these changes have been recommended by claude —
   Mock data updated to match Figma (367:10268) text content.
   Used when API is offline or returns empty/test data.
   HTML in visual_content is rendered via dangerouslySetInnerHTML. */

/** PDF page 1 — Ajab Shahar: intro, translit guide, copyrights only. */
const MOCK_ABOUT_AJAB: AboutMenuMap = {
  intro: [
    {
      id: 'a-intro-1',
      type_label: 'Introduction to Ajab Shahar',
      visual_content:
        '<p>Often Kabir and the mystics will invite us to a wondrous city (ajab shahar), a crazy land (deewaana des), utterly beyond borders, where everything thrives in an interconnected web of oneness. Inspired by that call, we have created here such a digital city of wonder, where singers, poems and songs from far flung regions, different languages and vividly distinct styles come and jostle together. What they share in common though, is the evocation of a truth beyond boundaries.</p><p>Wandering through this city you will hear many voices — from Pakistan in the west to Bengal in the east — singing, reflecting and expressing the wisdom of Bhakti, Sufi and Baul poets from in and around India. This is a digital dive into a vibrant oral tradition that keeps alive through song, the words of mystics and poets now long gone, such as Kabir, Meera, Ravidas, Bulleh Shah, Shah Latif, Lalon Fakir and so many others. The city has 3 main gateways — Songs, Poems and Reflections — but you could also wander through other pathways, such as People, Films, Radio or continue to read more about us, and what else we do on this page.</p><p>We are a small team bringing together our skills in filmmaking, design, writing, translation, singing and art to a shared passion and inspiration — the poetry of the mystics. We form the Kabir Project, which was seeded in 2002 at the Srishti Institute of Art, Design &amp; Technology in Bangalore, India.</p>',
    },
    {
      id: 'a-intro-2',
      type_label: 'Inspired by Satsang',
      visual_content:
        '<p>‘Sat-sang’ means to be in the ‘company of truth’. In many villages of rural India and neighbouring countries, people gather to participate in such satsangs (mehfils or samas in the Sufi context) — sessions of singing and deep listening to the songs of these poets. As the night progresses, listeners blend into the collective sound by singing or clapping along or playing cymbals. Perhaps the energy of a powerful satsang allows us to disengage from our particular and located selves. Our selves expand to include many others. Our identities dissolve …more</p>',
    },
    {
      id: 'a-intro-3',
      type_label: 'Research and Curation',
      visual_content:
        '<p>‘Sat-sang’ means to be in the ‘company of truth’. In many villages of rural India and neighbouring countries, people gather to participate in such satsangs (mehfils or samas in the Sufi context) — sessions of singing and deep listening to the songs of these poets. As the night progresses, listeners blend into the collective sound by singing or clapping along or playing cymbals. Perhaps the energy of a powerful satsang allows us to disengage from our particular and located selves. Our selves expand to include many others. Our identities dissolve…more</p>',
    },
    {
      id: 'a-intro-4',
      type_label: 'Ethics of Use',
      visual_content:
        '<p>‘Sat-sang’ means to be in the ‘company of truth’. In many villages of rural India and neighbouring countries, people gather to participate in such satsangs (mehfils or samas in the Sufi context) — sessions of singing and deep listening to the songs of these poets. As the night progresses, listeners blend into the collective sound by singing or clapping along or playing cymbals. Perhaps the energy of a powerful satsang allows us to disengage from our particular and located selves. Our selves expand to include many others. Our identities dissolve…more</p>',
    },
  ],
  'translit guide': [
    {
      id: 'a-translit-1',
      type_label: 'Transliteration Guide',
      visual_content:
        '<p>This guide explains how we transliterate words from Hindi, Urdu and other regional languages into the Roman script for this archive. We aim for readability while staying close to pronunciation heard in performance.</p>',
    },
  ],
  copyrights: [
    {
      id: 'a-copy-1',
      type_label: 'Copyrights',
      visual_content:
        '<p>All content on Ajab Shahar is shared for educational and cultural purposes. Please contact us before reproducing recordings, films or texts for commercial use. Credits and permissions for individual works may vary — see notes on each page where applicable.</p>',
    },
  ],
};

/** PDF page 2 — Kabir Project: intro, team, films, books, shabad shaala. */
const MOCK_ABOUT_KABIR: AboutMenuMap = {
  intro: [
    {
      id: 'k-intro-1',
      type_label: 'Introduction to Kabir Project',
      visual_content:
        '<p>The Kabir Project consists of many journeys inspired by Bhakti, Sufi, and Baul poems and songs as they flow in the rural folk traditions. Spanning over two decades, our inspirations in the wisdom of these poems has taken the shape of several FILMS, BOOKS, the AJAB SHAHAR web archive, an innovative schools curriculum SHABAD SHAALA, rural yatras, urban FESTIVALS &amp; MORE.</p><p>Inspired by the call of Kabir, the 15th century north Indian mystic poet, our journeys inquire into the spiritual and socio-political resonances of mystic poetry. The true spirit of our work lies in the taana-baana (warp &amp; weft) of social networks and friendships built over two decades between the singers, scholars, activists, artists, students, and the larger public through our work which continues to expand in new and surprising directions.</p>',
    },
  ],
  team: [
    {
      id: 'k-team-1',
      type_label: 'Current core team',
      visual_content:
        '<p>Shabnam Virmani — Director, Producer, Filmmaker<br/>Smriti Chanchani — Senior Artist &amp; Researcher<br/>Smruthi Mohan — Lead Artist &amp; Designer</p>',
    },
    {
      id: 'k-team-2',
      type_label: 'Past Collaborators',
      visual_content:
        '<p>Vipul Rikhi — Writing &amp; Co-Creation<br/>Prashant Parvataneni — Writing &amp; Pedagogy<br/>Neha Rajan — Project Assistance</p>',
    },
  ],
  films: [
    {
      id: 'k-films-0',
      type_label: '',
      visual_content:
        '<p>The Kabir Project has produced 4 documentary films on the living oral traditions of Bhakti and Sufi poetry, exploring how these 500-year-old songs and teachings continue to inspire and challenge us today.</p>',
    },
    {
      id: 'k-films-1',
      type_label: 'Journeys with Kabir',
      visual_content:
        '<p><strong>Had Anhad — Journeys with Ram and Kabir (2008)</strong><br/>The story highlights the gulshan-e-na-afreeda (the Uncreated Garden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was guided by a non-egoic spirit of connection and love.</p><p><strong>Chalo Hamara Des — Journeys with Kabir &amp; Friends (2009)</strong><br/>A journey to the heartland of Kabir country — Benares, Malwa, Rajasthan — with singers, scholars, activists and artists who draw sustenance from these poems.</p><p><strong>Koi Sunta Hai — Journeys with Kumar &amp; Kabir (2008)</strong><br/>An intimate portrait of Kumar Gandharva, legendary classical vocalist, and his lifelong dialogue with the poetry of Kabir.</p><p><strong>Kabira Khada Bazaar Mein — Journeys with Sacred and Secular Kabir (2009)</strong><br/>Exploring the many ways Kabir is invoked across social, political and spiritual contexts in contemporary India.</p>',
    },
  ],
  books: [
    {
      id: 'k-books-0',
      type_label: '',
      visual_content:
        '<p>Books produced in collaboration with writers, translators and scholars who have engaged deeply with the Bhakti and Sufi traditions.</p>',
    },
    {
      id: 'k-books-1',
      type_label: 'Publications',
      visual_content:
        '<p><strong>Burn Down Your House</strong> — Poems of Kabir, translated by Vipul Rikhi. Penguin Books, 2016.<br/><strong>I Am That: Poems of Kabir</strong> — Vipul Rikhi. HarperCollins, 2020.<br/><strong>The Weaver\'s Songs</strong> — Vinay Dharwadker. Penguin Classics.<br/><strong>Echoes from a Sufi Saint</strong> — Anthology of Shah Latif Bhitai.</p>',
    },
  ],
  'shabad shaala': [
    {
      id: 'k-shabad-1',
      type_label: 'About Shabad Shaala',
      visual_content:
        '<p>Shabad Shaala is an innovative schools curriculum that brings the wisdom of mystic poetry into the everyday lives of children through song, dialogue and pedagogy. The curriculum has been piloted in schools across Karnataka, Rajasthan and Delhi, reaching thousands of children and teachers.</p>',
    },
    {
      id: 'k-shabad-2',
      type_label: 'Current Initiatives',
      visual_content:
        '<p>Teacher training workshops in rural Karnataka and Rajasthan<br/>Annual Shabad Shaala festival in Bangalore<br/>Online curriculum resources for schools</p>',
    },
  ],
};

interface AboutApiResponse {
  status?: boolean;
  data?: {
    ajab_shahar?: {
      menus?: Record<string, AboutEntry[] | unknown>;
    } | AboutEntry[];
    kabir_project?: {
      menus?: Record<string, AboutEntry[] | unknown>;
    } | AboutEntry[];
  };
}

type AboutTab = AboutBrand;

const toArray = (value: unknown): AboutEntry[] => (Array.isArray(value) ? value : []);

/* [Claude] these changes have been recommended by claude —
   Returns false when the API data has placeholder/test content
   (e.g. visual_content is "asd", "zxc", or very short after stripping tags).
   Falls back to mock data in that case so the page renders the designed layout. */
const stripHtml = (html: string): string =>
  html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')  // remove CSS style blocks
    .replace(/<[^>]+>/g, ' ')                         // remove HTML tags
    .replace(/\s+/g, ' ')
    .trim();

/* [Claude] these changes have been recommended by claude —
   Meaningful = every entry has at least 20 chars of real text after stripping HTML.
   A single placeholder entry (e.g. "asd", "zxc") causes the whole tab group to
   fall back to mock data so the designed layout always renders. */
const isEntryMeaningful = (entry: AboutEntry): boolean => {
  const html = entry.visual_content || '';
  if (stripHtml(html).length >= 20) return true;
  return /<img\b/i.test(html);
};

const resolveApiMenuKey = (api: AboutMenuMap, orderedKey: string): string | null => {
  const match = Object.keys(api).find((k) => k.toLowerCase() === orderedKey.toLowerCase());
  return match ?? null;
};

/** PDF menu keys only — never add mock tabs outside ABOUT_MENU_ORDER. */
const buildBrandMenus = (
  brand: AboutBrand,
  api: AboutMenuMap,
  mock: AboutMenuMap
): AboutMenuMap => {
  const merged: AboutMenuMap = {};

  for (const orderedKey of ABOUT_MENU_ORDER[brand]) {
    const apiKey = resolveApiMenuKey(api, orderedKey);
    const apiEntries = apiKey ? api[apiKey] || [] : [];
    const mockKey = resolveApiMenuKey(mock, orderedKey);
    const mockEntries = mockKey ? mock[mockKey] || [] : [];

    if (apiEntries.length && apiEntries.every(isEntryMeaningful)) {
      merged[orderedKey] = apiEntries;
    } else if (mockEntries.length) {
      merged[orderedKey] = mockEntries;
    } else if (apiEntries.length) {
      merged[orderedKey] = apiEntries;
    }
  }

  return merged;
};

export const isPlaceholderAboutHtml = (html: string): boolean =>
  stripHtml(html).length < 20;

export const shouldShowAboutTypeLabel = (
  label: string | undefined,
  activeMenu: string
): boolean => {
  const t = (label || '').trim();
  if (!t) return false;
  if (t.toLowerCase() === activeMenu.toLowerCase()) return false;
  if (t.toLowerCase() === 'intro') return false;
  return true;
};

export const resolveAboutMenuImageUrl = (path?: string | null): string | null => {
  const t = (path || '').trim();
  if (!t) return null;
  return resolveCmsAssetUrl(t.startsWith('/') ? t : `/${t}`);
};

const normalizeEntry = (entry: AboutEntry): AboutEntry => ({
  id: String(entry?.id || ''),
  ajab_type: String(entry?.ajab_type || ''),
  kabir_type: String(entry?.kabir_type || ''),
  visual_content: String(entry?.visual_content || ''),
  menu_image: entry?.menu_image ? String(entry.menu_image) : null,
  status: String(entry?.status || ''),
  created_at: String(entry?.created_at || ''),
  type_label: String(entry?.type_label || ''),
});

const normalizeMenuMap = (value: unknown): AboutMenuMap => {
  if (Array.isArray(value)) {
    return value.length ? { all: value.map(normalizeEntry) } : {};
  }

  if (!value || typeof value !== 'object') {
    return {};
  }

  const records = Object.entries(value as Record<string, unknown>);
  return records.reduce<AboutMenuMap>((acc, [key, menuValue]) => {
    const items = toArray(menuValue).map(normalizeEntry);
    if (items.length) {
      acc[key] = items;
    }
    return acc;
  }, {});
};

export const useAbout = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ajabMenus, setAjabMenus] = useState<AboutMenuMap>({});
  const [kabirMenus, setKabirMenus] = useState<AboutMenuMap>({});
  const [activeTab, setActiveTab] = useState<AboutTab>('ajab');
  const [activeMenuByTab, setActiveMenuByTab] = useState<Record<AboutTab, string>>({
    ajab: '',
    kabir: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(ABOUT_API_URL, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to fetch about data: ${response.statusText}`);
        }

        const payload = (await response.json()) as AboutApiResponse;

        const ajabData = payload?.data?.ajab_shahar;
        const kabirData = payload?.data?.kabir_project;

        const ajabParsed = normalizeMenuMap(
          Array.isArray(ajabData) ? ajabData : ajabData?.menus
        );
        const kabirParsed = normalizeMenuMap(
          Array.isArray(kabirData) ? kabirData : kabirData?.menus
        );

        const finalAjab = buildBrandMenus('ajab', ajabParsed, MOCK_ABOUT_AJAB);
        const finalKabir = buildBrandMenus('kabir', kabirParsed, MOCK_ABOUT_KABIR);

        setAjabMenus(finalAjab);
        setKabirMenus(finalKabir);

        const firstAjabMenu = orderAboutMenuKeys('ajab', Object.keys(finalAjab))[0] || '';
        const firstKabirMenu = orderAboutMenuKeys('kabir', Object.keys(finalKabir))[0] || '';

        setActiveMenuByTab({ ajab: firstAjabMenu, kabir: firstKabirMenu });

        if (!firstAjabMenu && firstKabirMenu) {
          setActiveTab('kabir');
        }
      } catch {
        // API offline → fall back to mock so the Figma layout still renders
        setAjabMenus(MOCK_ABOUT_AJAB);
        setKabirMenus(MOCK_ABOUT_KABIR);
        setActiveMenuByTab({
          ajab: ABOUT_MENU_ORDER.ajab[0] || '',
          kabir: ABOUT_MENU_ORDER.kabir[0] || '',
        });
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const menuMapForTab = useMemo(
    () => (activeTab === 'ajab' ? ajabMenus : kabirMenus),
    [activeTab, ajabMenus, kabirMenus]
  );

  const activeMenu = useMemo(() => {
    const selected = activeMenuByTab[activeTab];
    if (selected && menuMapForTab[selected]) {
      return selected;
    }

    return orderAboutMenuKeys(activeTab, Object.keys(menuMapForTab))[0] || '';
  }, [activeTab, activeMenuByTab, menuMapForTab]);

  const activeMenuEntries = useMemo(
    () => (activeMenu ? menuMapForTab[activeMenu] || [] : []),
    [activeMenu, menuMapForTab]
  );

  const activeMenuKeys = useMemo(
    () => orderAboutMenuKeys(activeTab, Object.keys(menuMapForTab)),
    [activeTab, menuMapForTab]
  );

  const setActiveMenu = (menu: string) => {
    setActiveMenuByTab((previous) => ({
      ...previous,
      [activeTab]: menu,
    }));
  };

  const activeEntries = useMemo(
    () => activeMenuEntries,
    [activeMenuEntries]
  );

  return {
    loading,
    error,
    activeTab,
    setActiveTab,
    setActiveMenu,
    activeMenu,
    activeMenuKeys,
    ajabMenus,
    kabirMenus,
    activeEntries,
  };
};
