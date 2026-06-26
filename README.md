# Ajab Shahar — Web App

Next.js 15 (App Router) front-end for [ajab.damnetworks.com](http://ajab.damnetworks.com/).

---

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`. No basePath prefix in dev — all asset paths work as normal.

---

## Production Build & Deploy

### 1. Build

```bash
npm run build
```

Or explicitly (same result):

```bash
npm run build:final
```

This does three things automatically:
1. Cleans `.next/`, `out/`, `build/` (prebuild)
2. Regenerates page background tiles (prebuild)
3. Compiles and exports the full static site into `out/`
4. Syncs all `public/` assets into `out/` and writes root `.htaccess` (postbuild — see `scripts/fix-basepath-assets.mjs`)

**Deploy target:** root URLs at `https://ajab.damnetworks.com/` — **no `/new` prefix**.

The `out/` folder is what gets deployed — it contains everything the web server needs.

### 2. Upload to Server

Upload the **contents** of the `out/` folder (not the folder itself) to:

```
/var/www/ajab/   (on server root@167.71.230.29)
```

Use Termius SFTP, or via rsync from your terminal:

```bash
rsync -avz --delete out/ root@167.71.230.29:/var/www/ajab/
```

> `--delete` removes old files on the server that no longer exist locally. Always use it so stale builds don't linger.

### 3. Done

No server restarts needed. Nginx serves the static files directly.
Visit: **http://ajab.damnetworks.com/**

---

## Server Details

| Item | Value |
|---|---|
| Provider | DigitalOcean |
| Droplet | AjabNew |
| IP | 167.71.230.29 |
| SSH | `ssh root@167.71.230.29` |
| Web root | `/var/www/ajab/` |
| Live URL | `http://ajab.damnetworks.com/` |
| Web server | Nginx |
| API | `https://ajab-admin.damnetworks.com/admin` |

---

## Nginx Config (root static site)

The live site is served at `/` from the static export. Example:

```nginx
server {
  listen 80;
  server_name ajab.damnetworks.com;

  root /var/www/ajab;
  index index.html;

  location /_next/ {
    try_files $uri =404;
  }

  location / {
    try_files $uri $uri.html $uri/ /index.html;
  }
}
```

To reload after any Nginx config change:

```bash
nginx -t && systemctl reload nginx
```

---

## Legacy builds (do not use for live deploy)

| Command | basePath | Use |
|---|---|---|
| `npm run build` / `npm run build:final` | `''` (root) | **Live** — ajab.damnetworks.com |
| `npm run build:staging-new` | `/new` | Old staging path only |
| `npm run build:ajab` | `/ajab` | Subpath deploy if ever needed |

---

## Project Structure

```
ajabshar-main/
├── app/                    # Next.js App Router pages
├── components/
│   ├── Header.tsx          # Global header (search, nav, radio icon)
│   ├── Footer.tsx
│   ├── Loader.tsx          # Fullscreen spinner (spinner.gif)
│   ├── Home/               # CLHero home page
│   ├── Songs/              # Songs list + detail pages (CL-prefix = live versions)
│   ├── Poems/
│   ├── Films/
│   ├── People/
│   ├── Reflections/
│   └── shared/             # WavyPaperPopup, GlossaryStrip, etc.
├── lib/
│   └── utils/search.ts     # Search API helpers
├── public/
│   ├── songs-assets/       # Header, Footer, song card images, notes bg
│   ├── spinner.gif         # Loading screen GIF
│   └── home-assets/        # Home page background
├── scripts/
│   └── fix-basepath-assets.mjs  # Post-build public/ sync + path patcher
├── styles/                 # Global CSS (Header.css, Footer.css, CustomStyle.css)
└── next.config.mjs         # basePath + output: export config
```

---

## Key Architecture Decisions

### Static Export (`output: 'export'`)
The app builds to plain HTML/CSS/JS files — no Node.js server needed at runtime.
Data fetching happens client-side via `useEffect` calls to the CMS API.

### basePath: `''` (root)
The live site is served at `https://ajab.damnetworks.com/` with **no URL prefix**.
`NEXT_PUBLIC_BASE_PATH` is `''` at build time (default in `next.config.mjs`).

For subpath staging builds, set `NEXT_PUBLIC_BASE_PATH` explicitly (`build:staging-new`, `build:ajab`).

### Post-build Asset Patcher
`scripts/fix-basepath-assets.mjs` (runs automatically after every build):
- Copies every file from `public/` into `out/`
- Prefixes CSS/HTML/JS asset paths when `basePath` is not root
- Writes `out/.htaccess` for SPA-style routing

For root-relative assets in code, use `withAppBasePath()` from `lib/resolveCmsAssetUrl.ts`.

### CL-prefix Convention
Files prefixed with `CL` (e.g. `CLSongDetailsPage.tsx`, `CLHero.tsx`) are the **active live versions**.
Original files without the prefix are kept as reference — do not modify them directly.

---

## Common Commands

| Task | Command |
|---|---|
| Local dev | `npm run dev` |
| Production build (live) | `npm run build` or `npm run build:final` |
| Upload to server | `rsync -avz --delete out/ root@167.71.230.29:/var/www/ajab/` |
| SSH into server | `ssh root@167.71.230.29` |
| Check Nginx config | `nginx -t` |
| Reload Nginx | `systemctl reload nginx` |
