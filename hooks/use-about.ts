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

/** Placeholder body when API entry is missing or junk (API-only policy). */
const LOREM_HTML =
  '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>';

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

const stripHtml = (html: string): string =>
  html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Strip CMS-injected styles so PDF typography can apply. */
export const sanitizeAboutHtml = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\sstyle\s*=\s*"[^"]*"/gi, '')
    .replace(/\sstyle\s*=\s*'[^']*'/gi, '')
    .replace(/\sclass\s*=\s*"[^"]*"/gi, '')
    .replace(/\sclass\s*=\s*'[^']*'/gi, '');

const isJunkPlainText = (text: string): boolean => {
  const t = text.trim();
  if (t.length < 20) return true;
  const compact = t.replace(/\s+/g, '');
  if (/^(asd|zxc|test|dgf|xxx|qwe|lorem)+$/i.test(compact)) return true;
  if (/^(.)\1{6,}$/i.test(compact)) return true;
  // Short keyboard-mash without normal vowels pattern
  if (t.length < 48 && !/[aeiou]{1}.*[aeiou]/i.test(t)) return true;
  return false;
};

export const isPlaceholderAboutHtml = (html: string): boolean =>
  isJunkPlainText(stripHtml(html));

/**
 * Section heading: show API type_label when it is a real title (not just the menu key).
 */
export const shouldShowAboutTypeLabel = (
  label: string | undefined,
  activeMenu: string
): boolean => {
  const t = (label || '').trim();
  if (!t) return false;
  const menu = activeMenu.toLowerCase().trim();
  if (t.toLowerCase() === menu) return false;
  if (t.toLowerCase() === 'intro') return false;
  return true;
};

export const resolveAboutMenuImageUrl = (path?: string | null): string | null => {
  const t = (path || '').trim();
  if (!t) return null;
  return resolveCmsAssetUrl(t.startsWith('/') ? t : `/${t}`);
};

const extractImgTags = (html: string): string => {
  const tags = html.match(/<img\b[^>]*>/gi);
  return tags ? tags.join('') : '';
};

/** API entry only — junk/empty body becomes lorem; images from API are kept. */
const prepareApiEntry = (entry: AboutEntry): AboutEntry => {
  const sanitized = sanitizeAboutHtml(entry.visual_content || '');
  const text = stripHtml(sanitized);
  const images = extractImgTags(sanitized);

  let visual_content = sanitized;
  if (isJunkPlainText(text)) {
    visual_content = images ? `${images}${LOREM_HTML}` : LOREM_HTML;
  }

  return {
    ...entry,
    visual_content,
  };
};

const resolveApiMenuKey = (api: AboutMenuMap, orderedKey: string): string | null => {
  const match = Object.keys(api).find((k) => k.toLowerCase() === orderedKey.toLowerCase());
  return match ?? null;
};

/** PDF menu order, API data only — no designed mock copy. */
const buildBrandMenusFromApi = (brand: AboutBrand, api: AboutMenuMap): AboutMenuMap => {
  const merged: AboutMenuMap = {};

  for (const orderedKey of ABOUT_MENU_ORDER[brand]) {
    const apiKey = resolveApiMenuKey(api, orderedKey);
    if (!apiKey) continue;
    const apiEntries = api[apiKey] || [];
    if (!apiEntries.length) continue;
    merged[orderedKey] = apiEntries.map(prepareApiEntry);
  }

  return merged;
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

        const finalAjab = buildBrandMenusFromApi('ajab', ajabParsed);
        const finalKabir = buildBrandMenusFromApi('kabir', kabirParsed);

        setAjabMenus(finalAjab);
        setKabirMenus(finalKabir);

        const firstAjabMenu = orderAboutMenuKeys('ajab', Object.keys(finalAjab))[0] || '';
        const firstKabirMenu = orderAboutMenuKeys('kabir', Object.keys(finalKabir))[0] || '';

        setActiveMenuByTab({ ajab: firstAjabMenu, kabir: firstKabirMenu });

        if (!firstAjabMenu && firstKabirMenu) {
          setActiveTab('kabir');
        }
      } catch {
        // API-only: no designed mocks — leave blank
        setAjabMenus({});
        setKabirMenus({});
        setActiveMenuByTab({ ajab: '', kabir: '' });
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

  const activeEntries = useMemo(() => activeMenuEntries, [activeMenuEntries]);

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
