/**
 * Thorough static asset check for out/ before upload.
 */
import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'out');
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const CRITICAL_ASSETS = [
  'songs-assets/Header.png',
  'songs-assets/song_filter_opaque.svg',
  'songs-assets/songs-bg-composite-mirror.png',
  'songs-assets/radio.png',
  'songs-assets/radio-pink.png',
  'logo.svg',
  'spinner.gif',
  'glossary-pill-bg.png',
  'poems-bg.png',
  'poem-detail-bg.png',
  'reflections_mainpage.png',
  'reflections_detail.png',
  'people_mainpage.png',
  'people_detail.png',
  'film-page-bg.png',
  'film_detail.png',
  'radio-page-bg.png',
  'radio-playlist-bg.png',
  'radio-player-strip.png',
  'footer-top-v2.svg',
  'news-white-bg.png',
  'about-page-bg.png',
  'home-assets/home_bg.png',
  'home-assets/home_tile_with_both_waves.png',
  'home-assets/home_tile_lower_wave.png',
  'home-assets/home_tile_upper_wave.png',
];

const CRITICAL_HTML = [
  'index.html',
  'songs.html',
  'poems.html',
  'reflections.html',
  'people.html',
  'films.html',
  'radio.html',
  'glossary.html',
  'about.html',
  'ajab-news.html',
  'searche.html',
  'songs/details/260.html',
  'poems/305.html',
  'reflections/details/63.html',
  'people/p1.html',
  'films/details/38.html',
];

function sizeOf(rel) {
  const p = path.join(OUT, rel);
  if (!fs.existsSync(p)) return null;
  return fs.statSync(p).size;
}

const failures = [];

for (const rel of CRITICAL_ASSETS) {
  const sz = sizeOf(rel);
  if (sz == null) failures.push(`missing asset: ${rel}`);
  else if (sz < 50) failures.push(`suspicious tiny asset: ${rel} (${sz} bytes)`);
}

for (const rel of CRITICAL_HTML) {
  const p = path.join(OUT, rel);
  if (!fs.existsSync(p)) failures.push(`missing page: ${rel}`);
}

function walkJs(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walkJs(full));
    else if (entry.name.endsWith('.js')) files.push(full);
  }
  return files;
}

for (const file of walkJs(path.join(OUT, '_next', 'static', 'chunks'))) {
  const js = fs.readFileSync(file, 'utf8');
  if (js.includes('/new/new/')) {
    failures.push(`double basePath in ${path.relative(OUT, file)}`);
    break;
  }
}

const cssDir = path.join(OUT, '_next', 'static', 'css');
for (const cssFile of fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'))) {
  const css = fs.readFileSync(path.join(cssDir, cssFile), 'utf8');
  const badUrls = [...css.matchAll(/url\((['"]?)\/(?!new\/)[^)]+\)/g)];
  if (badUrls.length) {
    failures.push(`unprefixed CSS url in ${cssFile}: ${badUrls[0][0].slice(0, 60)}`);
    break;
  }
}

function dirSize(dir) {
  let total = 0;
  let files = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = dirSize(full);
      total += sub.bytes;
      files += sub.files;
    } else {
      total += fs.statSync(full).size;
      files++;
    }
  }
  return { bytes: total, files };
}

const stats = dirSize(OUT);

if (failures.length) {
  console.error('❌ Asset verification failed:');
  failures.forEach((f) => console.error(`   - ${f}`));
  process.exit(1);
}

console.log('✅ Critical assets and pages present');
console.log(`   out/ size: ${(stats.bytes / 1024 / 1024).toFixed(1)} MB, ${stats.files} files`);
console.log(`   upload target: server /var/www/ajab/ (contents of out/, not the folder)`);
console.log(`   live base URL: https://ajab.damnetworks.com${BASE || '/'}`);
