/**
 * Post-build: ensure all public/ assets exist in out/, prefix CSS/HTML/JS asset
 * paths with basePath (/new legacy, or '' for ajab.damnetworks.com root).
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  copyFileSync,
  cpSync,
  mkdirSync,
  existsSync,
} from 'fs';
import { join, extname, dirname, relative } from 'path';

const ROOT = process.cwd();
const PUBLIC_DIR = join(ROOT, 'public');
const OUT_DIR = join(ROOT, 'out');
/** Match next.config basePath — '' root, '/ajab' live deploy, '/new' legacy. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/new';
const BASE_SEG = BASE_PATH.replace(/^\//, '');
const ESCAPED_BASE_SEG = BASE_SEG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const NOT_BASE_PATH = BASE_SEG ? `(?!${ESCAPED_BASE_SEG}/)` : '(?!/)';

/** Root-relative public asset prefixes referenced in CSS/JS (not page routes). */
const ASSET_PREFIXES = [
  'home-assets/',
  'songs-assets/',
  'songs-bg-marble-mirror.png',
  'songs-bg-triangles-tile.png',
  'songs-bg-tamburas-tile.png',
  'songs-bg-composite-mirror.png',
  'news-assets/',
  'people/',
  'fonts/',
  'placeholder.svg',
  'placeholder-logo.svg',
  'radio-page-bg.png',
  'radio-thumb-sample.png',
  'radio-player-controls.svg',
  'radio-bubble-left.svg',
  'radio-bubble-right.svg',
  'radio-player-bar.svg',
  'about-page-bg.png',
  'about-wavy-center.svg',
  'reflections-mainpage.webp',
  'reflections_mainpage.png',
  'reflections_mainpage-original.png',
  'reflections_detail.png',
  'reflections_detail-original.png',
  'film-page-bg-original.png',
  'film-page-bg.png',
  'film_detail.png',
  'TN-About-Basavalingaiah-Hiremath.jpg',
  'reflections-mainpage-top.png',
  'reflections-bg-repeat-mirror.png',
  'reflections-marble-mirror.png',
  'reflections-bg-marble-mirror.png',
  'background-ajab-news.png',
  'film-page-bg.svg',
  'people_mainpage.png',
  'people_mainpage-original.png',
  'people_detail.png',
  'poems-bg.png',
  'poem-detail-bg.png',
  'poem-notes-glossary.png',
  'related-poem-handwritten.png',
  'glossary-pill-bg.png',
  'poems-rectangle.svg',
  'news-white-bg.png',
  'radio-playlist-bg.png',
  'radio-playlist-pattern-tile.png',
  'radio-playlist-sidebar-tile.png',
  'radio-player-strip.png',
  'radio-pink.png',
  'news-border.svg',
  'ajab-news-logo.svg',
  'footer-top-v2.svg',
  'footer-black-bg',
  'song-container-bg-v2.svg',
  'song-bg-full.svg',
  'tree.svg',
  'logo.svg',
  'k_logo.svg',
  'spinner.gif',
  'header-bg.svg',
  'layout-bg.svg',
  'search-icon.svg',
  'radio.svg',
  'radio-v2.svg',
];

