"""Render Poems AI/PDF pages at 1440 and build side-by-side comparisons vs live."""
from __future__ import annotations

import json
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"d:\Mihir_Avni\Ajab_New\ajabshar-main")
OUT = ROOT / "comparison-runs" / "poems-ai-vs-live-1440"
AI_PDF = Path(r"D:\Ajab Shahar\PDFS\Poems_27July2026.pdf")
AI_AI = Path(r"D:\Ajab Shahar\PDFS\Poems_27June2026.ai")
LIVE_DIR = OUT / "live"
AI_DIR = OUT / "ai"
PAIR_DIR = OUT / "pairs"

OUT.mkdir(parents=True, exist_ok=True)
LIVE_DIR.mkdir(exist_ok=True)
AI_DIR.mkdir(exist_ok=True)
PAIR_DIR.mkdir(exist_ok=True)

# July PDF page → live capture filename + label
PAGE_MAP = [
    {"pdf": 0, "live": "01-main-top.png", "label": "01 Main (top)", "crop": "top"},
    {"pdf": 1, "live": "02-explore.png", "label": "02 Explore (theme filter)", "crop": "explore"},
    {"pdf": 2, "live": "01-main-full.png", "label": "03 Main (full scroll)", "crop": "full"},
    {"pdf": 3, "live": "04-filter-parda.png", "label": "04 Filter parda", "crop": "top"},
    {"pdf": 4, "live": "04-filter-parda.png", "label": "05 Filter parda (chips)", "crop": "top"},
    {"pdf": 5, "live": "06-notes.png", "label": "06 Notes popup", "crop": "top"},
    {"pdf": 6, "live": "07-glossary.png", "label": "07 Glossary popup", "crop": "top"},
    {"pdf": 7, "live": "08-listen.png", "label": "08 Listen player", "crop": "top"},
    {"pdf": 8, "live": "08-listen.png", "label": "09 Listen player (alt)", "crop": "top"},
]


def render_pdf_pages(src: Path, prefix: str) -> list[Path]:
    doc = fitz.open(src)
    paths = []
    for i, page in enumerate(doc):
        # Pages are already 1440 wide; render at 2x for sharpness then size to 1440
        zoom = 2.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        # Normalize width to 1440
        if img.width != 1440:
            h = int(img.height * (1440 / img.width))
            img = img.resize((1440, h), Image.Resampling.LANCZOS)
        out = AI_DIR / f"{prefix}-p{i + 1:02d}.png"
        img.save(out, optimize=True)
        paths.append(out)
        print(f"rendered {out.name} {img.size}")
    return paths


def load_font(size: int):
    for name in (
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        p = Path(name)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def crop_for_compare(img: Image.Image, mode: str) -> Image.Image:
    w, h = img.size
    if mode == "top":
        return img.crop((0, 0, w, min(h, 900)))
    if mode == "explore":
        # Prefer mid-page explore band when tall
        if h > 1600:
            top = min(1100, h - 900)
            return img.crop((0, top, w, top + 900))
        return img.crop((0, 0, w, min(h, 900)))
    # full: keep full but we'll scale later; for pair use top 1800
    return img.crop((0, 0, w, min(h, 1800)))


def side_by_side(ai_path: Path, live_path: Path, out_path: Path, label: str, crop: str):
    if not ai_path.exists():
        print(f"skip missing AI {ai_path}")
        return
    if not live_path.exists():
        print(f"skip missing live {live_path}")
        return

    ai = Image.open(ai_path).convert("RGB")
    live = Image.open(live_path).convert("RGB")
    ai = crop_for_compare(ai, crop)
    live = crop_for_compare(live, crop)

    # Match heights
    target_h = max(ai.height, live.height)
    if ai.height != target_h:
        ai = ai.resize((ai.width, target_h), Image.Resampling.LANCZOS)
    if live.height != target_h:
        live = live.resize((live.width, target_h), Image.Resampling.LANCZOS)

    gap = 16
    header = 48
    canvas = Image.new("RGB", (ai.width + live.width + gap + 40, target_h + header + 20), (245, 245, 245))
    draw = ImageDraw.Draw(canvas)
    font = load_font(18)
    font_sm = load_font(14)

    draw.text((20, 12), f"{label}  —  AI (left) vs Localhost (right) @ 1440", fill=(30, 30, 30), font=font)
    draw.text((20, header - 18), "AI / PDF", fill=(100, 100, 100), font=font_sm)
    draw.text((20 + ai.width + gap, header - 18), "Localhost", fill=(100, 100, 100), font=font_sm)

    canvas.paste(ai, (20, header))
    canvas.paste(live, (20 + ai.width + gap, header))
    canvas.save(out_path, optimize=True)
    print(f"pair {out_path.name} {canvas.size}")


def main():
    print("Rendering July PDF (9 pages)…")
    render_pdf_pages(AI_PDF, "pdf")
    print("Rendering June AI (2 pages)…")
    render_pdf_pages(AI_AI, "ai")

    # Build pairs once live captures exist
    manifest = []
    for i, spec in enumerate(PAGE_MAP):
        ai_path = AI_DIR / f"pdf-p{spec['pdf'] + 1:02d}.png"
        live_path = LIVE_DIR / spec["live"]
        out = PAIR_DIR / f"pair-{i + 1:02d}-{spec['label'].split(' ', 1)[1].lower().replace(' ', '-').replace('(', '').replace(')', '')}.png"
        # sanitize filename
        safe = "".join(c if c.isalnum() or c in "-_" else "-" for c in f"pair-{i+1:02d}")
        out = PAIR_DIR / f"{safe}.png"
        side_by_side(ai_path, live_path, out, spec["label"], spec["crop"])
        manifest.append(
            {
                "label": spec["label"],
                "ai": str(ai_path.relative_to(OUT)),
                "live": str(live_path.relative_to(OUT)) if live_path.exists() else None,
                "pair": str(out.relative_to(OUT)) if out.exists() else None,
            }
        )

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("done", OUT)


if __name__ == "__main__":
    main()
