"""
Annotated implementation PLAN mockup — no app code changes.
Overlays target zones on the user's marked comparison image.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "Songs_Localhost_Comparison" / "3_Song_Details" / "comparison_song_detail_full(1).png"
OUT = ROOT / "Songs_Localhost_Comparison" / "3_Song_Details" / "comparison_song_detail_plan.png"

# Panel layout from comparison generator (1440px panels, 32px gap, 72px header)
PANEL_W = 1440
GAP = 32
HEADER_H = 72
BROWSER_X = PANEL_W + GAP  # right panel origin


def font(size: int, bold: bool = False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)
    except OSError:
        return ImageFont.load_default()


def box(draw, x1, y1, x2, y2, color, label, label_y_offset=-28):
    draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
    tw = draw.textbbox((0, 0), label, font=font(13, True))[2]
    tx = x1 + max(0, (x2 - x1 - tw) // 2)
    ty = y1 + label_y_offset
    draw.rectangle([tx - 4, ty - 2, tx + tw + 4, ty + 18], fill=(255, 255, 255), outline=color, width=1)
    draw.text((tx, ty), label, fill=color, font=font(13, True))


def arrow_up(draw, x, y1, y2, color, label):
    draw.line([(x, y1), (x, y2)], fill=color, width=3)
    draw.polygon([(x, y2), (x - 8, y2 + 14), (x + 8, y2 + 14)], fill=color)
    draw.text((x + 12, (y1 + y2) // 2 - 8), label, fill=color, font=font(12, True))


def main():
    img = Image.open(SRC).convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw_base = ImageDraw.Draw(img)

    green = (20, 140, 60)
    blue = (30, 90, 200)
    orange = (210, 120, 0)

    bx = BROWSER_X

    # ── 1. Push "N Song Versions" up (~24–32px less top breathing room) ──
    arrow_up(draw, bx + 720, HEADER_H + 95, HEADER_H + 55, green, "↑ move title + rule ~28px")

    # ── 2. Shrink versions scroller rail to PDF card row (~837px cards + nav) ──
    # Target at 1440: 837/1925*1440 ≈ 626px card span; full rail with chevrons ≈ 750px
    rail_left = bx + int(457 / 1925 * PANEL_W)
    rail_w = int(837 / 1925 * PANEL_W)
    rail_top = HEADER_H + int(347 / 1925 * PANEL_W * (1440 / 1925) * (1925 / 1440))  # ~347 scaled
    # simpler: use Figma y at scale 1440/1925
    sc = PANEL_W / 1925
    rail_top = HEADER_H + int(347 * sc)
    card_h = int(322 * sc)
    rail_w = int(837 * sc)
    chevron_w = int(44 * sc)
    box(
        draw,
        rail_left - chevron_w - 8,
        rail_top - 4,
        rail_left + rail_w + chevron_w + 8,
        rail_top + card_h + 4,
        green,
        f"Target scroller: ~{rail_w}px cards + chevrons · card ~{int(288*sc)}×{card_h}px",
        -32,
    )

    # Single card shrink callout (current browser shows 1 large card)
    box(
        draw,
        rail_left,
        rail_top,
        rail_left + int(288 * sc),
        rail_top + card_h,
        blue,
        f"Card thumb ~{int(280*sc)}×{int(156*sc)}px",
        -24,
    )

    # ── 3. Video zone — already aligned; confirm bg tambura visible at right ──
    vid_top = HEADER_H + int(827 * sc)
    vid_h = int(588 * sc)
    vid_w = int(1007 * sc)
    box(
        draw,
        rail_left,
        vid_top,
        rail_left + vid_w,
        vid_top + vid_h,
        green,
        "Video column (done) — keep bg art visible beside player",
        -28,
    )

    # ── 4. Related section — yellow area in user markup: compact list ──
    rel_top = HEADER_H + int(2997 * sc)
    rel_h = int(420 * sc)
    box(
        draw,
        rail_left - 5,
        rel_top,
        rail_left + int(1034 * sc),
        rel_top + rel_h,
        orange,
        "Related: tighten row height + thumb ~238×139px at 1440",
        -28,
    )

    # ── 5. Glossary strip — yellow pill row above footer ──
    gloss_top = HEADER_H + int(3935 * sc)
    gloss_h = int(120 * sc)
    box(
        draw,
        rail_left,
        gloss_top,
        rail_left + int(1015 * sc),
        gloss_top + gloss_h,
        orange,
        "Glossary strip: match PDF pill width + 2-row wrap",
        -28,
    )

    # ── 6. Reduce vertical gap: versions → video header ──
    gap_y1 = rail_top + card_h
    gap_y2 = vid_top - int(60 * sc)  # current large header margin
    draw.line([(bx + 40, gap_y1), (bx + 40, gap_y2)], fill=green, width=2)
    draw.text(
        (bx + 48, (gap_y1 + gap_y2) // 2 - 20),
        "Reduce gap\nversions → video\n(PDF ~436px scaled)",
        fill=green,
        font=font(11, True),
    )

    # Title bar for plan
    draw_base.rectangle([0, img.height - 52, img.width, img.height], fill=(30, 30, 30))
    note = (
        "IMPLEMENTATION PLAN (no code applied yet) — green = versions/video spacing · "
        "blue = card sizing · orange = related + glossary compaction"
    )
    draw_base.text((16, img.height - 38), note, fill=(220, 220, 220), font=font(14))

    result = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    result.save(OUT, quality=92)
    print(f"Saved {OUT}")


if __name__ == "__main__":
    main()
