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
  published?: string | null;
  show_on_home?: string | null;
  video_url?: string | null;
};

export function isRenderableNewsPopupCategory(category: unknown): boolean {
  const c = String(category || '').toLowerCase();
  return c === 'single' || c === 'multiple' || c === 'video';
}

type NewsRow = {
  published?: string | null;
  popup_items?: NewsPopup[];
};

/** Listing + Ajab News page: published image/text popups (not video-only). */
export function filterNewsForPublicSite(items: NewsRow[]): NewsRow[] {
  return items
    .map((item) => {
      const popup_items = (item.popup_items || []).filter(
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
    for (const p of item.popup_items || []) {
      if (!isCmsPublished(p.published)) continue;
      if (!isPopupForHome(p.show_on_home)) continue;
      if (isRenderableNewsPopupCategory(p.category)) {
        popups.push(p);
      }
    }
  }
  return popups;
}
