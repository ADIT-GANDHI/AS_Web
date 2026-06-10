# Ajab Shahar — Web App

Next.js 15 (App Router) front-end for [ajab.damnetworks.com/new](http://ajab.damnetworks.com/new).

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

This does three things automatically:
1. Cleans `.next/`, `out/`, `build/` (prebuild)
2. Compiles and exports the full static site into `out/`
3. Patches all CSS `url(/...)` and HTML asset paths with `/new` prefix (postbuild — see `scripts/fix-basepath-assets.mjs`)

The `out/` folder is what gets deployed — it contains everything Nginx needs.

### 2. Upload to Server

Upload the **contents** of the `out/` folder (not the folder itself) to:

```
/var/www/html/new/   (on server root@167.71.230.29)
```

Use Termius SFTP, or via rsync from your terminal:

```bash
rsync -avz --delete out/ root@167.71.230.29:/var/www/html/new/
```

> `--delete` removes old files on the server that no longer exist locally. Always use it so stale builds don't linger.

### 3. Done

No server restarts needed. Nginx serves the static files directly.
Visit: **http://ajab.damnetworks.com/new**

---

## Server Details

| Item | Value |
|---|---|
| Provider | DigitalOcean |
| Droplet | AjabNew |
| IP | 167.71.230.29 |
| SSH | `ssh root@167.71.230.29` |
| Web root | `/var/www/html/new/` |
| Live URL | `http://ajab.damnetworks.com/new` |
| Web server | Nginx |
| Existing site | `/home/ajabUI` → port 4000 (untouched) |

---

## Nginx Config

File: `/etc/nginx/sites-enabled/ajab.damnetworks.com`

```nginx
server {
  listen 80;
  server_name ajab.damnetworks.com;

  location /new {
    root /var/www/html;
    try_files $uri $uri.html $uri/ /new/index.html;
  }

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }
}
```

To reload after any Nginx config change:
```bash
nginx -t && systemctl reload nginx
```

---

## Project Structure

```
ajabshar-main/
├── app/                    # Next.js App Router pages
├── components/
│   ├── Header.tsx          # Global header (search, nav, radio icon)
│   ├── Footer.tsx
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
│   └── home-assets/        # Home page background
├── scripts/
│   └── fix-basepath-assets.mjs  # Post-build CSS/HTML path patcher
├── styles/                 # Global CSS (Header.css, Footer.css, CustomStyle.css)
└── next.config.mjs         # basePath + output: export config
```

---

## Key Architecture Decisions

### Static Export (`output: 'export'`)
The app builds to plain HTML/CSS/JS files — no Node.js server needed at runtime.
Data fetching happens client-side via `useEffect` calls to the CMS API.

### basePath: '/new'
Because the site is served at `/new` (not root), Next.js is configured with `basePath: '/new'` in production.
This automatically prefixes all page routes and `<Link>` hrefs.

### Post-build Asset Patcher
CSS `url(/...)` and plain `<img src="/">` tags are **not** automatically handled by Next.js basePath.
- CSS is fixed by `scripts/fix-basepath-assets.mjs` (runs automatically after every build)
- New `<img>` tags added in code must use the `BP` constant:

```tsx
const BP = process.env.NEXT_PUBLIC_BASE_PATH || '';
// then:
<img src={`${BP}/songs-assets/my-image.png`} />
```

`NEXT_PUBLIC_BASE_PATH` is set to `/new` at build time (via `next.config.mjs → env`) and `''` in dev.

### CL-prefix Convention
Files prefixed with `CL` (e.g. `CLSongDetailsPage.tsx`, `CLHero.tsx`) are the **active live versions**.
Original files without the prefix are kept as reference — do not modify them directly.

---

## Common Commands

| Task | Command |
|---|---|
| Local dev | `npm run dev` |
| Production build | `npm run build` |
| Upload to server | `rsync -avz --delete out/ root@167.71.230.29:/var/www/html/new/` |
| SSH into server | `ssh root@167.71.230.29` |
| Check Nginx config | `nginx -t` |
| Reload Nginx | `systemctl reload nginx` |
| Check running processes | `pm2 list` |
