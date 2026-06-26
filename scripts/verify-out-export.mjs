/**
 * Smoke-test static export in out/ (served at production basePath).
 * Run after: npm run build
 */
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'out');
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const PORT = 4173;

const p = (path) => (BASE ? `${BASE}${path}` : path);

const CHECKS = [
  p('/poems.html'),
  p('/poems/1.html'),
  p('/radio.html'),
  p('/songs.html'),
  p('/index.html'),
  p('/poems-bg.png'),
  p('/poem-detail-bg.png'),
  p('/radio-page-bg.png'),
  p('/radio-playlist-bg.png'),
  p('/radio-player-strip.png'),
  p('/poem-notes-glossary.png'),
  p('/related-poem-handwritten.png'),
  p('/spinner.gif'),
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

function resolveFile(urlPath) {
  if (BASE && !urlPath.startsWith(BASE)) return null;
  let rel = BASE ? urlPath.slice(BASE.length) : urlPath;
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
    const nextPrefix = BASE ? `${BASE}/_next/` : '/_next/';
    if (!html.includes(nextPrefix)) {
      failures.push(`${check} → missing ${nextPrefix} assets`);
    }
    if (BASE && html.includes('src="/') && !html.includes(`src="${BASE}/`)) {
      failures.push(`${check} → unprefixed src="/" in HTML (expected ${BASE}/)`);
    }
    if (!BASE && html.includes('/new/_next/')) {
      failures.push(`${check} → stale /new/ paths in HTML`);
    }
  }
}

const cssDir = path.join(OUT, '_next', 'static', 'css');
const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));
const poemsCss = cssFiles
  .map((f) => fs.readFileSync(path.join(cssDir, f), 'utf8'))
  .find((c) => c.includes('clp-page-root-wrap'));
if (!poemsCss) failures.push('CSS: missing clp-page-root-wrap styles');
else {
  const poemsBgUrl = BASE ? `url(${BASE}/poems-bg.png)` : 'url(/poems-bg.png)';
  if (!poemsCss.includes(poemsBgUrl)) {
    failures.push(`CSS: poems-bg.png not at expected path (${poemsBgUrl})`);
  }
}
if (poemsCss && !poemsCss.includes('#f0f2ff')) {
  failures.push('CSS: missing poems background color #f0f2ff');
}

const footerCss = cssFiles
  .map((f) => fs.readFileSync(path.join(cssDir, f), 'utf8'))
  .find((c) => c.includes('footer-bg'));
const footerPng = BASE
  ? `url(${BASE}/songs-assets/Footer.png)`
  : 'url(/songs-assets/Footer.png)';
if (footerCss && !footerCss.includes(footerPng)) {
  failures.push(`CSS: Footer.png not at expected path (${footerPng})`);
}

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
  const double = BASE ? `${BASE}${BASE}/` : '/new/new/';
  for (const file of walkJs(chunksRoot)) {
    const js = fs.readFileSync(file, 'utf8');
    if (js.includes(double)) {
      failures.push(`JS double basePath: ${path.relative(OUT, file)}`);
    }
  }
  const filterPath = BASE
    ? `${BASE}/songs-assets/song_filter_opaque.svg`
    : '/songs-assets/song_filter_opaque.svg';
  const filterChunk = walkJs(chunksRoot).find((f) =>
    fs.readFileSync(f, 'utf8').includes('song_filter_opaque')
  );
  if (filterChunk) {
    const js = fs.readFileSync(filterChunk, 'utf8');
    if (!js.includes(filterPath)) {
      failures.push(`JS: song_filter_opaque.svg missing expected path ${filterPath}`);
    }
  }
  const spinnerPath = BASE ? `${BASE}/spinner.gif` : '/spinner.gif';
  const hasSpinner = walkJs(chunksRoot).some((f) =>
    fs.readFileSync(f, 'utf8').includes(spinnerPath)
  );
  if (!hasSpinner) failures.push(`JS: loader spinner missing path ${spinnerPath}`);
}

server.close();

if (failures.length) {
  console.error('❌ out/ export verification failed:');
  failures.forEach((f) => console.error(`   - ${f}`));
  process.exit(1);
}

const baseLabel = BASE || '(root)';
console.log(`✅ out/ export OK — ${CHECKS.length} routes/assets, poems/footer CSS, basePath ${baseLabel}`);
