/**
 * Side-by-side PDF vs localhost — Films detail @ 1440px.
 * PDF page 3 = Film tab, page 4 = Episodes tab (6.FilmMain+Detail_01.05.2025.pdf).
 * Run: node scripts/build-film-detail-comparison-1440.mjs [baseUrl] [filmId]
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const FILM_ID = process.argv[3] || '1';
const TARGET_W = 1440;
const ROOT = process.cwd();
const PDF = path.join(
  ROOT,
  'comparison-runs/run-2026-06-24/PDFs/6.FilmMain+Detail_01.05.2025.pdf'
);
const OUT_DIR = path.join(ROOT, 'Films_Localhost_Comparison', '2_Film_Detail');
const DATE = new Date().toISOString().slice(0, 10);

if (!fs.existsSync(PDF)) {
  console.error('Missing PDF:', PDF);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

async function extractPdfPage(pageIndex, outPath) {
  const pyFile = path.join(OUT_DIR, `_extract_pdf_page${pageIndex}.py`);
  fs.writeFileSync(
    pyFile,
    `# -*- coding: utf-8 -*-
import fitz
from pathlib import Path
pdf_path = Path(${JSON.stringify(PDF)})
out_path = Path(${JSON.stringify(outPath)})
doc = fitz.open(pdf_path)
page = doc[${pageIndex}]
w, h = page.rect.width, page.rect.height
scale = ${TARGET_W} / w
mat = fitz.Matrix(scale, scale)
page.get_pixmap(matrix=mat, alpha=False).save(str(out_path))
print(f"saved {out_path} ({int(w*scale)}x{int(h*scale)})")
doc.close()
`
  );
  execSync(`python "${pyFile}"`, { stdio: 'inherit' });
}

async function panelWithLabel(src, label) {
  const img = sharp(src);
  const meta = await img.metadata();
  const w = meta.width || TARGET_W;
  const h = meta.height || 900;

  const labelSvg = Buffer.from(`
    <svg width="${w}" height="40">
      <rect width="100%" height="100%" fill="#1a1a1a"/>
      <text x="16" y="26" fill="#ffffff" font-family="Arial, sans-serif" font-size="15">${label}</text>
    </svg>
  `);

  return sharp({
    create: { width: w, height: h + 40, channels: 4, background: '#ffffff' },
  })
    .composite([
      { input: labelSvg, top: 0, left: 0 },
      { input: await img.png().toBuffer(), top: 40, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function stitchComparison(leftPath, rightPath, title, outFile) {
  const left = await panelWithLabel(leftPath, `PDF — ${title} (${TARGET_W}px)`);
  const right = await panelWithLabel(
    rightPath,
    `localhost — /films/details/${FILM_ID} (${TARGET_W}px)`
  );

  const leftMeta = await sharp(left).metadata();
  const rightMeta = await sharp(right).metadata();
  const colW = Math.max(leftMeta.width || TARGET_W, rightMeta.width || TARGET_W);
  const colH = Math.max(leftMeta.height || 0, rightMeta.height || 0);
  const gap = 20;
  const headerH = 56;
  const totalW = colW * 2 + gap;
  const totalH = colH + headerH;

  async function padPanel(buf) {
    const m = await sharp(buf).metadata();
    if ((m.height || 0) >= colH && (m.width || 0) >= colW) return buf;
    return sharp({
      create: { width: colW, height: colH, channels: 4, background: '#f0f0f0' },
    })
      .composite([{ input: buf, top: 40, left: 0 }])
      .png()
      .toBuffer();
  }

  const leftPad = await padPanel(left);
  const rightPad = await padPanel(right);

  const titleSvg = Buffer.from(`
    <svg width="${totalW}" height="${headerH}">
      <rect width="100%" height="100%" fill="#f4f4f4"/>
      <text x="${totalW / 2}" y="24" text-anchor="middle" fill="#111" font-family="Arial, sans-serif" font-size="18" font-weight="700">Films detail — ${title} — PDF vs localhost @ ${TARGET_W}px</text>
      <text x="${totalW / 2}" y="44" text-anchor="middle" fill="#666" font-family="Arial, sans-serif" font-size="12">Generated ${DATE} · film id ${FILM_ID}</text>
    </svg>
  `);

  await sharp({
    create: { width: totalW, height: totalH, channels: 4, background: '#f4f4f4' },
  })
    .composite([
      { input: titleSvg, top: 0, left: 0 },
      { input: leftPad, top: headerH, left: 0 },
      { input: rightPad, top: headerH, left: colW + gap },
    ])
    .png()
    .toFile(outFile);

  console.log(`✅ ${outFile}`);
}

async function captureLocalhost(tab) {
  const suffix = tab === 'episodes' ? 'episodes' : 'film';
  const livePng = path.join(OUT_DIR, `live-${suffix}-1440.png`);
  const liveFoldPng = path.join(OUT_DIR, `live-${suffix}-above-fold-1440.png`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: TARGET_W, height: 900 } });

  await page.goto(`${BASE}/films/details/${FILM_ID}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });

  await page.waitForSelector('.clfd-header-title', { timeout: 120000 }).catch(() => {});
  await page
    .waitForFunction(() => !document.querySelector('.loader-overlay'), { timeout: 120000 })
    .catch(() => {});

  if (tab === 'episodes') {
    const episodesTab = page.getByRole('button', { name: 'Episodes' });
    if ((await episodesTab.count()) > 0) {
      await episodesTab.click();
      await page.waitForTimeout(2000);
    }
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: livePng, fullPage: true });
  await page.screenshot({
    path: liveFoldPng,
    clip: { x: 0, y: 0, width: TARGET_W, height: 900 },
  });

  await browser.close();
  return { livePng, liveFoldPng };
}

// ── Film tab (PDF page 3 = index 2) ─────────────────────────────────────────
const pdfFilmPng = path.join(OUT_DIR, 'pdf-film-tab-1440.png');
console.log('Extracting PDF page 3 (Film tab)…');
await extractPdfPage(2, pdfFilmPng);

console.log(`\nCapturing ${BASE}/films/details/${FILM_ID} (Film tab)…`);
const filmLive = await captureLocalhost('film');
await stitchComparison(
  pdfFilmPng,
  filmLive.livePng,
  'Film tab',
  path.join(OUT_DIR, 'comparison_film_tab_1440.png')
);
await stitchComparison(
  pdfFilmPng,
  filmLive.liveFoldPng,
  'Film tab (above fold)',
  path.join(OUT_DIR, 'comparison_film_tab_above_fold_1440.png')
);

// ── Episodes tab (PDF page 4 = index 3) ─────────────────────────────────────
const pdfEpisodesPng = path.join(OUT_DIR, 'pdf-episodes-tab-1440.png');
console.log('\nExtracting PDF page 4 (Episodes tab)…');
await extractPdfPage(3, pdfEpisodesPng);

console.log(`\nCapturing ${BASE}/films/details/${FILM_ID} (Episodes tab)…`);
const episodesLive = await captureLocalhost('episodes');
await stitchComparison(
  pdfEpisodesPng,
  episodesLive.livePng,
  'Episodes tab',
  path.join(OUT_DIR, 'comparison_episodes_tab_1440.png')
);
await stitchComparison(
  pdfEpisodesPng,
  episodesLive.liveFoldPng,
  'Episodes tab (above fold)',
  path.join(OUT_DIR, 'comparison_episodes_tab_above_fold_1440.png')
);

console.log(`\nDone. Output folder: ${OUT_DIR}`);
