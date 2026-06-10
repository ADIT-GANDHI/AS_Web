# CMS API integration (Ajab Shahar frontend)

**Endpoint-by-endpoint payloads, errors, staging health, and where each route is used:** [`docs/API_REFERENCE.md`](./API_REFERENCE.md) (see **§12 API health matrix**).

This document describes how this Next.js app talks to the **JSON CMS APIs**, what you get back, and how to run and point the app during development.

## Goals

- **Content** (songs, people, films, reflections, glossary, home highlights, search) comes from **HTTP JSON** endpoints under `{base}/Api/...`.
- **Layout, backgrounds, and bespoke UI assets** live in this repo (`public/`, `Images/`, CSS). The CMS does not ship full page designs—only fields and often **relative paths** to media on the same host as the API.

## Central configuration

### `AJAB_API_BASE` (`lib/ajabEnv.ts`)

Most fetches and image URL normalisation use:

```ts
export const AJAB_API_BASE = trimTrailingSlashes(
  process.env.NEXT_PUBLIC_AJAB_API_BASE ?? 'https://ajabshahar.aaravega.in'
);
```

- **No trailing slash** on the base.
- API calls are built as `` `${AJAB_API_BASE}/Api/...` `` (e.g. `/Api/list`, `/Api/home`).
- Relative media paths from the API (e.g. `/images/...`, `uploads/...`) are prefixed with `AJAB_API_BASE` in components and services so the browser loads files from the CMS origin.

**Override for staging / new admin panel:**

```env
# .env.local
NEXT_PUBLIC_AJAB_API_BASE=https://ajab.designanddevelopment.in/admin
```

Restart `npm run dev` after changing env vars.

### `NEXT_PUBLIC_API_URL` (`lib/utils/apiConfig.ts`)

```ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || URL;
```

`URL` falls back to `lib/utils/constant.ts` (`https://ajabshahar.com/api/`) if the env var is unset. Today `.env.local` sets:

```env
NEXT_PUBLIC_API_URL=https://ajabshahar.aaravega.in/Api/
```

This is mainly for any code path that still uses the shared axios `baseURL` pattern. **Most of the app uses explicit URLs built from `AJAB_API_BASE`**, so keep both aligned with whichever CMS you are targeting.

## CMS bases we have used

| Environment | Typical `AJAB_API_BASE` | Notes |
|-------------|------------------------|--------|
| Legacy | `https://ajabshahar.aaravega.in` | Original host; `/Api/...` at site root. Availability depends on that server. |
| New admin / staging | `https://ajab.designanddevelopment.in/admin` | JSON lives under **`/admin/Api/...`**. Same relative paths (`/images/...`, `uploads/...`) resolve under this base. |

If list/detail pages are empty, confirm with DevTools **Network** that requests return **JSON** (200) and not HTML (404/error page).

## Example endpoints and response shape

All examples use `{AJAB_API_BASE}/Api/...`.

| Endpoint | Purpose (short) | Typical payload |
|----------|-----------------|-------------------|
| `GET /Api/home` | Home / landing content | `status`, `home_source`, `latest` (e.g. featured song, thumbnails as paths). |
| `GET /Api/list` | Song listing + filters query params | `status`, `page`, `limit`, `total`, `data[]` (song rows, `thumbnail_url`, YouTube ids, meta). |
| `GET /Api/song_filters` | Filter options | `status`, `data` (buckets for UI filters). |
| `GET /Api/explore_songs` | Song detail | Query `song_id`, `language`. |
| `GET /Api/song_versions`, `/Api/related` | Versions / related | Tied to `song_id`. |
| `GET /Api/film_list`, person/reflection lists | Listings | Paginated `data[]` with thumbnails and metadata. |
| `GET /Api/glossary` | Glossary terms | `data[]` with terms, meanings, optional `poetic_images`. |
| `GET /Api/nitesh` | Search | `results`, counts, thumbnail paths in hits. |

**Media fields** are usually strings such as:

- `/images/TN-....jpg` — prefix with `AJAB_API_BASE`.
- `uploads/thumbnails/...` or `uploads/glossary/...` — prefix with `AJAB_API_BASE` (and avoid double slashes: if the value already starts with `/`, use `` `${AJAB_API_BASE}${path}` ``).

**External links** (YouTube, SoundCloud) appear as full URLs; use as-is.

## CORS and local development

When the CMS sends **`Access-Control-Allow-Origin: *`** (or your dev origin explicitly), the **browser** can call the API from `http://localhost:3000`.

Server-side `fetch` during `next build` / SSR does not use CORS the same way; if the build can reach the host, static generation can still succeed.

## Localhost: running the app

From the project root:

```bash
npm install
npm run dev
```

Open **http://localhost:3000** (Next.js default port; if 3000 is busy, the terminal will print the actual URL).

- **Development** uses the normal Next dev server (not static export). Static `output: 'export'` applies only when `NODE_ENV === 'production'` in `next.config.mjs`.
- To verify which API you are hitting: browser **DevTools → Network**, filter by `Api` or your CMS host.

## Switching CMS without code edits

1. Set `NEXT_PUBLIC_AJAB_API_BASE` in `.env.local` to the desired origin (no trailing slash), e.g. `https://ajab.designanddevelopment.in/admin`.
2. Optionally set `NEXT_PUBLIC_API_URL` to the matching **`.../Api/`** prefix if you rely on `API_BASE_URL`.
3. Restart `npm run dev`.

## Troubleshooting: `ENOENT` … `.next\server\app\_not-found\page.js`

That error usually means the **`.next` build cache is incomplete or out of sync** with the running dev server (for example after `prebuild` deletes `.next` while `next dev` is still running, or several dev processes fight over the same folder).

**Fix:** stop all `next dev` / `next start` processes, delete the `.next` directory, then run `npm run dev` again. This repo includes **`app/not-found.tsx`** so Next always has a real not-found route to compile.

## Security

- Admin UI credentials are **not** required for these public JSON reads in normal operation.
- Do not commit real passwords or secrets; keep them in local env or your deployment secret store.

## Related files (for code navigation)

- `lib/ajabEnv.ts` — `AJAB_API_BASE`
- `lib/utils/apiConfig.ts`, `lib/utils/constant.ts` — legacy base URL helpers
- `lib/services/*`, `hooks/use-*.ts`, `components/**` — fetches and image URL building
- `app/**/page.tsx` — some `generateStaticParams` list fetches

---

*Last updated to reflect the dual-CMS setup (legacy `aaravega` default + optional new admin base via env).*
