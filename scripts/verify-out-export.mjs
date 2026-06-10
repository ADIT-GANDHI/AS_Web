/**
 * Smoke-test static export in out/ (served at /new like production).
 * Run after: npm run build
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'out');
const BASE = '/new';
const PORT = 4173;

const CHECKS = [
  '/new/poems.html',
  '/new/poems/1.html',
  '/new/radio.html',
  '/new/songs.html',
  '/new/index.html',
  '/new/poems-bg.png',
  '/new/poem-detail-bg.png',
  '/new/radio-page-bg.png',
  '/new/radio-playlist-bg.png',
  '/new/radio-player-strip.png',
  '/new/poem-notes-glossary.png',
  '/new/related-poem-handwritten.png',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

function resolveFile(urlPath) {
  if (!urlPath.startsWith(BASE)) return null;
  let rel = urlPath.slice(BASE.length);
  if (rel === '' || rel === '/') rel = '/index.html';
  if (rel.endsWith('/')) rel += 'index.html';
  if (!path.extname(rel)) rel += '.html';
  const file = path.join(OUT, rel.replace(/^\//, '').replace(/\//g, path.sep));
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  return null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url?.split('?')[0] ?? '');
  if (!file) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(file);
  res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(PORT, resolve));

const failures = [];
for (const check of CHECKS) {
  const res = await fetch(`http://127.0.0.1:${PORT}${check}`);
  if (!res.ok) {
    failures.push(`${check} → HTTP ${res.status}`);
    continue;
  }
  if (check.endsWith('.html')) {
    const html = await res.text();
    if (html.includes('src="/') && !html.includes('src="/new/')) {
      failures.push(`${check} → unprefixed src="/" in HTML`);
    }
    if (check.includes('poems') && !html.includes('/new/_next/')) {
      failures.push(`${check} → missing /new/_next/ assets`);
    }
  }
}

const cssDir = path.join(OUT, '_next', 'static', 'css');
const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));
const poemsCss = cssFiles
  .map((f) => fs.readFileSync(path.join(cssDir, f), 'utf8'))
  .find((c) => c.includes('clp-page-root-wrap'));
if (!poemsCss) failures.push('CSS: missing clp-page-root-wrap styles');
else if (!poemsCss.includes('url(/new/poems-bg.png)')) {
  failures.push('CSS: poems-bg.png not prefixed with /new');
}
if (poemsCss && !poemsCss.includes('#f0f2ff')) {
  failures.push('CSS: missing poems background color #f0f2ff');
}

/** Catch double basePath in JS (e.g. /new/new/songs-assets/… breaks filter wavy SVG). */
function walkJs(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walkJs(full));
    else if (entry.name.endsWith('.js')) files.push(full);
  }
  return files;
}
const chunksRoot = path.join(OUT, '_next', 'static', 'chunks');
if (fs.existsSync(chunksRoot)) {
  for (const file of walkJs(chunksRoot)) {
    const js = fs.readFileSync(file, 'utf8');
    if (js.includes('/new/new/')) {
      failures.push(`JS double basePath: ${path.relative(OUT, file)}`);
    }
  }
}
if (fs.existsSync(path.join(OUT, 'songs-assets', 'song_filter_opaque.svg'))) {
  const filterChunk = walkJs(chunksRoot).find((f) => {
    const js = fs.readFileSync(f, 'utf8');
    return js.includes('song_filter_opaque');
  });
  if (filterChunk) {
    const js = fs.readFileSync(filterChunk, 'utf8');
    if (!js.includes('/new/songs-assets/song_filter_opaque.svg')) {
      failures.push('JS: song_filter_opaque.svg missing correct /new/ path');
    }
    if (js.includes('/new/new/songs-assets/song_filter_opaque.svg')) {
      failures.push('JS: song_filter_opaque.svg has doubled /new/new/ path');
    }
  }
}

server.close();

if (failures.length) {
  console.error('❌ out/ export verification failed:');
  failures.forEach((f) => console.error(`   - ${f}`));
  process.exit(1);
}

console.log(`✅ out/ export OK — ${CHECKS.length} routes/assets, poems CSS, basePath /new`);
