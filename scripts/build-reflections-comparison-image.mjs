/**
 * Build single PDF | Live side-by-side comparison PNG.
 * Run: node scripts/build-reflections-comparison-image.mjs [baseUrl]
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = process.argv[2] || 'http://localhost:3000';
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'Comparison_Out', 'reflections-pdf-vs-live');
const PDF = path.join(ROOT, 'Reflections_Localhost_Comparison', '4.Reflection_01.05.2025.pdf');
const COMPARISON = path.join(OUT, 'reflections-pdf-vs-live-comparison.png');

fs.mkdirSync(OUT, { recursive: true });

const pyRender = path.join(OUT, '_render_pdf_crop.py');
fs.writeFileSync(
  pyRender,
  `# -*- coding: utf-8 -*-
from pathlib import Path
import fitz
from PIL import Image, ImageDraw, ImageFont

pdf_path = Path(${JSON.stringify(PDF)})
out_dir = Path(${JSON.stringify(OUT)})
doc = fitz.open(pdf_path)
page = doc[0]
w, h = page.rect.width, page.rect.height
scale = 1920 / w
mat = fitz.Matrix(scale, scale)
# Hero + cards band (header through first card row)
clip = fitz.Rect(0, 0, w, min(1120, h))
pix = page.get_pixmap(matrix=mat, clip=clip, alpha=False)
pdf_path_out = out_dir / "pdf-panel.png"
pix.save(str(pdf_path_out))
doc.close()
print(str(pdf_path_out))
`
);

execSync(`python "${pyRender}"`, { stdio: 'inherit' });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
await page.goto(`${BASE}/reflections`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForSelector('.clr-intro', { timeout: 60000 });
await page.screenshot({
  path: path.join(OUT, 'live-panel.png'),
  clip: { x: 0, y: 0, width: 1920, height: 1120 },
});
await browser.close();

const pyStitch = path.join(OUT, '_stitch_comparison.py');
fs.writeFileSync(
  pyStitch,
  `# -*- coding: utf-8 -*-
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out_dir = Path(${JSON.stringify(OUT)})
pdf_img = Image.open(out_dir / "pdf-panel.png").convert("RGB")
live_img = Image.open(out_dir / "live-panel.png").convert("RGB")

# Match heights
h = max(pdf_img.height, live_img.height)
if pdf_img.height != h:
    canvas = Image.new("RGB", (pdf_img.width, h), (240, 240, 240))
    canvas.paste(pdf_img, (0, 0))
    pdf_img = canvas
if live_img.height != h:
    canvas = Image.new("RGB", (live_img.width, h), (240, 240, 240))
    canvas.paste(live_img, (0, 0))
    live_img = canvas

gap = 8
label_h = 36
total_w = pdf_img.width + gap + live_img.width
total_h = h + label_h
out = Image.new("RGB", (total_w, total_h), (32, 32, 32))
out.paste(pdf_img, (0, label_h))
out.paste(live_img, (pdf_img.width + gap, label_h))

draw = ImageDraw.Draw(out)
try:
    font = ImageFont.truetype("arial.ttf", 22)
except Exception:
    font = ImageFont.load_default()
draw.text((12, 8), "PDF (4.Reflection_01.05.2025)", fill=(255, 255, 255), font=font)
draw.text((pdf_img.width + gap + 12, 8), "Live (localhost /reflections)", fill=(255, 255, 255), font=font)

comp = Path(${JSON.stringify(COMPARISON)})
out.save(str(comp), quality=92)
print(str(comp))
`
);

const result = execSync(`python "${pyStitch}"`, { encoding: 'utf8' }).trim();
console.log('Comparison image:', result);
