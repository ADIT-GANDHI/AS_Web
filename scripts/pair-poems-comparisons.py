"""Build side-by-side pairs from already-rendered AI + live captures."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"d:\Mihir_Avni\Ajab_New\ajabshar-main")
OUT = ROOT / "comparison-runs" / "poems-ai-vs-live-1440"
LIVE_DIR = OUT / "live"
AI_DIR = OUT / "ai"
PAIR_DIR = OUT / "pairs"
PAIR_DIR.mkdir(parents=True, exist_ok=True)

PAGE_MAP = [
    {"pdf": 0, "live": "01-main-top.png", "label": "01 Main top", "crop": "top"},
    {"pdf": 1, "live": "02-explore.png", "label": "02 Explore", "crop": "explore"},
    {"pdf": 2, "live": "01-main-full.png", "label": "03 Main full", "crop": "full"},
    {"pdf": 3, "live": "04-filter-parda.png", "label": "04 Filter parda", "crop": "top"},
    {"pdf": 4, "live": "04-filter-parda.png", "label": "05 Filter chips", "crop": "top"},
    {"pdf": 5, "live": "06-notes.png", "label": "06 Notes", "crop": "top"},
    {"pdf": 6, "live": "07-glossary.png", "label": "07 Glossary", "crop": "top"},
    {"pdf": 7, "live": "08-listen.png", "label": "08 Listen", "crop": "top"},
    {"pdf": 8, "live": "08-listen.png", "label": "09 Listen alt", "crop": "top"},
]

# Also pair June AI artboards
AI_EXTRA = [
    {"ai": "ai-p01.png", "live": "01-main-full.png", "label": "AI June p1 vs live full", "crop": "full"},
    {"ai": "ai-p02.png", "live": "02-explore.png", "label": "AI June p2 vs live explore", "crop": "explore"},
]


def load_font(size: int):
    for name in ("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/segoeui.ttf"):
        p = Path(name)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def crop_for_compare(img: Image.Image, mode: str) -> Image.Image:
    w, h = img.size
    if mode == "top":
        return img.crop((0, 0, w, min(h, 900)))
    if mode == "explore":
        if h > 1600:
            top = min(1200, max(0, h - 900))
            return img.crop((0, top, w, min(h, top + 900)))
        return img.crop((0, 0, w, min(h, 900)))
    return img.crop((0, 0, w, min(h, 1800)))


def side_by_side(ai_path: Path, live_path: Path, out_path: Path, label: str, crop: str):
    ai = Image.open(ai_path).convert("RGB")
    live = Image.open(live_path).convert("RGB")
    # normalize AI width to 1440
    if ai.width != 1440:
        nh = int(ai.height * (1440 / ai.width))
        ai = ai.resize((1440, nh), Image.Resampling.LANCZOS)
    if live.width != 1440:
        nh = int(live.height * (1440 / live.width))
        live = live.resize((1440, nh), Image.Resampling.LANCZOS)

    ai = crop_for_compare(ai, crop)
    live = crop_for_compare(live, crop)

    target_h = max(ai.height, live.height)
    if ai.height != target_h:
        ai = ai.resize((ai.width, target_h), Image.Resampling.LANCZOS)
    if live.height != target_h:
        live = live.resize((live.width, target_h), Image.Resampling.LANCZOS)

    gap = 16
    header = 48
    canvas = Image.new(
        "RGB",
        (ai.width + live.width + gap + 40, target_h + header + 20),
        (245, 245, 245),
    )
    draw = ImageDraw.Draw(canvas)
    font = load_font(18)
    font_sm = load_font(14)
    draw.text((20, 12), f"{label} — AI (left) vs Localhost (right) @ 1440", fill=(30, 30, 30), font=font)
    draw.text((20, header - 18), "AI / PDF", fill=(100, 100, 100), font=font_sm)
    draw.text((20 + ai.width + gap, header - 18), "Localhost", fill=(100, 100, 100), font=font_sm)
    canvas.paste(ai, (20, header))
    canvas.paste(live, (20 + ai.width + gap, header))
    canvas.save(out_path, optimize=True)
    print(f"OK {out_path.name} {canvas.size[0]}x{canvas.size[1]}")


def main():
    manifest = []
    for i, spec in enumerate(PAGE_MAP):
        ai_path = AI_DIR / f"pdf-p{spec['pdf'] + 1:02d}.png"
        live_path = LIVE_DIR / spec["live"]
        out = PAIR_DIR / f"pair-{i + 1:02d}.png"
        if not ai_path.exists() or not live_path.exists():
            print(f"MISSING {ai_path.name if not ai_path.exists() else live_path.name}")
            continue
        side_by_side(ai_path, live_path, out, spec["label"], spec["crop"])
        manifest.append({"label": spec["label"], "pair": f"pairs/{out.name}", "ai": f"ai/{ai_path.name}", "live": f"live/{live_path.name}"})

    for j, spec in enumerate(AI_EXTRA):
        ai_path = AI_DIR / spec["ai"]
        live_path = LIVE_DIR / spec["live"]
        out = PAIR_DIR / f"pair-ai-{j + 1:02d}.png"
        if not ai_path.exists() or not live_path.exists():
            continue
        side_by_side(ai_path, live_path, out, spec["label"], spec["crop"])
        manifest.append({"label": spec["label"], "pair": f"pairs/{out.name}", "ai": f"ai/{ai_path.name}", "live": f"live/{live_path.name}"})

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (OUT / "README.md").write_text(
        "\n".join(
            [
                "# Poems AI vs Localhost @ 1440px",
                "",
                "Source: `Poems_27July2026.pdf` (9 pages) + `Poems_27June2026.ai` (2 artboards).",
                "",
                "## Side-by-side pairs",
                "",
                *[f"- `{m['pair']}` — {m['label']}" for m in manifest],
                "",
                "## Folders",
                "- `ai/` — rendered design pages",
                "- `live/` — localhost captures",
                "- `pairs/` — left=AI, right=localhost",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print("manifest", len(manifest), "pairs →", OUT)


if __name__ == "__main__":
    main()
