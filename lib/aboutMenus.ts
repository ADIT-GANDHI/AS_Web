export type AboutBrand = 'ajab' | 'kabir';

export interface AboutEntry {
  id: string;
  ajab_type?: string;
  kabir_type?: string;
  visual_content?: string;
  menu_image?: string | null;
  status?: string;
  created_at?: string;
  type_label?: string;
}

export type AboutMenuMap = Record<string, AboutEntry[]>;

/** PDF + CMS menu keys in display order (7.About_01.05.2025). */
export const ABOUT_MENU_ORDER: Record<AboutBrand, string[]> = {
  ajab: ['intro', 'translit guide', 'copyrights'],
  kabir: ['intro', 'team', 'films', 'books', 'shabad shaala'],
};

export const ABOUT_MENU_LABELS: Record<string, string> = {
  intro: 'INTRO',
  'translit guide': 'TRANSLIT GUIDE',
  copyrights: 'COPYRIGHTS',
  team: 'TEAM',
  films: 'FILMS',
  books: 'BOOKS',
  'shabad shaala': 'SHABAD SHAALA',
};

export function formatAboutMenuLabel(menuKey: string): string {
  const key = menuKey.toLowerCase();
  return ABOUT_MENU_LABELS[key] || menuKey.toUpperCase();
}

export function orderAboutMenuKeys(brand: AboutBrand, keys: string[]): string[] {
  const allowed = new Set(ABOUT_MENU_ORDER[brand].map((k) => k.toLowerCase()));
  const normalized = keys.filter((k) => allowed.has(k.toLowerCase()));
  return ABOUT_MENU_ORDER[brand].filter((ordered) =>
    normalized.some((k) => k.toLowerCase() === ordered.toLowerCase())
  );
}
