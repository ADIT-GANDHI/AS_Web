/** Treat CMS yes/no publish flags consistently across news popup_items. */
export function isCmsPublished(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  const normalized = String(value).trim().toLowerCase();
  return normalized !== '0' && normalized !== 'false' && normalized !== 'no';
}

export function isPopupForHome(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'yes' || normalized === 'true';
}

type NewsPopup = {
  category?: string;
  title?: string;
  second_title?: string;
  content?: string;
  image?: string;
  images?: string[];
  video_url?: string;
  published?: string | null;
  show_on_home?: string | null;
  sequence_order?: string | number | null;
};

type NewsRow = {
  id?: string;
  news_title?: string | null;
  news_second_title?: string | null;
  ajab_news_content?: string | null;
  news_content?: string | null;
  published?: string | null;
  publish_status?: string | null;
  popup_items?: NewsPopup[];
};

/** News row is public when `publish_status` or `published` is not a draft flag. */
export function isNewsRowPublished(row: NewsRow): boolean {
  if (row.publish_status !== undefined && row.publish_status !== null && row.publish_status !== '') {
    return isCmsPublished(row.publish_status);
  }
  return isCmsPublished(row.published);
}

/** `news_content` is sometimes a JSON array of popup_items when `popup_items` is empty. */
export function parseNewsContentPopups(newsContent: unknown): NewsPopup[] {
  if (!newsContent || typeof newsContent !== 'string') return [];
  const trimmed = newsContent.trim();
  if (!trimmed.startsWith('[')) return [];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return Array.isArray(parsed) ? (parsed as NewsPopup[]) : [];
  } catch {
    return [];
  }
}

/** Popup items from API array, embedded JSON, or top-level news fields. */
export function getPopupItemsForNewsRow(row: NewsRow): NewsPopup[] {
  const fromArray = Array.isArray(row.popup_items) ? row.popup_items : [];
  if (fromArray.length) return fromArray;

  const fromContent = parseNewsContentPopups(row.news_content);
  if (fromContent.length) return fromContent;

  const title = String(row.news_title || '').trim();
  const content = String(row.ajab_news_content || '').trim();
  if (!title && !content) return [];

  return [
    {
      category: 'single',
      title: title || 'Untitled',
      second_title: row.news_second_title || '',
      content,
      published: '1',
      show_on_home: '1',
    },
  ];
}

export type { NewsPopup, NewsRow };

/** Listing + Ajab News page: published image/text popups (not video-only). */
export function filterNewsForPublicSite(items: NewsRow[]): NewsRow[] {
  return items
    .filter(isNewsRowPublished)
    .map((item) => {
      const popup_items = getPopupItemsForNewsRow(item).filter(
        (p) => isCmsPublished(p.published) && isRenderableNewsPopupCategory(p.category)
      );
      return { ...item, popup_items };
    })
    .filter((item) => (item.popup_items || []).length > 0);
}

/** Home popup carousel: published popups flagged for home. */
export function filterHomeNewsPopups(items: NewsRow[]): NewsPopup[] {
  const popups: NewsPopup[] = [];
  for (const item of items) {
    if (!isNewsRowPublished(item)) continue;
    for (const p of getPopupItemsForNewsRow(item)) {
      if (!isCmsPublished(p.published)) continue;
      if (!isPopupForHome(p.show_on_home)) continue;
      if (isRenderableNewsPopupCategory(p.category)) {
        popups.push(p);
      }
    }
  }
  return popups;
}

export function isRenderableNewsPopupCategory(category: unknown): boolean {
  const c = String(category || '').toLowerCase();
  return c === 'single' || c === 'multiple' || c === 'video';
}
