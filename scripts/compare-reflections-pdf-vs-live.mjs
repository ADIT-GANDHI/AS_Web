/**
 * Side-by-side PDF vs localhost for Reflections listing (intro + cards).
 * Measurement + screenshots only — no app changes.
 * Run: node scripts/compare-reflections-pdf-vs-live.mjs [baseUrl]
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = process.argv[2] || 'http://localhost:3000';
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'Comparison_Out', 'reflections-pdf-vs-live');
const PDF = path.join(ROOT, 'Reflections_Localhost_Comparison', '4.Reflection_01.05.2025.pdf');

if (!fs.existsSync(PDF)) {
  console.error('Missing PDF:', PDF);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

const pyFile = path.join(OUT, '_extract_pdf.py');
fs.writeFileSync(
  pyFile,
  `# -*- coding: utf-8 -*-
import json, fitz
from pathlib import Path
pdf_path = Path(${JSON.stringify(PDF)})
out_dir = Path(${JSON.stringify(OUT)})
doc = fitz.open(pdf_path)
page = doc[0]
w, h = page.rect.width, page.rect.height
scale = 1920 / w
mat = fitz.Matrix(scale, scale)
page.get_pixmap(matrix=mat, alpha=False).save(str(out_dir / "pdf-page1-full.png"))
page.get_pixmap(matrix=mat, clip=fitz.Rect(0, 0, w, min(520, h)), alpha=False).save(str(out_dir / "pdf-hero-crop.png"))
page.get_pixmap(matrix=mat, clip=fitz.Rect(0, 380, w, min(1100, h)), alpha=False).save(str(out_dir / "pdf-cards-crop.png"))
blocks = []
for b in page.get_text("dict")["blocks"]:
    if b.get("type") != 0:
        continue
    for line in b.get("lines", []):
        text = "".join(s["text"] for s in line.get("spans", [])).strip()
        if not text:
            continue
        xs = [s["bbox"][0] for s in line["spans"]]
        ys = [s["bbox"][1] for s in line["spans"]]
        xe = [s["bbox"][2] for s in line["spans"]]
        ye = [s["bbox"][3] for s in line["spans"]]
        blocks.append({
            "text": text[:140],
            "x0": round(min(xs), 1),
            "y0": round(min(ys), 1),
            "x1": round(max(xe), 1),
            "y1": round(max(ye), 1),
            "w": round(max(xe) - min(xs), 1),
            "h": round(max(ye) - min(ys), 1),
        })
intro = [b for b in blocks if "Through mediums" in b["text"]]
if not intro:
    intro = [b for b in blocks if "ponder on the key" in b["text"]]
count = [b for b in blocks if "Reflections" in b["text"] and len(b["text"]) < 30]
cards = [b for b in blocks if 680 < b["y0"] < 1080 and len(b["text"]) > 12][:8]
print(json.dumps({"pdfSize": {"w": round(w, 1), "h": round(h, 1)}, "intro": intro, "count": count[:4], "cards": cards}, indent=2))
doc.close()
`
);

const pdfJson = JSON.parse(execSync(`python "${pyFile}"`, { encoding: 'utf8' }));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
await page.goto(`${BASE}/reflections`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForSelector('.clr-intro', { timeout: 60000 });

const headerBottom = await page.evaluate(
  () => document.querySelector('header')?.getBoundingClientRect().bottom ?? 191
);

await page.screenshot({ path: path.join(OUT, 'live-page1-full.png') });
await page.screenshot({
  path: path.join(OUT, 'live-hero-crop.png'),
  clip: { x: 0, y: 0, width: 1920, height: Math.round(headerBottom + 320) },
});
await page.screenshot({
  path: path.join(OUT, 'live-cards-crop.png'),
  clip: { x: 0, y: 340, width: 1920, height: 780 },
});

const live = await page.evaluate(() => {
  const intro = document.querySelector('.clr-intro');
  const count = document.querySelector('.cl-songs-count');
  const cards = [...document.querySelectorAll('.clr-card')].slice(0, 3);
  const ir = intro?.getBoundingClientRect();
  const cr = count?.getBoundingClientRect();
  return {
    headerBottom: document.querySelector('header')?.getBoundingClientRect().bottom ?? 0,
    intro: ir
      ? {
          left: Math.round(ir.left),
          top: Math.round(ir.top),
          width: Math.round(ir.width),
          height: Math.round(ir.height),
        }
      : null,
    count: cr ? { left: Math.round(cr.left), top: Math.round(cr.top) } : null,
    cards: cards.map((c, i) => {
      const r = c.getBoundingClientRect();
      return {
        i: i + 1,
        left: Math.round(r.left),
        top: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
    }),
  };
});

await browser.close();

const pdfIntro = pdfJson.intro?.[0];
const pdfCount = pdfJson.count?.[0];
const report = {
  pdf: pdfJson,
  live,
  delta: {
    introLeftPx: pdfIntro ? live.intro.left - pdfIntro.x0 : null,
    introTopPx: pdfIntro ? live.intro.top - pdfIntro.y0 : null,
    introWidthPx: pdfIntro ? live.intro.width - pdfIntro.w : null,
    countLeftPx: pdfCount ? live.count.left - pdfCount.x0 : null,
    countTopPx: pdfCount ? live.count.top - pdfCount.y0 : null,
  },
};

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

console.log('\n=== Reflections PDF vs Live @ 1920 ===\n');
console.log('PDF page size:', pdfJson.pdfSize);
if (pdfIntro) {
  console.log(`PDF intro:  x=${pdfIntro.x0} y=${pdfIntro.y0} w=${pdfIntro.w} h=${pdfIntro.h}`);
  console.log(`            "${pdfIntro.text.slice(0, 70)}..."`);
}
console.log(
  `Live intro: left=${live.intro?.left} top=${live.intro?.top} w=${live.intro?.width} h=${live.intro?.height}`
);
if (pdfCount) {
  console.log(`PDF count:  x=${pdfCount.x0} y=${pdfCount.y0}  "${pdfCount.text}"`);
}
console.log(`Live count: left=${live.count?.left} top=${live.count?.top}`);
console.log('\nLive card sizes (height varies = content-driven):');
live.cards.forEach((c) => console.log(`  #${c.i}: ${c.width}×${c.height}px`));
console.log('\nDelta live − PDF (px):', report.delta);
console.log(`\nFiles: ${OUT}`);