function walk(dir) {
  const entries = readdirSync(dir);
  let files = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files = files.concat(walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

/** Copy every file from public/ into out/ (keeps CMS-static bundle complete for upload). */
function syncPublicToOut() {
  let copied = 0;
  let skipped = 0;
  for (const file of walk(PUBLIC_DIR)) {
    const rel = relative(PUBLIC_DIR, file).replace(/\\/g, '/');
    const dest = join(OUT_DIR, rel);
    mkdirSync(dirname(dest), { recursive: true });
    try {
      const srcStat = statSync(file);
      const destStat = statSync(dest);
      if (destStat.size === srcStat.size && destStat.mtimeMs >= srcStat.mtimeMs) {
        skipped++;
        continue;
      }
    } catch {
      /* dest missing */
    }
    copyFileSync(file, dest);
    copied++;
  }
  return { copied, skipped };
}

function fixCssUrls(content) {
  if (!BASE_SEG) return content;
  return content.replace(
    new RegExp(`url\\((['"]?)/${NOT_BASE_PATH}`, 'g'),
    `url($1${BASE_PATH}/`
  );
}

function fixHtmlSrc(content) {
  if (!BASE_SEG) return content;
  return content
    .replace(new RegExp(`src="/${NOT_BASE_PATH}`, 'g'), `src="${BASE_PATH}/`)
    .replace(
      new RegExp(`href="/${NOT_BASE_PATH}([^"]*\\.(css|js|png|jpg|jpeg|svg|webp|gif|ico|woff|woff2|ttf))`, 'g'),
      `href="${BASE_PATH}/$1`
    );
}

/** Prefix quoted root-relative asset paths in JS chunks (mocks, inline strings). */
function fixJsAssetStrings(content) {
  let out = content;
  for (const prefix of ASSET_PREFIXES) {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patch = (quote) => {
      const re = new RegExp(`${quote}/${NOT_BASE_PATH}(${escaped})`, 'g');
      out = out.replace(re, (match, asset, offset, str) => {
        const before = str.slice(Math.max(0, offset - 28), offset);
        // Webpack often emits `${BP}/asset` as concat("/ajab","/asset") — do not prefix twice.
        if (
          (BASE_SEG && new RegExp(`/${ESCAPED_BASE_SEG}['"],\\s*$`).test(before)) ||
          (BASE_SEG && new RegExp(`concat\\(["']/${ESCAPED_BASE_SEG}["'],\\s*$`).test(before))
        ) {
          return match;
        }
        return quote + BASE_PATH + '/' + asset;
      });
    };
    patch('"');
    patch("'");
  }
  return out;
}

function verifyOutAssets() {
  const missing = [];
  for (const file of walk(PUBLIC_DIR)) {
    const rel = relative(PUBLIC_DIR, file).replace(/\\/g, '/');
    const dest = join(OUT_DIR, rel);
    if (!existsSync(dest)) {
      missing.push(rel);
    }
  }
  return missing;
}

/**
 * Next.js HTML references dynamic-route chunks as %5Bid%5D while export writes
 * literal [id] folders. Nginx decodes URLs; mirror encoded dirs for all servers.
 */
function mirrorEncodedBracketDirs() {
  const chunksRoot = join(OUT_DIR, '_next', 'static', 'chunks');
  if (!existsSync(chunksRoot)) return 0;

  let mirrored = 0;
  function walkDir(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (!statSync(full).isDirectory()) continue;
      const bracketMatch = entry.match(/^\[(.+)\]$/);
      if (bracketMatch) {
        const encodedName = encodeURIComponent(`[${bracketMatch[1]}]`);
        const dest = join(dir, encodedName);
        cpSync(full, dest, { recursive: true, force: true });
        mirrored++;
      }
      walkDir(full);
    }
  }
  walkDir(chunksRoot);
  return mirrored;
}

const sync = syncPublicToOut();
const allFiles = walk(OUT_DIR);

let cssCount = 0;
let htmlCount = 0;
let jsCount = 0;

for (const file of allFiles) {
  const ext = extname(file);

  if (ext === '.css') {
    const original = readFileSync(file, 'utf-8');
    const fixed = fixCssUrls(original);
    if (fixed !== original) {
      writeFileSync(file, fixed, 'utf-8');
      cssCount++;
    }
  }

  if (ext === '.html') {
    const original = readFileSync(file, 'utf-8');
    const fixed = fixHtmlSrc(original);
    if (fixed !== original) {
      writeFileSync(file, fixed, 'utf-8');
      htmlCount++;
    }
  }

  if (ext === '.js') {
    const original = readFileSync(file, 'utf-8');
    const fixed = fixJsAssetStrings(original);
    if (fixed !== original) {
      writeFileSync(file, fixed, 'utf-8');
      jsCount++;
    }
  }
}

const missing = verifyOutAssets();
const mirroredDirs = mirrorEncodedBracketDirs();

console.log(
  `✅ fix-basepath-assets: synced public→out (${sync.copied} copied, ${sync.skipped} up-to-date); patched ${cssCount} CSS, ${htmlCount} HTML, ${jsCount} JS; mirrored ${mirroredDirs} encoded chunk dir(s)`,
);
if (missing.length) {
  console.error(`❌ ${missing.length} public files still missing from out/:`);
  missing.slice(0, 20).forEach((m) => console.error(`   - ${m}`));
  process.exit(1);
} else {
  console.log(`✅ All ${walk(PUBLIC_DIR).length} public assets present in out/`);
}

// Deploy target: root .htaccess for ajabuifinal; subpath template for /ajab, /new, etc.
const htaccessDest = join(OUT_DIR, '.htaccess');
if (BASE_PATH === '') {
  const htaccessSrc = join(PUBLIC_DIR, '.htaccess.root');
  if (existsSync(htaccessSrc)) {
    copyFileSync(htaccessSrc, htaccessDest);
    console.log('✅ Wrote out/.htaccess (root)');
  }
} else {
  const htaccessTemplate = join(PUBLIC_DIR, '.htaccess');
  if (existsSync(htaccessTemplate)) {
    const htaccess = readFileSync(htaccessTemplate, 'utf-8').replace(/\/new/g, BASE_PATH);
    writeFileSync(htaccessDest, htaccess);
    console.log(`✅ Wrote out/.htaccess (basePath ${BASE_PATH})`);
  }
}
