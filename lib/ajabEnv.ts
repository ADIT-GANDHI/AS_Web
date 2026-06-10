/**
 * CMS JSON API + default media origin (no trailing slash).
 *
 * Configure one of:
 * - `NEXT_PUBLIC_AJAB_API_BASE` — origin that serves `/Api/...` and CMS media, e.g.
 *   `https://ajab.designanddevelopment.in/admin`
 * - `NEXT_PUBLIC_API_URL` — legacy full API prefix; we strip a trailing `/Api/` so
 *   `https://host/path/Api/` becomes `https://host/path` (same as AJAB_API_BASE).
 *
 * If neither is set, a production CMS default is used so local `next dev` still gets live
 * JSON + `/images/…` without extra setup (override in `.env.local` for your environment).
 */
function trimTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}

function baseFromLegacyApiUrl(url: string): string {
  return trimTrailingSlashes(url).replace(/\/Api\/?$/i, '');
}

const explicit = process.env.NEXT_PUBLIC_AJAB_API_BASE?.trim();
const fromApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const AJAB_API_BASE = trimTrailingSlashes(
  explicit || (fromApiUrl ? baseFromLegacyApiUrl(fromApiUrl) : '') || 'https://ajab.designanddevelopment.in/admin'
);
