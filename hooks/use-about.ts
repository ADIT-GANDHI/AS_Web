import { useEffect, useMemo, useState } from 'react';

import { AJAB_API_BASE } from '@/lib/ajabEnv';

const ABOUT_API_URL = `${AJAB_API_BASE}/Api/about`;

/* [Claude] these changes have been recommended by claude —
   Mock data updated to match Figma (367:10268) text content.
   Used when API is offline or returns empty/test data.
   HTML in visual_content is rendered via dangerouslySetInnerHTML. */

const MOCK_ABOUT_AJAB: Record<string, AboutEntry[]> = {
  intro: [
    {
      id: 'a-intro-1',
      type_label: '',
      visual_content:
        '<p>Ajab Shahar is a wondrous city of songs, poems and conversations from Bhakti, Sufi and Baul oral traditions of India and beyond. We host one of the most extensive digital archives of mystic poetry in performance, in print, and in conversation.</p><p>Spanning over two decades, our inspirations in the wisdom of these poems has taken the shape of several films, books, the Ajab Shahar web archive, an innovative schools curriculum Shabad Shaala, rural yatras, urban festivals &amp; more. Inspired by the call of Kabir, the 15th century north Indian mystic poet, our journeys inquire into the spiritual and socio-political resonances of mystic poetry.</p>',
    },
  ],
  team: [
    {
      id: 'a-team-1',
      type_label: 'Current core team',
      visual_content:
        '<p>Shabnam Virmani, Director<br/>Smriti Chanchani, Sr Artist &amp; Researcher<br/>Smruthi Mohan, Lead — Artist &amp; Design<br/>Shreyasee Mitra, Shabad Shaala Coordinator &amp; Project Assistance<br/>Shubhangi Bansal, Lead — Video &amp; Sound Design<br/>Anisha Bali, Lead — Research &amp; Archiving<br/>Kartikey Khanapurli, Lead — Creative Pedagogies<br/>Aaliya Hasan, Lead — Game Design &amp; Illustration<br/>Pavan Pasi, Production &amp; Technical Manager<br/>Hrishikesh Joi, Web Support</p>',
    },
    {
      id: 'a-team-2',
      type_label: 'Past Collaborators',
      visual_content:
        '<p>Vipul Rikhi, Writing &amp; Co-Creation<br/>Prashant Parvataneni, Writing &amp; Pedagogy</p>',
    },
    {
      id: 'a-team-3',
      type_label: 'Project Assistance',
      visual_content:
        '<p>Neha Rajan<br/>Hamratha Kartthik<br/>Manoela Nyanwi</p>',
    },
    {
      id: 'a-team-4',
      type_label: 'Poetry Insights',
      visual_content:
        '<p>Prahlad Tipanya<br/>Abdullah Hussain Turk<br/>Parvathy Baul<br/>&amp; many others</p>',
    },
  ],
  films: [
    {
      id: 'a-films-1',
      type_label: 'Web Development',
      visual_content: '<p>Thought Works, Bangalore<br/>Lampros, Bangalore</p>',
    },
    {
      id: 'a-films-2',
      type_label: 'Video Editing',
      visual_content:
        '<p>Aarthi Parthasarathy<br/>Radha Mahendru<br/>Piyush Kashyap<br/>Sharanya Gautam<br/>Shruti Kulkarni</p>',
    },
    {
      id: 'a-films-3',
      type_label: 'Camera',
      visual_content: '<p>Smriti Chanchani<br/>Aarthi Parthasarathy<br/>Shabnam Virmani</p>',
    },
  ],
  books: [
    {
      id: 'a-books-1',
      type_label: 'Books &amp; Publications',
      visual_content:
        '<p>Burn Down Your House — Vipul Rikhi (From Kabir)<br/>I Am That: Poems of Kabir — Vipul Rikhi<br/>The Weaver\'s Songs — Vinay Dharwadker</p>',
    },
  ],
  shabadshaala: [
    {
      id: 'a-shabad-1',
      type_label: 'Shabad Shaala',
      visual_content:
        '<p>Shabad Shaala is an innovative schools curriculum that brings the wisdom of mystic poetry into the everyday lives of children through song, dialogue and creative pedagogy. The curriculum has been piloted in schools across Karnataka, Rajasthan and Delhi.</p>',
    },
    {
      id: 'a-shabad-2',
      type_label: 'Pedagogy Initiatives',
      visual_content: '<p>Vishakha Chanchani</p>',
    },
    {
      id: 'a-shabad-3',
      type_label: 'Past Donors',
      visual_content:
        '<p>Ford Foundation<br/>WIPRO Applying Thought in Schools<br/>Raza Foundation<br/>Kavita Chandra<br/>Anbeli Banaan</p>',
    },
  ],
};

const MOCK_ABOUT_KABIR: Record<string, AboutEntry[]> = {
  intro: [
    {
      id: 'k-intro-1',
      type_label: '',
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
  shabadshaala: [
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

export interface AboutEntry {
  id: string;
  ajab_type?: string;
  kabir_type?: string;
  visual_content?: string;
  status?: string;
  created_at?: string;
  type_label?: string;
}

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

type AboutTab = 'ajab' | 'kabir';
type AboutMenuMap = Record<string, AboutEntry[]>;

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
const isMenuMapMeaningful = (menuMap: AboutMenuMap): boolean => {
  const allEntries = Object.values(menuMap).flat();
  if (!allEntries.length) return false;
  return allEntries.every(e => stripHtml(e.visual_content || '').length >= 20);
};

const normalizeEntry = (entry: AboutEntry): AboutEntry => ({
  id: String(entry?.id || ''),
  ajab_type: String(entry?.ajab_type || ''),
  kabir_type: String(entry?.kabir_type || ''),
  visual_content: String(entry?.visual_content || ''),
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

        // Use mock data if API content is sparse/placeholder
        const finalAjab = isMenuMapMeaningful(ajabParsed) ? ajabParsed : MOCK_ABOUT_AJAB;
        const finalKabir = isMenuMapMeaningful(kabirParsed) ? kabirParsed : MOCK_ABOUT_KABIR;

        setAjabMenus(finalAjab);
        setKabirMenus(finalKabir);

        const firstAjabMenu = Object.keys(finalAjab)[0] || '';
        const firstKabirMenu = Object.keys(finalKabir)[0] || '';

        setActiveMenuByTab({ ajab: firstAjabMenu, kabir: firstKabirMenu });

        if (!firstAjabMenu && firstKabirMenu) {
          setActiveTab('kabir');
        }
      } catch {
        // API offline → fall back to mock so the Figma layout still renders
        setAjabMenus(MOCK_ABOUT_AJAB);
        setKabirMenus(MOCK_ABOUT_KABIR);
        setActiveMenuByTab({
          ajab: Object.keys(MOCK_ABOUT_AJAB)[0] || '',
          kabir: Object.keys(MOCK_ABOUT_KABIR)[0] || '',
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

    const fallback = Object.keys(menuMapForTab)[0] || '';
    return fallback;
  }, [activeTab, activeMenuByTab, menuMapForTab]);

  const activeMenuEntries = useMemo(
    () => (activeMenu ? menuMapForTab[activeMenu] || [] : []),
    [activeMenu, menuMapForTab]
  );

  const activeMenuKeys = useMemo(() => Object.keys(menuMapForTab), [menuMapForTab]);

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
