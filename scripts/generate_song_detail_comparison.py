"""
PDF Page 3 vs localhost song detail — side-by-side comparison with red guide lines.

Output:
  Songs_Localhost_Comparison/3_Song_Details/comparison_song_detail_full.png
  Songs_Localhost_Comparison/3_Song_Details/comparison_song_detail_video_zone.png

Usage:
  python scripts/generate_song_detail_comparison.py
  PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 CAPTURE_SONG_ID=229 python scripts/generate_song_detail_comparison.py
"""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from pdf_comparison_common import ComparisonSpec, build_comparison, render_pdf_page  # noqa: E402
from pdf_guide_coords import GUIDE_FOOTER, SONG_DETAIL  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

OUT_DIR = ROOT / "Songs_Localhost_Comparison" / "3_Song_Details"
PDF_PATH = ROOT / "Songs_Localhost_Comparison" / "2.SongsAll_Detailpg_01.05.2025.pdf"
VIEWPORT_W = 1440
VIEWPORT_H = 900
PDF_PAGE = 2
SONG_ID = os.environ.get("CAPTURE_SONG_ID", "233")
BASE_URL = os.environ.get("PLAYWRIGHT_BASE_URL", "http://127.0.0.1:3001").rstrip("/")


def capture_browser() -> object:
    from PIL import Image

    url = f"{BASE_URL}/songs/details/{SONG_ID}"
    shot_path = OUT_DIR / "_browser_detail_temp.png"
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": VIEWPORT_W, "height": VIEWPORT_H})
        page.goto(url, wait_until="domcontentloaded", timeout=120_000)
        page.wait_for_selector(".cld-page", timeout=120_000)
        page.wait_for_selector(".cld-song-header-title-name", timeout=120_000)
        page.wait_for_function(
            "() => !document.querySelector('.loader-overlay')",
            timeout=120_000,
        )
        page.evaluate(
            """() => {
              document.querySelectorAll('nextjs-portal,[data-nextjs-toast]').forEach(el => el.remove());
            }"""
        )
        time.sleep(2)
        page.screenshot(path=str(shot_path), full_page=True)
        browser.close()
    return Image.open(shot_path).convert("RGB")


def crop_video_zone(full, panel_w: int, header_h: int = 72) -> object:
    from PIL import Image

    gap = 32
    scale = panel_w / SONG_DETAIL.artboard_w
    y1 = int(827 * scale) + header_h - 40
    y2 = int(1415 * scale) + header_h + 120
    y1 = max(header_h, y1)
    y2 = min(full.height - 44, y2)
    return full.crop((0, y1, panel_w * 2 + gap, y2))


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    spec = ComparisonSpec(
        pdf_path=PDF_PATH,
        pdf_page=PDF_PAGE,
        pdf_label=f"PDF — Page 3 (Design Reference)  ·  {PDF_PATH.name}",
        out_path=OUT_DIR / "comparison_song_detail_full.png",
        url=f"/songs/details/{SONG_ID}",
        browser_label=f"Browser — {BASE_URL}/songs/details/{SONG_ID}  ·  {VIEWPORT_W}px wide",
        wait_selector=".cld-page",
        artboard_w=SONG_DETAIL.artboard_w,
        v_lines=SONG_DETAIL.v_lines,
        h_lines=SONG_DETAIL.h_lines,
        measure_selectors={
            "video": ".cld-video-wrap",
            "related": ".cld-related",
            "versions": ".cld-versions-slider-wrap",
        },
        footer_note=GUIDE_FOOTER,
    )

    print(f"Rendering PDF page {PDF_PAGE + 1} …")
    pdf_img, pdf_scale = render_pdf_page(PDF_PATH, PDF_PAGE, VIEWPORT_W)
    print(f"Capturing browser {BASE_URL}/songs/details/{SONG_ID} …")
    browser_img = capture_browser()
    comparison = build_comparison(spec, pdf_img, browser_img, pdf_scale, BASE_URL)

    full_path = OUT_DIR / "comparison_song_detail_full.png"
    comparison.save(full_path, quality=92)
    print(f"Saved {full_path}")

    panel_w = max(pdf_img.width, browser_img.width)
    zone = crop_video_zone(comparison, panel_w)
    zone_path = OUT_DIR / "comparison_song_detail_video_zone.png"
    zone.save(zone_path, quality=92)
    print(f"Saved {zone_path}")


if __name__ == "__main__":
    main()
