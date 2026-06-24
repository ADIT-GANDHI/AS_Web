/**
 * Export every Songs PDF page at 1440px + matching localhost UI states.
 *
 * Output: Songs_Localhost_Comparison/PDF_Pages_Pack_1440/
 *   pdf/           — PDF pages rendered as-is (no red guides)
 *   localhost/     — Playwright captures for each UI state
 *   comparisons/   — Side-by-side PDF | localhost (with red guides on both)
 *
 * Run: node scripts/build-songs-pdf-pages-pack.mjs [baseUrl]
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const ROOT = process.cwd();
const PDF = path.join(ROOT, 'Songs_Localhost_Comparison', '2.SongsAll_Detailpg_01.05.2025.pdf');
const OUT = path.join(ROOT, 'Songs_Localhost_Comparison', 'PDF_Pages_Pack_1440');
const PDF_DIR = path.join(OUT, 'pdf');
const LIVE_DIR = path.join(OUT, 'localhost');
const CMP_DIR = path.join(OUT, 'comparisons');
const TARGET_W = 1440;

const FILTER_NAMES_PDF = [
  'Abdullah Jat',
  'Arun Goyal',
  'Abdul Turk',
  'Amolak Ram',
];

for (const d of [OUT, PDF_DIR, LIVE_DIR, CMP_DIR]) fs.mkdirSync(d, { recursive: true });

if (!fs.existsSync(PDF)) {
  console.error('Missing PDF:', PDF);
  process.exit(1);
}

// ── 1. Export all PDF pages ───────────────────────────────────────────────────
const pyExport = path.join(OUT, '_export_pdf_pages.py');
fs.writeFileSync(
  pyExport,
  `# -*- coding: utf-8 -*-
import fitz
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

pdf_path = Path(${JSON.stringify(PDF)})
pdf_dir  = Path(${JSON.stringify(PDF_DIR)})
cmp_dir  = Path(${JSON.stringify(CMP_DIR)})
TARGET_W = ${TARGET_W}

SONGS_V = (289, 1629)
SONGS_H = (190, 222, 380, 520, 900, 1400, 2000, 2280)
FILTER_V = (0, 340, 289, 1629)
FILTER_H = (190, 380, 520, 900, 1400, 2000)
DETAIL_V = (457, 1484)
DETAIL_H = (347, 669, 827, 1415, 2997, 3417, 3935, 4200)
ARTBOARD_SONGS  = 1919
ARTBOARD_DETAIL = 1925

PAGE_META = [
    ("page-01-listing.png",              0, ARTBOARD_SONGS,  SONGS_V,  SONGS_H),
    ("page-02-filter-with-selections.png", 1, ARTBOARD_SONGS,  FILTER_V, FILTER_H),
    ("page-03-detail-notes-open.png",  2, ARTBOARD_DETAIL, DETAIL_V, DETAIL_H),
]

def overlay_guides(img, v_lines, h_lines, artboard_w, color=(220, 40, 40), alpha=170):
    sx = img.width / artboard_w
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for x in v_lines:
        px = int(x * sx)
        draw.line([(px, 0), (px, img.height)], fill=(*color, alpha), width=1)
    for y in h_lines:
        py = int(y * sx)
        draw.line([(0, py), (img.width, py)], fill=(*color, alpha), width=1)
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

def get_font(size=16, bold=False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)
    except OSError:
        return ImageFont.load_default()

def render_page(doc, idx, target_w):
    page = doc[idx]
    w = page.rect.width
    scale = target_w / w
    mat = fitz.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

doc = fitz.open(pdf_path)
print(f"PDF has {len(doc)} page(s)")
for fname, idx, ab_w, v, h in PAGE_META:
    img = render_page(doc, idx, TARGET_W)
    img.save(str(pdf_dir / fname), quality=93)
    guided = overlay_guides(img, v, h, ab_w)
    guided.save(str(pdf_dir / fname.replace(".png", "-guided.png")), quality=93)
    print(f"  pdf/{fname}  ({img.width}x{img.height})")
doc.close()
`
);

console.log('Exporting PDF pages…');
execSync(`python "${pyExport}"`, { stdio: 'inherit' });

// ── 2. Localhost captures ─────────────────────────────────────────────────────
console.log('\nLaunching browser (1440px)…');
const browser = await chromium.launch({ headless: true });

async function suppressOverlays(page) {
  await page
    .addStyleTag({
      content:
        'nextjs-portal,[data-nextjs-toast],[data-nextjs-dialog-overlay]{display:none!important}',
    })
    .catch(() => {});
}

async function openFilter(page) {
  await page.click('.cl-filter-trigger').catch(() =>
    page.click('button:has-text("Filters")').catch(() => {})
  );
  await page.waitForTimeout(1200);
}

async function selectFilterByName(page, name) {
  const item = page.locator('.cl-filter-parda-list li').filter({ hasText: name }).first();
  if (await item.count()) {
    await item.click({ force: true });
    await page.waitForTimeout(350);
    return true;
  }
  return false;
}

async function findSongDetailUrl(page) {
  const href = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href*="/songs/details/"]')];
    const aarshi = links.find((a) => /aarshi/i.test(a.textContent || ''));
    return (aarshi || links[0])?.href || null;
  });
  return href || `${BASE}/songs/details/223`;
}

async function findSongWithNotes(page) {
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/songs/details/"]')]
      .map((a) => {
        const m = a.href.match(/\/details\/(\d+)/);
        return m ? Number(m[1]) : null;
      })
      .filter(Boolean)
      .slice(0, 12)
  );
  for (const id of ids) {
    await page.goto(`${BASE}/songs/details/${id}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);
    if (await page.locator('.cld-notes-link').count()) {
      return `${BASE}/songs/details/${id}`;
    }
  }
  return `${BASE}/songs/details/223`;
}

// 01 — Listing default (matches PDF page 1)
{
  console.log('\n→ 01 listing default');
  const page = await browser.newPage({ viewport: { width: TARGET_W, height: 900 } });
  await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(3000);
  await suppressOverlays(page);
  await page.waitForSelector('.cl-song-grid-item, .wc-card', { timeout: 30000 }).catch(() => {});
  await page.screenshot({ path: path.join(LIVE_DIR, '01-listing-default.png'), fullPage: true });
  await page.close();
}

// 02 — Filter open only (no selections)
{
  console.log('\n→ 02 filter open only');
  const page = await browser.newPage({ viewport: { width: TARGET_W, height: 900 } });
  await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(3000);
  await suppressOverlays(page);
  await openFilter(page);
  await page.screenshot({ path: path.join(LIVE_DIR, '02-filter-open-only.png'), fullPage: true });
  await page.close();
}

// 03 — Filter open with selections (matches PDF page 2)
{
  console.log('\n→ 03 filter with selections');
  const page = await browser.newPage({ viewport: { width: TARGET_W, height: 900 } });
  await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(3000);
  await suppressOverlays(page);
  await openFilter(page);
  for (const name of FILTER_NAMES_PDF) {
    const ok = await selectFilterByName(page, name);
    if (!ok) console.warn(`  Could not select filter: ${name}`);
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(LIVE_DIR, '03-filter-with-selections.png'), fullPage: true });
  await page.close();
}

// Find song detail URL (prefer Aarshi Nogor; else first song with NOTES)
let detailUrl = `${BASE}/songs/details/223`;
{
  const page = await browser.newPage({ viewport: { width: TARGET_W, height: 900 } });
  await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  const aarshi = await findSongDetailUrl(page);
  if (/aarshi/i.test(aarshi)) {
    detailUrl = aarshi;
  } else {
    detailUrl = await findSongWithNotes(page);
  }
  await page.close();
}
console.log(`\nSong detail URL: ${detailUrl}`);

async function captureDetail(page, file, { notes = false, glossary = false } = {}) {
  await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(5000);
  await suppressOverlays(page);
  await page.waitForSelector('.cld-song-title-block, .cld-versions-title', { timeout: 30000 }).catch(() => {});

  if (notes || glossary) {
    await page.evaluate(() => {
      const lyrics = document.querySelector('.cld-lyrics-stage, .cld-notes-glossary-row');
      lyrics?.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(800);
  }

  if (notes) {
    const notesBtn = page.locator('.cld-notes-link');
    if (await notesBtn.count()) {
      await notesBtn.click();
      await page.waitForSelector('.cld-notes-panel', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(600);
    } else {
      console.warn('  NOTES button not found');
    }
  }

  if (glossary) {
    const glossBtn = page.locator('.cld-glossary-link');
    if (await glossBtn.count()) {
      await glossBtn.click();
      await page.waitForSelector('.cld-glossary-panel', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(600);
    } else {
      console.warn('  GLOSSARY button not found');
    }
  }

  await page.screenshot({ path: path.join(LIVE_DIR, file), fullPage: true });
}

// 04 — Detail default
{
  console.log('\n→ 04 detail default');
  const page = await browser.newPage({ viewport: { width: TARGET_W, height: 900 } });
  await captureDetail(page, '04-detail-default.png');
  await page.close();
}

// 05 — Detail notes open (matches PDF page 3)
{
  console.log('\n→ 05 detail notes open');
  const page = await browser.newPage({ viewport: { width: TARGET_W, height: 900 } });
  await captureDetail(page, '05-detail-notes-open.png', { notes: true });
  await page.close();
}

// 06 — Detail glossary open
{
  console.log('\n→ 06 detail glossary open');
  const page = await browser.newPage({ viewport: { width: TARGET_W, height: 900 } });
  await captureDetail(page, '06-detail-glossary-open.png', { glossary: true });
  await page.close();
}

await browser.close();

// ── 3. Stitch comparisons + guide overlays ────────────────────────────────────
const pyStitch = path.join(OUT, '_stitch_pack.py');
fs.writeFileSync(
  pyStitch,
  `# -*- coding: utf-8 -*-
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

pdf_dir  = Path(${JSON.stringify(PDF_DIR)})
live_dir = Path(${JSON.stringify(LIVE_DIR)})
cmp_dir  = Path(${JSON.stringify(CMP_DIR)})
BASE_URL = ${JSON.stringify(BASE)}
TARGET_W = ${TARGET_W}

SONGS_V = (289, 1629)
SONGS_H = (190, 222, 380, 520, 900, 1400, 2000, 2280)
FILTER_V = (0, 340, 289, 1629)
FILTER_H = (190, 380, 520, 900, 1400, 2000)
DETAIL_V = (457, 1484)
DETAIL_H = (347, 669, 827, 1415, 2997, 3417, 3935, 4200)
ARTBOARD_SONGS  = 1919
ARTBOARD_DETAIL = 1925
FOOTER = "Red guides: PDF layout bands · 1440px viewport"

PAIRS = [
    ("compare-01-listing.png",
     "page-01-listing-guided.png", "01-listing-default.png",
     "PDF page 1 — Songs listing",
     f"Localhost — listing (filter closed) · {TARGET_W}px",
     SONGS_V, SONGS_H, ARTBOARD_SONGS),
    ("compare-02-filter-selected.png",
     "page-02-filter-with-selections-guided.png", "03-filter-with-selections.png",
     "PDF page 2 — Filter open + selections",
     f"Localhost — filter open (Abdullah Jat, Arun Goyal, Abdul Turk, Amolak Ram)",
     FILTER_V, FILTER_H, ARTBOARD_SONGS),
    ("compare-03-detail-notes.png",
     "page-03-detail-notes-open-guided.png", "05-detail-notes-open.png",
     "PDF page 3 — Song detail + Notes open",
     f"Localhost — song detail + NOTES open",
     DETAIL_V, DETAIL_H, ARTBOARD_DETAIL),
    ("compare-02a-filter-open-only.png",
     "page-02-filter-with-selections-guided.png", "02-filter-open-only.png",
     "PDF page 2 (reference layout)",
     f"Localhost — filter open only (no selections)",
     FILTER_V, FILTER_H, ARTBOARD_SONGS),
    ("compare-04-detail-default.png",
     "page-03-detail-notes-open-guided.png", "04-detail-default.png",
     "PDF page 3 (reference layout)",
     f"Localhost — song detail (notes/glossary closed)",
     DETAIL_V, DETAIL_H, ARTBOARD_DETAIL),
    ("compare-05-detail-glossary.png",
     "page-03-detail-notes-open-guided.png", "06-detail-glossary-open.png",
     "PDF page 3 (reference layout)",
     f"Localhost — song detail + GLOSSARY open",
     DETAIL_V, DETAIL_H, ARTBOARD_DETAIL),
]

def get_font(size=16, bold=False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)
    except OSError:
        return ImageFont.load_default()

def overlay_guides(img, v_lines, h_lines, artboard_w, color=(220, 40, 40), alpha=170):
    sx = img.width / artboard_w
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for x in v_lines:
        px = int(x * sx)
        draw.line([(px, 0), (px, img.height)], fill=(*color, alpha), width=1)
    for y in h_lines:
        py = int(y * sx)
        draw.line([(0, py), (img.width, py)], fill=(*color, alpha), width=1)
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

def guide_live(src, v, h, ab):
    img = Image.open(src).convert("RGB")
    return overlay_guides(img, v, h, ab)

def stitch(left, right, title_l, title_r, out, footer=""):
    limg = Image.open(left).convert("RGB")
    rimg = Image.open(right).convert("RGB")
    target_h = max(limg.height, rimg.height)
    def resize_h(img, h):
        if img.height == h: return img
        w2 = int(img.width * h / img.height)
        return img.resize((w2, h), Image.LANCZOS)
    limg, rimg = resize_h(limg, target_h), resize_h(rimg, target_h)
    gap, label_h, footer_h = 24, 48, 30 if footer else 0
    total_w = limg.width + gap + rimg.width
    out_img = Image.new("RGB", (total_w, label_h + target_h + footer_h), (24, 24, 24))
    out_img.paste(limg, (0, label_h))
    out_img.paste(rimg, (limg.width + gap, label_h))
    draw = ImageDraw.Draw(out_img)
    f = get_font(16, True)
    draw.text((12, 14), title_l, fill=(255, 255, 255), font=f)
    draw.text((limg.width + gap + 12, 14), title_r, fill=(255, 255, 255), font=f)
    if footer:
        draw.text((12, label_h + target_h + 6), footer, fill=(140, 140, 140), font=get_font(12))
    out_img.save(str(out), quality=93)
    print(f"  comparisons/{out.name}")

for out_name, pdf_file, live_file, tl, tr, v, h, ab in PAIRS:
    pdf_path = pdf_dir / pdf_file
    live_path = live_dir / live_file
    if not pdf_path.exists() or not live_path.exists():
        print(f"  skip {out_name} (missing input)")
        continue
    live_guided = guide_live(live_path, v, h, ab)
    tmp = cmp_dir / ("_tmp_" + live_file)
    live_guided.save(str(tmp), quality=93)
    stitch(pdf_path, tmp, tl, tr, cmp_dir / out_name, FOOTER)
    tmp.unlink(missing_ok=True)

print("Done.")
`
);

console.log('\nBuilding comparisons…');
execSync(`python "${pyStitch}"`, { stdio: 'inherit' });

// ── 4. README index ───────────────────────────────────────────────────────────
const readme = `# Songs PDF Pages Pack (${TARGET_W}px)

Pure PDF exports and matching localhost UI states from \`2.SongsAll_Detailpg_01.05.2025.pdf\`.

Regenerate:

\`\`\`powershell
node scripts/build-songs-pdf-pages-pack.mjs http://localhost:3000
\`\`\`

## PDF pages (3 total)

| File | PDF page | Description |
|------|----------|-------------|
| \`pdf/page-01-listing.png\` | 1 | Songs listing — filter closed |
| \`pdf/page-02-filter-with-selections.png\` | 2 | Filter open + 4 singer chips selected |
| \`pdf/page-03-detail-notes-open.png\` | 3 | Song detail — Song Notes panel open |

Each PDF export also has a \`*-guided.png\` variant with red layout guides.

## Localhost states

| File | Route / state |
|------|----------------|
| \`localhost/01-listing-default.png\` | \`/songs\` — no filter |
| \`localhost/02-filter-open-only.png\` | \`/songs\` — filter drawer open, no selections |
| \`localhost/03-filter-with-selections.png\` | \`/songs\` — filter open + Abdullah Jat, Arun Goyal, Abdul Turk, Amolak Ram |
| \`localhost/04-detail-default.png\` | Song detail — notes/glossary closed |
| \`localhost/05-detail-notes-open.png\` | Song detail — NOTES panel open |
| \`localhost/06-detail-glossary-open.png\` | Song detail — GLOSSARY panel open |

## Side-by-side comparisons

| File | Left | Right |
|------|------|-------|
| \`comparisons/compare-01-listing.png\` | PDF page 1 | Listing default |
| \`comparisons/compare-02-filter-selected.png\` | PDF page 2 | Filter + selections |
| \`comparisons/compare-03-detail-notes.png\` | PDF page 3 | Detail + notes |
| \`comparisons/compare-02a-filter-open-only.png\` | PDF page 2 (ref) | Filter open only |
| \`comparisons/compare-04-detail-default.png\` | PDF page 3 (ref) | Detail default |
| \`comparisons/compare-05-detail-glossary.png\` | PDF page 3 (ref) | Detail + glossary |

Captured from **${BASE}** at **${TARGET_W}px** viewport.
`;

fs.writeFileSync(path.join(OUT, 'README.md'), readme);

console.log('\n=== PDF Pages Pack Complete ===');
console.log(OUT);
