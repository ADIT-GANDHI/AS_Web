/**
 * Side-by-side PDF vs localhost for Songs listing + detail.
 * Captures screenshots at 1920px, extracts PDF frames, produces one combined image.
 * Run: node scripts/compare-songs-pdf-vs-live.mjs [baseUrl]
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const BASE = process.argv[2] || 'http://localhost:3000';
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'Comparison_Out', 'songs-pdf-vs-live');
const PDF = path.join(ROOT, 'Songs_Localhost_Comparison', '2.SongsAll_Detailpg_01.05.2025.pdf');

if (!fs.existsSync(PDF)) {
  console.error('Missing PDF:', PDF);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

// ── 1. Extract PDF pages via Python/PyMuPDF ─────────────────────────────────
const pyFile = path.join(OUT, '_extract_pdf.py');
fs.writeFileSync(
  pyFile,
  `# -*- coding: utf-8 -*-
import json, fitz
from pathlib import Path
pdf_path = Path(${JSON.stringify(PDF)})
out_dir  = Path(${JSON.stringify(OUT)})
doc = fitz.open(pdf_path)
total_pages = len(doc)
results = []
for page_idx in range(min(total_pages, 4)):
    page = doc[page_idx]
    w, h = page.rect.width, page.rect.height
    scale = 1920 / w
    mat   = fitz.Matrix(scale, scale)
    fname = f"pdf-page{page_idx+1}-full.png"
    page.get_pixmap(matrix=mat, alpha=False).save(str(out_dir / fname))
    results.append({"page": page_idx+1, "w": round(w,1), "h": round(h,1), "file": fname})
# Also produce a top-crop of page 1 (hero / listing above fold)
page0 = doc[0]
w0, h0 = page0.rect.width, page0.rect.height
scale0 = 1920 / w0
mat0   = fitz.Matrix(scale0, scale0)
page0.get_pixmap(matrix=mat0, clip=fitz.Rect(0, 0, w0, min(900, h0)), alpha=False).save(str(out_dir / "pdf-listing-above-fold.png"))
page0.get_pixmap(matrix=mat0, clip=fitz.Rect(0, 800, w0, min(1900, h0)), alpha=False).save(str(out_dir / "pdf-cards-crop.png"))
print(json.dumps({"total_pages": total_pages, "pages": results}))
doc.close()
`
);

console.log('Extracting PDF pages…');
let pdfJson = {};
try {
  pdfJson = JSON.parse(execSync(`python "${pyFile}"`, { encoding: 'utf8' }));
  console.log(`PDF has ${pdfJson.total_pages} page(s).`);
} catch (e) {
  console.warn('Python/PyMuPDF extraction failed:', e.message);
  pdfJson = { total_pages: 0, pages: [] };
}

// ── 2. Playwright — Songs Listing page ─────────────────────────────────────
console.log('\nLaunching browser…');
const browser = await chromium.launch();

// ── 2a. Songs Listing (/songs) ───────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  console.log('→ Navigating to /songs…');
  await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle', timeout: 90000 });

  // Wait for at least one song card to appear
  try {
    await page.waitForSelector('.cl-song-card, .wc-card', { timeout: 30000 });
  } catch {
    console.warn('Song cards not found; page may still be loading.');
  }
  await page.waitForTimeout(2500);

  // Full page
  await page.screenshot({ path: path.join(OUT, 'live-listing-full.png') });

  // Above-the-fold crop (header + filter bar + first row of cards)
  await page.screenshot({
    path: path.join(OUT, 'live-listing-above-fold.png'),
    clip: { x: 0, y: 0, width: 1920, height: 900 },
  });

  // Cards crop
  await page.screenshot({
    path: path.join(OUT, 'live-cards-crop.png'),
    clip: { x: 0, y: 300, width: 1920, height: 750 },
  });

  // Collect key measurements
  const live = await page.evaluate(() => {
    const header   = document.querySelector('header');
    const countRow = document.querySelector('.cl-songs-count-row, .cl-songs-count');
    const filterBar= document.querySelector('.cl-filter-bar');
    const azRow    = document.querySelector('.cl-az-row');
    const cards    = [...document.querySelectorAll('.cl-song-card')].slice(0, 3);

    const bbox = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) };
    };

    return {
      header:    bbox(header),
      countRow:  bbox(countRow),
      filterBar: bbox(filterBar),
      azRow:     bbox(azRow),
      cards: cards.map((c, i) => ({ i: i+1, ...bbox(c) })),
    };
  });

  fs.writeFileSync(path.join(OUT, 'live-listing-measurements.json'), JSON.stringify(live, null, 2));
  console.log('\nSongs Listing measurements:');
  console.log('  Header bottom:', live.header?.height);
  console.log('  Filter bar:   ', live.filterBar);
  console.log('  A-Z row:      ', live.azRow);
  console.log('  Cards (#1):   ', live.cards[0]);
  await page.close();
}

// ── 2b. Songs Detail page ────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Try to get a real song ID from the listing
  const listPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await listPage.goto(`${BASE}/songs`, { waitUntil: 'networkidle', timeout: 60000 });
  await listPage.waitForTimeout(3000);
  const firstSongHref = await listPage.evaluate(() => {
    const a = document.querySelector('a[href*="/songs/details/"]');
    return a ? a.getAttribute('href') : null;
  });
  await listPage.close();

  let detailUrl = `${BASE}/songs/details/252`;
  if (firstSongHref) {
    const id = firstSongHref.split('/').pop();
    if (id && id !== '0') detailUrl = `${BASE}/songs/details/${id}`;
  }

  console.log('\n→ Navigating to Song Detail:', detailUrl);
  await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(4000);

  await page.screenshot({ path: path.join(OUT, 'live-detail-full.png') });
  await page.screenshot({
    path: path.join(OUT, 'live-detail-above-fold.png'),
    clip: { x: 0, y: 0, width: 1920, height: 900 },
  });

  const detailMeasurements = await page.evaluate(() => {
    const header    = document.querySelector('header');
    const titleEl   = document.querySelector('.csd-title, .song-detail-title, h1');
    const singerEl  = document.querySelector('.csd-singer, .csd-header-singer');
    const locationEl= document.querySelector('.csd-location, .csd-header-meta');
    const glossaryEl= document.querySelector('.gs-strip, .glossary-strip');

    const bbox = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height), text: (el.textContent || '').trim().slice(0, 80) };
    };

    return {
      header:   bbox(header),
      title:    bbox(titleEl),
      singer:   bbox(singerEl),
      location: bbox(locationEl),
      glossary: bbox(glossaryEl),
    };
  });

  fs.writeFileSync(path.join(OUT, 'live-detail-measurements.json'), JSON.stringify(detailMeasurements, null, 2));
  console.log('\nSong Detail measurements:');
  console.log('  Title:   ', detailMeasurements.title);
  console.log('  Singer:  ', detailMeasurements.singer);
  console.log('  Location:', detailMeasurements.location);
  await page.close();
}

await browser.close();

// ── 3. Build combined comparison image ───────────────────────────────────────
console.log('\nBuilding comparison image…');

async function buildSideBySide(pdfFile, liveFile, label, outFile) {
  if (!fs.existsSync(pdfFile) || !fs.existsSync(liveFile)) {
    console.warn(`Skipping ${label} — missing files`);
    return;
  }
  const TARGET_H = 900;
  const GAP      = 20;

  const pdfMeta  = await sharp(pdfFile).metadata();
  const liveMeta = await sharp(liveFile).metadata();

  const pdfW  = Math.round((pdfMeta.width / pdfMeta.height) * TARGET_H);
  const liveW = Math.round((liveMeta.width / liveMeta.height) * TARGET_H);

  const [pdfBuf, liveBuf] = await Promise.all([
    sharp(pdfFile).resize(pdfW, TARGET_H).toBuffer(),
    sharp(liveFile).resize(liveW, TARGET_H).toBuffer(),
  ]);

  const totalW = pdfW + GAP + liveW;

  await sharp({
    create: { width: totalW, height: TARGET_H, channels: 3, background: { r: 26, g: 26, b: 26 } },
  })
    .composite([
      { input: pdfBuf,  top: 0, left: 0 },
      { input: liveBuf, top: 0, left: pdfW + GAP },
    ])
    .toFile(outFile);

  console.log('  Saved:', path.relative(ROOT, outFile));
}

const pdfListingFile = path.join(OUT, 'pdf-listing-above-fold.png');
const liveListingFile = path.join(OUT, 'live-listing-above-fold.png');
const pdfCardsFile   = path.join(OUT, 'pdf-cards-crop.png');
const liveCardsFile  = path.join(OUT, 'live-cards-crop.png');
const pdfDetailFile  = pdfJson.total_pages >= 2 ? path.join(OUT, 'pdf-page2-full.png') : null;
const liveDetailFile = path.join(OUT, 'live-detail-above-fold.png');

await buildSideBySide(
  pdfListingFile,
  liveListingFile,
  'Songs Listing (above fold)',
  path.join(OUT, 'comparison-listing-fold.png')
);
await buildSideBySide(
  pdfCardsFile,
  liveCardsFile,
  'Songs Cards',
  path.join(OUT, 'comparison-cards.png')
);
if (pdfDetailFile && fs.existsSync(pdfDetailFile)) {
  await buildSideBySide(
    pdfDetailFile,
    liveDetailFile,
    'Song Detail',
    path.join(OUT, 'comparison-detail.png')
  );
}

// ── 4. Summary ────────────────────────────────────────────────────────────────
console.log('\n=== Songs PDF vs Live @ 1920 ===');
console.log('Output folder:', OUT);
console.log('Files generated:');
fs.readdirSync(OUT).filter(f => f.endsWith('.png')).forEach(f => console.log('  ', f));
