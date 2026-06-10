#!/usr/bin/env python3
"""Build PDF vs 1920 vs 1440 Home comparison gallery + stitched PNG."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from PIL import Image, ImageDraw, ImageFont
from pdf_comparison_common import render_pdf_page  # noqa: E402

OUT = ROOT / "Comparison_Out" / "Home_ThreeWay"
PDF = ROOT / "Home_Localhost_Comparison" / "1.Home_01.05.2025.pdf"
PDF_PAGE = 0
PANEL_W = 640
GAP = 8
LABEL_H = 36


def _load_rgb(path: Path, target_w: int) -> Image.Image:
    img = Image.open(path).convert("RGB")
    if img.width != target_w:
        h = int(img.height * target_w / img.width)
        img = img.resize((target_w, h), Image.Resampling.LANCZOS)
    return img


def stitch_panels(pdf_path: Path, shots: dict[int, Path], out_path: Path) -> None:
    panels: list[tuple[str, Image.Image]] = [
        ("PDF (page 1)", _load_rgb(pdf_path, PANEL_W)),
        ("Localhost 1920px", _load_rgb(shots[1920], PANEL_W)),
        ("Localhost 1440px", _load_rgb(shots[1440], PANEL_W)),
    ]
    content_h = max(im.height for _, im in panels)
    total_w = PANEL_W * 3 + GAP * 2
    total_h = LABEL_H + content_h
    canvas = Image.new("RGB", (total_w, total_h), (245, 245, 245))
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("arial.ttf", 15)
    except OSError:
        font = ImageFont.load_default()
    x = 0
    for label, im in panels:
        draw.rectangle([x, 0, x + PANEL_W - 1, LABEL_H - 1], fill=(250, 250, 250))
        draw.text((x + 10, 10), label, fill=(51, 51, 51), font=font)
        y = LABEL_H + (content_h - im.height) // 2
        canvas.paste(im, (x, y))
        x += PANEL_W + GAP
    canvas.save(out_path, optimize=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    pdf_path = OUT / "pdf-home-page1.png"
    pdf_img, _ = render_pdf_page(PDF, PDF_PAGE, 1920)
    pdf_img.save(pdf_path)

    shots = {
        1920: OUT / "localhost-home-1920.png",
        1440: OUT / "localhost-home-1440.png",
    }
    for p in shots.values():
        if not p.exists():
            raise SystemExit(f"Missing capture — run: node scripts/capture-home-viewports.mjs\n  {p}")

    stitched = OUT / "home-three-way-stitched.png"
    stitch_panels(pdf_path, shots, stitched)

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Home — PDF vs 1920 vs 1440</title>
  <style>
    :root {{
      --ink: #333;
      --muted: #6d6e71;
      --border: #dedede;
      --pink: #e31e79;
      --bg: #f5f5f5;
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: Arial, sans-serif; color: var(--ink); background: var(--bg); }}
    header {{
      position: sticky; top: 0; z-index: 5;
      padding: 16px 20px; background: rgba(255,255,255,.96);
      border-bottom: 1px solid var(--border);
    }}
    h1 {{ margin: 0 0 6px; font-size: 22px; font-weight: 500; color: var(--pink); }}
    header p {{ margin: 0; font-size: 13px; color: var(--muted); line-height: 1.5; }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      padding: 16px;
      align-items: start;
    }}
    figure {{
      margin: 0; background: #fff; border: 1px solid var(--border);
      border-radius: 8px; overflow: hidden;
    }}
    figcaption {{
      padding: 10px 12px; font-size: 13px; color: var(--muted);
      border-bottom: 1px solid var(--border); background: #fafafa;
    }}
    figcaption strong {{ color: var(--ink); }}
    img {{
      display: block; width: 100%; height: auto;
      border-top: 1px solid #eee;
    }}
    @media (max-width: 1200px) {{
      .grid {{ grid-template-columns: 1fr; }}
    }}
  </style>
</head>
<body>
  <header>
    <h1>Home listing — 3-way comparison</h1>
    <p>
      Reference PDF page 1 (<code>1.Home_01.05.2025.pdf</code>) vs localhost at
      <strong>1920×1080</strong> and <strong>1440×1080</strong> (full-page, news popup dismissed).
      Generated {stamp}.<br />
      <strong>Stitched view:</strong> <a href="home-three-way-stitched.png">home-three-way-stitched.png</a>
      (all three side-by-side). If this page does not load images, run
      <code>npx --yes serve Comparison_Out/Home_ThreeWay -p 8765</code> then open
      <code>http://localhost:8765/</code>.
    </p>
  </header>
  <p style="margin:0 16px 12px;font-size:13px;color:#6d6e71;">
    File path: <code>{OUT.as_posix()}/index.html</code>
  </p>
  <div class="grid">
    <figure>
      <figcaption><strong>PDF</strong> — design export (page 1, rendered 1920px wide)</figcaption>
      <img src="pdf-home-page1.png" alt="PDF Home page 1" />
    </figure>
    <figure>
      <figcaption><strong>Localhost 1920px</strong> — <code>/</code></figcaption>
      <img src="localhost-home-1920.png" alt="Home at 1920" />
    </figure>
    <figure>
      <figcaption><strong>Localhost 1440px</strong> — <code>/</code></figcaption>
      <img src="localhost-home-1440.png" alt="Home at 1440" />
    </figure>
  </div>
</body>
</html>
"""
    (OUT / "index.html").write_text(html, encoding="utf-8")
    readme = f"""# Home 3-way comparison

Generated {stamp}.

## Open the gallery

**Option A — local server (recommended):**
```
cd {ROOT.as_posix()}
npx --yes serve Comparison_Out/Home_ThreeWay -p 8765
```
Then open http://localhost:8765/

**Option B — Windows:**
```
start "" "{(OUT / 'index.html').as_posix()}"
```

**Option C — stitched PNG only:** open `home-three-way-stitched.png`

## Regenerate
```
node scripts/capture-home-viewports.mjs
python scripts/build_home_three_way_comparison.py
```
"""
    (OUT / "README.md").write_text(readme, encoding="utf-8")

    meta = {
        "generated": stamp,
        "pdf": str(PDF),
        "outputs": [
            str(pdf_path),
            str(shots[1920]),
            str(shots[1440]),
            str(stitched),
            str(OUT / "index.html"),
        ],
    }
    (OUT / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"Wrote {OUT / 'index.html'}")
    print(f"Wrote {stitched}")


if __name__ == "__main__":
    main()
