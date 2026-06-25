/**
 * Home page data mode (see `.env.example`).
 *
 * - Default (`false`): show mock cards immediately; merge `/Api/home` when available.
 * - `NEXT_PUBLIC_HOME_API_ONLY=true`: testing — only render sections returned by the API.
 */
export function isHomeApiOnlyMode(): boolean {
  return process.env.NEXT_PUBLIC_HOME_API_ONLY === 'true';
}
