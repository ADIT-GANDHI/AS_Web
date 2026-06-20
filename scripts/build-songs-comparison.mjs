/**
 * Full Songs module comparison — matches Comparison_Out/Songs/ format.
 * Captures: listing, filter (open), filter (with 2 selections), song detail, song versions zone.
 * Run: node scripts/build-songs-comparison.mjs [baseUrl]
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const ROOT = process.cwd();
const PDF  = path.join(ROOT, 'Songs_Localhost_Comparison', '2.SongsAll_Detailpg_01.05.2025.pdf');

const LISTING_DIR = path.join(ROOT, 'Comparison_Out', 'Songs', '1_Songs_Listing');
const FILTER_DIR  = path.join(ROOT, 'Comparison_Out', 'Songs', '2_Filter_Panel');
const DETAIL_DIR  = path.join(ROOT, 'Comparison_Out', 'Songs', '3_Song_Details');

[LISTING_DIR, FILTER_DIR, DETAIL_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

if (!fs.existsSync(PDF)) {
  console.error('Missing PDF:', PDF);
  process.exit(1);
}

// ── 1. Extract PDF pages via Python/PyMuPDF ──────────────────────────────────
const pyPath = path.join(ROOT, 'Comparison_Out', 'Songs', '_extract_songs_pdf.py');
fs.writeFileSync(pyPath, `# -*- coding: utf-8 -*-
import sys, json, fitz
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

pdf_path = Path(${JSON.stringify(PDF)})
doc  = fitz.open(pdf_path)
ROOT = Path(${JSON.stringify(path.join(ROOT, 'Comparison_Out', 'Songs'))})

LISTING_DIR = ROOT / "1_Songs_Listing"
FILTER_DIR  = ROOT / "2_Filter_Panel"
DETAIL_DIR  = ROOT / "3_Song_Details"

TARGET_W = 1440

def get_font(size=16, bold=False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)
    except OSError:
        return ImageFont.load_default()

def overlay_guides(img, v_lines, h_lines, artboard_w, color=(220, 40, 40), alpha=170):
    """Draw red guide lines scaled from artboard_w to img.width."""
    sx = img.width / artboard_w
    sy = sx  # square pixels assumed
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for x in v_lines:
        px = int(x * sx)
        draw.line([(px, 0), (px, img.height)], fill=(*color, alpha), width=1)
    for y in h_lines:
        py = int(y * sy)
        draw.line([(0, py), (img.width, py)], fill=(*color, alpha), width=1)
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

def render_page(doc, page_idx, target_w, clip_h=None):
    page = doc[page_idx]
    w, h = page.rect.width, page.rect.height
    scale = target_w / w
    mat = fitz.Matrix(scale, scale)
    if clip_h:
        clip = fitz.Rect(0, 0, w, min(clip_h / scale, h))
        pix = page.get_pixmap(matrix=mat, clip=clip, alpha=False)
    else:
        pix = page.get_pixmap(matrix=mat, alpha=False)
    return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

def stitch(pdf_img, live_img, title_left, title_right, out_path, footer=""):
    gap = 24
    label_h = 48
    h = max(pdf_img.height, live_img.height)
    # Pad shorter panel
    def pad(img):
        if img.height == h: return img
        c = Image.new("RGB", (img.width, h), (230, 230, 230))
        c.paste(img, (0, 0))
        return c
    pl = pad(pdf_img)
    pr = pad(live_img)
    total_w = pl.width + gap + pr.width
    footer_h = 28 if footer else 0
    total_h = label_h + h + footer_h
    out = Image.new("RGB", (total_w, total_h), (24, 24, 24))
    out.paste(pl, (0, label_h))
    out.paste(pr, (pl.width + gap, label_h))
    draw = ImageDraw.Draw(out)
    f16 = get_font(16, True)
    draw.text((12, 14), title_left,  fill=(255, 255, 255), font=f16)
    draw.text((pl.width + gap + 12, 14), title_right, fill=(255, 255, 255), font=f16)
    if footer:
        fy = label_h + h + 6
        draw.text((12, fy), footer, fill=(160, 160, 160), font=get_font(12))
    out.save(str(out_path), quality=93)
    print(f"  Saved: {out_path.name}")

SONGS_V = (289, 1629)
SONGS_H = (190, 222, 380, 520, 900, 1400, 2000, 2280)
FILTER_V = (0, 340, 289, 1629)
FILTER_H = (190, 380, 520, 900, 1400, 2000)
DETAIL_V = (457, 1484)
DETAIL_H = (347, 669, 827, 1415, 2997, 3417, 3935, 4200)
ARTBOARD_SONGS  = 1919
ARTBOARD_DETAIL = 1925
FOOTER_NOTE = "Red guides: PDF layout bands (vertical + horizontal) on both panels · Browser measured boxes shown lighter when present"

print("Extracting PDF pages...")

# Page 1 — Songs listing
p1 = render_page(doc, 0, TARGET_W)
p1_guided = overlay_guides(p1, SONGS_V, SONGS_H, ARTBOARD_SONGS)
p1_guided.save(str(LISTING_DIR / "pdf-listing-guided.png"), quality=93)

# Page 2 — Filter panel open (with selections)
p2 = render_page(doc, 1, TARGET_W)
p2_guided = overlay_guides(p2, FILTER_V, FILTER_H, ARTBOARD_SONGS)
p2_guided.save(str(FILTER_DIR / "pdf-filter-guided.png"), quality=93)

# Page 3 — Song detail
p3 = render_page(doc, 2, TARGET_W)
p3_guided = overlay_guides(p3, DETAIL_V, DETAIL_H, ARTBOARD_DETAIL)
p3_guided.save(str(DETAIL_DIR / "pdf-detail-guided.png"), quality=93)
# Crop top zone of detail (versions + video header)
p3_crop = render_page(doc, 2, TARGET_W, clip_h=900)
p3_crop_guided = overlay_guides(p3_crop, DETAIL_V, [h for h in DETAIL_H if h < 900 / (TARGET_W / ARTBOARD_DETAIL)], ARTBOARD_DETAIL)
p3_crop_guided.save(str(DETAIL_DIR / "pdf-detail-crop-guided.png"), quality=93)

print("PDF pages extracted.")
doc.close()
`);

console.log('Extracting PDF pages via Python…');
execSync(`python "${pyPath}"`, { stdio: 'inherit' });

// ── 2. Browser screenshots via Playwright ────────────────────────────────────
console.log('\nLaunching browser (1440px)…');
const browser = await chromium.launch({ headless: true });

// Helper: suppress dev overlays
async function suppressOverlays(page) {
  await page.addStyleTag({ content: 'nextjs-portal,[data-nextjs-toast],[data-nextjs-dialog-overlay]{display:none!important}' }).catch(() => {});
}

// ── 2a. Songs Listing ─────────────────────────────────────────────────────────
{
  console.log('\n→ /songs (listing)');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(3000);
  await suppressOverlays(page);
  // Wait for cards
  await page.waitForSelector('.cl-song-grid-item, .wc-card', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Full page
  await page.screenshot({ path: path.join(LISTING_DIR, 'live-listing-full.png'), fullPage: true });
  // Above-fold crop to match PDF panel height
  const pdfH = (await import('sharp').then(s => s.default(path.join(LISTING_DIR, 'pdf-listing-guided.png')).metadata())).height;
  await page.screenshot({ path: path.join(LISTING_DIR, 'live-listing-panel.png'), clip: { x:0, y:0, width:1440, height: pdfH || 900 } });
  await page.close();
}

// ── 2b. Filter panel — open, then select 2 singers ────────────────────────────
{
  console.log('\n→ /songs (filter open)');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(3000);
  await suppressOverlays(page);

  // Open filter
  await page.click('button:has-text("Filters")').catch(() => page.click('[class*="filter"]').catch(() => {}));
  await page.waitForTimeout(1200);

  // Screenshot: filter open, no selections
  await page.screenshot({ path: path.join(FILTER_DIR, 'live-filter-open.png'), clip: { x:0, y:0, width:1440, height:900 } });

  // Select 2 filter items
  const items = page.locator('div[style*="z-index: 9999"] li, .clf-panel li, [class*="filter-panel"] li, [class*="FilterPanel"] li');
  const count = await items.count();
  if (count >= 2) {
    await items.nth(0).click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
    await items.nth(2).click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }

  // Screenshot: filter open, with selections
  await page.screenshot({ path: path.join(FILTER_DIR, 'live-filter-with-selections.png'), clip: { x:0, y:0, width:1440, height:900 } });

  await page.close();
}

// ── 2c. Song Detail ───────────────────────────────────────────────────────────
{
  // Get a valid song ID from the listing
  console.log('\n→ Finding valid song ID…');
  const listPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await listPage.goto(`${BASE}/songs`, { waitUntil: 'networkidle', timeout: 60000 });
  await listPage.waitForTimeout(3000);
  const songHref = await listPage.evaluate(() => {
    const a = document.querySelector('a[href*="/songs/details/"]');
    return a ? a.href : null;
  });
  await listPage.close();

  const detailUrl = songHref || `${BASE}/songs/details/252`;
  console.log(`→ Song detail: ${detailUrl}`);

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(6000); // let content fully render
  await suppressOverlays(page);

  // Full detail page
  await page.screenshot({ path: path.join(DETAIL_DIR, 'live-detail-full.png'), fullPage: true });
  // Above fold (versions + video header zone)
  await page.screenshot({ path: path.join(DETAIL_DIR, 'live-detail-panel.png'), clip: { x:0, y:0, width:1440, height:900 } });

  // Versions zone crop
  const versionsEl = page.locator('.cld-versions-section, [class*="versions"]').first();
  if (await versionsEl.count()) {
    await versionsEl.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);
    const box = await versionsEl.boundingBox().catch(() => null);
    if (box) {
      await page.screenshot({
        path: path.join(DETAIL_DIR, 'live-detail-versions-zone.png'),
        clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 10), width: Math.min(1440, box.width + 40), height: Math.min(900, box.height + 40) }
      });
    }
  }

  await page.close();
}

await browser.close();

// ── 3. Stitch comparison images via Python ────────────────────────────────────
const pyStitch = path.join(ROOT, 'Comparison_Out', 'Songs', '_stitch_songs.py');
fs.writeFileSync(pyStitch, `# -*- coding: utf-8 -*-
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(${JSON.stringify(path.join(ROOT, 'Comparison_Out', 'Songs'))})
LISTING = ROOT / "1_Songs_Listing"
FILTER  = ROOT / "2_Filter_Panel"
DETAIL  = ROOT / "3_Song_Details"

FOOTER = "Red guides: PDF layout bands (vertical + horizontal) on both panels · Browser measured boxes shown lighter when present"

def get_font(size=16, bold=False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)
    except OSError:
        return ImageFont.load_default()

def stitch(left_path, right_path, title_l, title_r, out_path, footer=""):
    limg = Image.open(left_path).convert("RGB")
    rimg = Image.open(right_path).convert("RGB")
    # Scale both to same height
    target_h = max(limg.height, rimg.height)
    def resize_to_h(img, h):
        if img.height == h: return img
        w2 = int(img.width * h / img.height)
        return img.resize((w2, h), Image.LANCZOS)
    limg = resize_to_h(limg, target_h)
    rimg = resize_to_h(rimg, target_h)
    gap = 24; label_h = 48; footer_h = 30 if footer else 0
    total_w = limg.width + gap + rimg.width
    total_h = label_h + target_h + footer_h
    out = Image.new("RGB", (total_w, total_h), (24, 24, 24))
    out.paste(limg, (0, label_h))
    out.paste(rimg, (limg.width + gap, label_h))
    draw = ImageDraw.Draw(out)
    f = get_font(16, True)
    draw.text((12, 14), title_l, fill=(255, 255, 255), font=f)
    draw.text((limg.width + gap + 12, 14), title_r, fill=(255, 255, 255), font=f)
    if footer:
        draw.text((12, label_h + target_h + 6), footer, fill=(140, 140, 140), font=get_font(12))
    out.save(str(out_path), quality=93)
    print(f"  Saved: {out_path.name}")

print("\\nStitching comparison images...")

stitch(
    LISTING / "pdf-listing-guided.png",
    LISTING / "live-listing-full.png",
    "PDF — Page 1 Songs listing  ·  2.SongsAll_Detailpg_01.05.2025.pdf",
    f"Browser — http://127.0.0.1:3000/songs  ·  1440px",
    LISTING / "comparison_songs_listing_full.png",
    FOOTER,
)

stitch(
    FILTER / "pdf-filter-guided.png",
    FILTER / "live-filter-with-selections.png",
    "PDF — Page 2 Filter panel  ·  2.SongsAll_Detailpg_01.05.2025.pdf",
    f"Browser — http://127.0.0.1:3000/songs (Filters open)  ·  1440px",
    FILTER / "comparison_filter_panel_full.png",
    FOOTER,
)

stitch(
    DETAIL / "pdf-detail-guided.png",
    DETAIL / "live-detail-full.png",
    "PDF — Page 3 Song detail  ·  2.SongsAll_Detailpg_01.05.2025.pdf",
    f"Browser — Song detail  ·  1440px",
    DETAIL / "comparison_song_detail_full.png",
    FOOTER,
)

# Video zone crop comparison
crop_pdf  = DETAIL / "pdf-detail-crop-guided.png"
crop_live = DETAIL / "live-detail-panel.png"
if crop_pdf.exists() and crop_live.exists():
    stitch(
        crop_pdf,
        crop_live,
        "PDF — Page 3 detail top zone (versions + video header)",
        "Browser — Song detail above fold",
        DETAIL / "comparison_song_detail_video_zone.png",
        FOOTER,
    )

print("Done.")
`);

console.log('\nStitching final comparison images via Python…');
execSync(`python "${pyStitch}"`, { stdio: 'inherit' });

console.log('\n=== Songs Comparison Complete ===');
console.log('Output folder:', path.join(ROOT, 'Comparison_Out', 'Songs'));
