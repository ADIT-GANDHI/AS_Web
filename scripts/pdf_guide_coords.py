"""PDF artboard guide coordinates (pt) for comparison red-line overlays.

All x/y values are in the PDF page coordinate system at the listed artboard width.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ScreenGuides:
    artboard_w: float
    v_lines: tuple[int, ...]
    h_lines: tuple[int, ...]


# ── Home PDF (1920 pt wide) ───────────────────────────────────────────────────
# Marble stage: (1920 − 1568) / 2 = 176 … 1744
# Card sheet x from Figma 581:308 inside 1568 pt marble + PDF drawing rects (page 1)
HOME_MARBLE = ScreenGuides(
    artboard_w=1920,
    v_lines=(
        176,   # marble / content stage left
        299,   # nav cluster left (SONGS)
        519,   # reflection card left (sheet)
        629,   # song / film media left
        642,   # song card left (sheet)
        662,   # film card left (sheet)
        960,   # page centre
        959,   # people card left (sheet)
        1010,  # people card media left
        1050,  # poem card left (sheet)
        1106,  # song / film media right
        1145,  # song card right (sheet)
        1165,  # film card right (sheet)
        1456,  # people card media right
        1462,  # people card right (sheet)
        1553,  # poem card right (sheet)
        1619,  # ABOUT left
        1744,  # marble / content stage right
        1906,  # header utilities right (search / radio)
    ),
    h_lines=(120, 210, 730, 1245, 1760, 2275, 2790, 3640),
)

# Page 2 — same marble/card grid + news popup panel (621…1286) and inner columns
HOME_POPUP = ScreenGuides(
    artboard_w=1920,
    v_lines=(
        176,   # marble left
        299,   # nav left
        485,   # popup overlay left
        519,   # reflection card left
        621,   # popup white panel left
        642,   # song card left
        662,   # film card left
        948,   # popup column divider / left column right
        960,   # page centre
        959,   # people card left
        1050,  # poem card left
        1145,  # song card right
        1165,  # film card right
        1286,  # popup white panel right
        1435,  # popup overlay right
        1462,  # people card right
        1553,  # poem card right
        1619,  # ABOUT left
        1744,  # marble right
        1906,  # utilities right
    ),
    h_lines=(120, 185, 720, 1245, 1760),
)

# Page 3 AJAB News — Figma 1:18663 on 1920 × 2985 artboard
# Panel 240…1680 | text column 447…1472 | image band 534…1387 (853 pt wide, centred in column)
AJAB_NEWS = ScreenGuides(
    artboard_w=1920,
    v_lines=(
        240,   # white panel left
        447,   # text column left
        534,   # hero / slider image left
        960,   # page centre
        1387,  # hero / slider image right
        1472,  # text column right
        1680,  # white panel right
    ),
    h_lines=(
        328,   # ajab news logo bottom
        414,   # section-1 title above image
        475,   # section-1 image top
        955,   # section-1 image bottom
        979,   # image caption baseline
        1011,  # section-1 heading below image
        1191,  # section-1 body end
        1250,  # section-2 slider image top (approx)
        1730,  # section-2 slider image bottom (approx)
        1789,  # section-2 heading
        1950,  # section-2 body end
        2029,  # thumbnail row top
        2184,  # thumbnail body end
    ),
)

# Search card ~1000 pt centred
SEARCH_TYPEAHEAD = ScreenGuides(
    artboard_w=1920,
    v_lines=(176, 1744, 460, 1460),
    h_lines=(120, 200, 620, 1245, 3640),
)

SEARCH_RESULTS = ScreenGuides(
    artboard_w=1920,
    v_lines=(180, 1740, 360, 1560),
    h_lines=(192, 340, 480, 780, 1100, 1450),
)

SEARCH_NO_RESULTS = ScreenGuides(
    artboard_w=1920,
    v_lines=(360, 1560),
    h_lines=(192, 420, 680, 920, 1200),
)

# ── Songs PDF ─────────────────────────────────────────────────────────────────
# Listing + filter: 1919 × 2437 — separator x = 289 … 1629 (CLSongs.css)
SONGS_LISTING = ScreenGuides(
    artboard_w=1919,
    v_lines=(289, 1629),
    h_lines=(190, 222, 380, 520, 900, 1400, 2000, 2280),
)

FILTER_PANEL = ScreenGuides(
    artboard_w=1919,
    v_lines=(0, 340, 289, 1629),
    h_lines=(190, 380, 520, 900, 1400, 2000),
)

# Detail: 1925 × 4847 — Figma 361:1406 family
SONG_DETAIL = ScreenGuides(
    artboard_w=1925,
    v_lines=(457, 1484),
    h_lines=(347, 669, 827, 1415, 2997, 3417, 3935, 4200),
)

# ── Shared listing layout (1920 pt) — marble / content band ───────────────────
LISTING_1920 = ScreenGuides(
    artboard_w=1920,
    v_lines=(176, 289, 960, 1629, 1744),
    h_lines=(120, 190, 222, 380, 520, 900, 1400, 2000, 2280),
)

POEMS_MAIN = ScreenGuides(
    artboard_w=1920,
    v_lines=(176, 289, 480, 960, 1440, 1629, 1744),
    h_lines=(120, 190, 222, 420, 900, 1600, 2400, 3200, 3400),
)

POEMS_FILTER = ScreenGuides(
    artboard_w=1920,
    v_lines=(0, 340, 289, 960, 1629, 1744),
    h_lines=(120, 190, 380, 520, 900, 1600, 2400),
)

POEMS_GLOSSARY = ScreenGuides(
    artboard_w=1920,
    v_lines=(176, 457, 960, 1200, 1484, 1744),
    h_lines=(120, 280, 520, 900, 1400, 2000, 2800),
)

REFLECTIONS_LISTING = LISTING_1920
REFLECTIONS_FILTER = ScreenGuides(
    artboard_w=1920,
    v_lines=(0, 340, 289, 960, 1629, 1744),
    h_lines=(120, 190, 380, 520, 900, 1400, 2000),
)

REFLECTIONS_DETAIL = ScreenGuides(
    artboard_w=1920,
    v_lines=(176, 457, 960, 1484, 1744),
    h_lines=(120, 280, 520, 900, 1400, 2000, 2600),
)

PEOPLE_LISTING = LISTING_1920
PEOPLE_FILTER = ScreenGuides(
    artboard_w=1920,
    v_lines=(0, 360, 289, 960, 1629, 1744),
    h_lines=(120, 190, 380, 520, 900, 1400, 2000),
)

PEOPLE_DETAIL = ScreenGuides(
    artboard_w=1920,
    v_lines=(176, 320, 960, 1280, 1744),
    h_lines=(120, 280, 600, 1000, 1600, 2200),
)

FILMS_LISTING = LISTING_1920
FILMS_DETAIL = ScreenGuides(
    artboard_w=1920,
    v_lines=(176, 457, 960, 1484, 1744),
    h_lines=(120, 280, 520, 900, 1400, 2200, 3000),
)

ABOUT_PAGE = ScreenGuides(
    artboard_w=1920,
    v_lines=(240, 447, 960, 1472, 1680),
    h_lines=(120, 280, 600, 1200, 1800, 2600, 3200),
)

GLOSSARY_PAGE = ScreenGuides(
    artboard_w=1920,
    v_lines=(360, 760, 960, 1160, 1560),
    h_lines=(120, 280, 520, 900, 1400, 1800),
)

RADIO_PAGE = ScreenGuides(
    artboard_w=1920,
    v_lines=(176, 480, 960, 1440, 1744),
    h_lines=(120, 360, 540, 720, 900),
)

GUIDE_FOOTER = (
    "Red guides: PDF layout bands (vertical + horizontal) on both panels · "
    "Browser measured boxes shown lighter when present"
)
