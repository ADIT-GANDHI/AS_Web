/**
 * Side-by-side PDF page 3 vs localhost People detail @ 1440px.
 * Run: node scripts/build-people-detail-comparison-1440.mjs [baseUrl] [personId]
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const PERSON_ID = process.argv[3] || '94';
const TARGET_W = 1440;
const ROOT = process.cwd();
const PDF = path.join(
  ROOT,
  'comparison-runs/run-2026-06-24/PDFs/5.People_01.05.2025.pdf'
);
const OUT_DIR = path.join(ROOT, 'comparison-runs', 'run-2026-06-30', 'People', '3_Person_Detail');
const OUT_FILE = path.join(OUT_DIR, 'comparison_people_detail_1440.png');

if (!fs.existsSync(PDF)) {
  console.error('Missing PDF:', PDF);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const pdfPng = path.join(OUT_DIR, 'pdf-page3-1440.png');
const livePng = path.join(OUT_DIR, 'live-detail-1440.png');
const liveFoldPng = path.join(OUT_DIR, 'live-detail-above-fold-1440.png');

// ── 1. PDF page 3 @ 1440px ─────────────────────────────────────────────────
const pyFile = path.join(OUT_DIR, '_extract_pdf_page3.py');
fs.writeFileSync(
  pyFile,
  `# -*- coding: utf-8 -*-
import fitz
from pathlib import Path
pdf_path = Path(${JSON.stringify(PDF)})
out_path = Path(${JSON.stringify(pdfPng)})
doc = fitz.open(pdf_path)
page = doc[2]  # page 3 — person detail
w, h = page.rect.width, page.rect.height
scale = ${TARGET_W} / w
mat = fitz.Matrix(scale, scale)
page.get_pixmap(matrix=mat, alpha=False).save(str(out_path))
print(f"saved {out_path} ({int(w*scale)}x{int(h*scale)})")
doc.close()
`
);

console.log('Extracting PDF page 3…');
execSync(`python "${pyFile}"`, { stdio: 'inherit' });

// ── 2. Localhost capture @ 1440 ──────────────────────────────────────────────
console.log(`\nCapturing ${BASE}/people/${PERSON_ID}…`);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: TARGET_W, height: 900 } });

await page.goto(`${BASE}/people/${PERSON_ID}`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

await page
  .waitForSelector('.clped-page', { timeout: 120000 })
  .catch(() => {});

await page
  .waitForFunction(() => !document.querySelector('.loader-overlay'), {
    timeout: 120000,
  })
  .catch(() => {});

await page.waitForTimeout(3000);

await page.screenshot({ path: livePng, fullPage: true });
await page.screenshot({
  path: liveFoldPng,
  clip: { x: 0, y: 0, width: TARGET_W, height: 900 },
});

await browser.close();

// ── 3. Stitch side-by-side ───────────────────────────────────────────────────
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

const left = await panelWithLabel(
  pdfPng,
  `PDF — 5.People page 3 (${TARGET_W}px wide)`
);
const right = await panelWithLabel(
  livePng,
  `localhost — /people/${PERSON_ID} (${TARGET_W}px viewport)`
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
    <text x="${totalW / 2}" y="24" text-anchor="middle" fill="#111" font-family="Arial, sans-serif" font-size="18" font-weight="700">People detail — PDF vs localhost @ ${TARGET_W}px</text>
    <text x="${totalW / 2}" y="44" text-anchor="middle" fill="#666" font-family="Arial, sans-serif" font-size="12">Generated ${new Date().toISOString().slice(0, 10)} · person id ${PERSON_ID}</text>
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
  .toFile(OUT_FILE);

console.log(`\n✅ ${OUT_FILE}`);
console.log(`   PDF panel:  ${pdfPng}`);
console.log(`   Live full:  ${livePng}`);
console.log(`   Live fold:  ${liveFoldPng}`);
