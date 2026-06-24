/** localStorage key — timestamp (ms) until which auto-open is suppressed. */
const SNOOZE_UNTIL_KEY = 'ajab-news-popup-hidden-until';

/** Default snooze after the user closes the home news popup. */
export const AJAB_NEWS_POPUP_SNOOZE_DAYS = 7;

/**
 * Temporary kill-switch for home auto-popup (survives refresh without env restart).
 * Set to `true` when you're ready to show the popup again on `/`.
 */
export const AJAB_NEWS_HOME_AUTO_OPEN = false;

export function ajabNewsPopupSnoozeMs(
  days: number = AJAB_NEWS_POPUP_SNOOZE_DAYS
): number {
  return days * 24 * 60 * 60 * 1000;
}

export function isAjabNewsPopupSnoozed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(SNOOZE_UNTIL_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until) || Date.now() >= until) {
      localStorage.removeItem(SNOOZE_UNTIL_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function snoozeAjabNewsPopup(
  ms: number = ajabNewsPopupSnoozeMs()
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SNOOZE_UNTIL_KEY, String(Date.now() + ms));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Gate for home-page auto-open (footer can still open via `open-ajab-news`). */
export function shouldAutoOpenAjabNewsPopup(): boolean {
  if (!AJAB_NEWS_HOME_AUTO_OPEN) return false;
  if (process.env.NEXT_PUBLIC_AJAB_NEWS_AUTO_OPEN === 'false') return false;
  return !isAjabNewsPopupSnoozed();
}
