"""
Generate side-by-side PDF vs localhost comparison images for all modules.

PDFs live in *_Localhost_Comparison/ folders (copied from Ajab_Old/PDFS on run).

Usage:
  python scripts/generate_all_pdf_comparisons.py
  python scripts/generate_all_pdf_comparisons.py --only home
  python scripts/generate_all_pdf_comparisons.py --only modules
  PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 python scripts/generate_all_pdf_comparisons.py
"""
from __future__ import annotations

import argparse
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from pdf_comparison_common import ComparisonSpec, generate_comparison  # noqa: E402
from pdf_guide_coords import (  # noqa: E402
    ABOUT_PAGE,
    AJAB_NEWS,
    FILMS_DETAIL,
    FILMS_LISTING,
    FILTER_PANEL,
    GLOSSARY_PAGE,
    GUIDE_FOOTER,
    HOME_MARBLE,
    HOME_POPUP,
    PEOPLE_DETAIL,
    PEOPLE_FILTER,
    PEOPLE_LISTING,
    POEMS_FILTER,
    POEMS_GLOSSARY,
    POEMS_MAIN,
    RADIO_PAGE,
    REFLECTIONS_DETAIL,
    REFLECTIONS_FILTER,
    REFLECTIONS_LISTING,
    SEARCH_NO_RESULTS,
    SEARCH_RESULTS,
    SEARCH_TYPEAHEAD,
    SONG_DETAIL,
    SONGS_LISTING,
    ScreenGuides,
)
from module_pdf_paths import MODULE_PDFS, ensure_module_pdfs  # noqa: E402

BASE_URL = os.environ.get("PLAYWRIGHT_BASE_URL", "http://127.0.0.1:3000").rstrip("/")
SONG_ID = os.environ.get("CAPTURE_SONG_ID", "260")
REFLECTION_ID = os.environ.get("CAPTURE_REFLECTION_ID", "3")
PEOPLE_ID = os.environ.get("CAPTURE_PEOPLE_ID", "94")
FILM_ID = os.environ.get("CAPTURE_FILM_ID", "13")

HOME_PDF = ROOT / "Home_Localhost_Comparison" / "1.Home_01.05.2025.pdf"
SONGS_PDF = ROOT / "Songs_Localhost_Comparison" / "2.SongsAll_Detailpg_01.05.2025.pdf"


def apply_guides(g: ScreenGuides) -> dict:
    return {
        "artboard_w": g.artboard_w,
        "v_lines": g.v_lines,
        "h_lines": g.h_lines,
        "footer_note": GUIDE_FOOTER,
    }


def dismiss_news_popup(page) -> None:
    overlay = page.locator(".npc-overlay")
    if overlay.count() and overlay.first.is_visible():
        page.locator(".npc-close").click()
        overlay.first.wait_for(state="hidden", timeout=30_000)
        time.sleep(0.5)


def scroll_home(page) -> None:
    page.evaluate(
        """async () => {
          await new Promise((resolve) => {
            let y = 0;
            const step = window.innerHeight;
            const max = document.documentElement.scrollHeight;
            const tick = () => {
              window.scrollTo(0, y);
              y += step;
              if (y < max) setTimeout(tick, 120);
              else {
                window.scrollTo(0, 0);
                setTimeout(resolve, 800);
              }
            };
            tick();
          });
        }"""
    )


def prepare_home_full(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".clh-page", timeout=120_000)
    dismiss_news_popup(page)
    scroll_home(page)
    time.sleep(0.6)


def prepare_news_popup(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".clh-page", timeout=120_000)
    dismiss_news_popup(page)
    # Popup only mounts when CMS slides exist (isOpen && items.length). Poll until open.
    opened = False
    for _ in range(30):
        page.evaluate("() => window.dispatchEvent(new Event('open-ajab-news'))")
        try:
            page.wait_for_selector(".npc-overlay", state="visible", timeout=4_000)
            opened = True
            break
        except Exception:
            page.wait_for_timeout(4_000)
    if not opened:
        raise TimeoutError("AJAB News popup did not open — news API slides may still be loading")
    time.sleep(1.5)


def prepare_ajab_news(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".cl-news-page", timeout=120_000)
    scroll_home(page)
    time.sleep(0.6)


def make_search_typeahead_prepare(query: str):
    def prepare(page) -> None:
        from pdf_comparison_common import default_prepare

        default_prepare(page)
        page.wait_for_selector(".clh-page", timeout=120_000)
        dismiss_news_popup(page)
        page.get_by_role("button", name="Toggle search").click()
        page.wait_for_selector(".header-search-overlay", timeout=60_000)
        page.fill(".header-search-input", query)
        page.wait_for_timeout(2500)

    return prepare


def prepare_search_results(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".cl-search-page-root", timeout=120_000)
    page.wait_for_function(
        "() => document.body.textContent.includes('results found')",
        timeout=120_000,
    )
    time.sleep(1)


def prepare_search_no_results(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".search-no-results-title", timeout=120_000)
    time.sleep(1)


def prepare_songs_listing(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".cl-songs-page", timeout=120_000)
    page.wait_for_selector(".cl-filter-bar", timeout=120_000)
    time.sleep(1)


def prepare_filter_panel(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".cl-songs-page", timeout=120_000)
    page.get_by_role("button", name=re.compile(r"^Filters$", re.I)).click()
    page.wait_for_selector('button[aria-label="Close filters"]', timeout=30_000)
    time.sleep(1.5)


def prepare_song_detail(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".cld-page", timeout=180_000)
    page.wait_for_selector(".cld-song-header-title-name", timeout=60_000)
    time.sleep(2)


def scroll_page(page) -> None:
    scroll_home(page)


def click_filters(page, label: str = "Filters") -> None:
    page.wait_for_selector(
        ".clp-page, .cl-songs-page, .clr-page, .clpe-page",
        timeout=120_000,
    )
    trigger = page.locator(".cl-filter-trigger-wrap button").first
    if not trigger.count():
        trigger = page.get_by_role("button", name=re.compile(rf"^{re.escape(label)}$", re.I)).first
    trigger.wait_for(state="visible", timeout=30_000)
    trigger.click(timeout=30_000)
    time.sleep(1.2)


def prepare_poems_main(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".clp-page", timeout=120_000)
    page.wait_for_selector(".clp-poem-text", timeout=120_000)
    time.sleep(1)


def prepare_poems_filter(page) -> None:
    prepare_poems_main(page)
    click_filters(page)
    first = page.locator("div[style*='z-index: 9999'] li").first
    if first.count():
        first.click()
        time.sleep(0.35)


def prepare_poems_glossary(page) -> None:
    prepare_poems_main(page)
    page.locator(".clp-audio-btn").click()
    time.sleep(0.5)
    btn = page.get_by_role("button", name=re.compile(r"^GLOSSARY$", re.I))
    if btn.count():
        btn.first.click()
        page.wait_for_selector(".wp-popup--anchored", timeout=30_000)
        time.sleep(0.8)


def prepare_reflections_listing(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".clr-page", timeout=120_000)
    page.wait_for_function(
        "() => !document.querySelector('.clr-grid')?.textContent?.includes('Loading reflections')",
        timeout=120_000,
    )
    time.sleep(1)


def prepare_reflections_filter(page) -> None:
    prepare_reflections_listing(page)
    click_filters(page)  # CLFilterPanel trigger label is "Filters"
    page.wait_for_selector('button[aria-label="Close filters"]', timeout=30_000)
    first = page.locator("div[style*='z-index: 9999'] li").first
    if first.count():
        first.click(force=True)
        time.sleep(0.35)


def prepare_reflections_filter_applied(page) -> None:
    prepare_reflections_filter(page)
    close = page.get_by_label("Close filters")
    if close.count():
        close.first.click()
        time.sleep(0.5)


def prepare_reflections_detail(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".clrd-page", timeout=180_000)
    scroll_page(page)
    time.sleep(0.8)


def prepare_people_listing(page) -> None:
    from pdf_comparison_common import default_prepare, stabilize_for_screenshot

    default_prepare(page)
    page.wait_for_selector(".clpe-page", timeout=120_000)
    page.wait_for_function(
        "() => !document.querySelector('.clpe-list')?.textContent?.includes('Loading people')",
        timeout=120_000,
    )
    stabilize_for_screenshot(page)
    time.sleep(1)


def prepare_people_filter(page) -> None:
    prepare_people_listing(page)
    click_filters(page)
    item = page.locator("div[style*='z-index: 9999'] li").first
    if item.count():
        item.first.click(force=True)
        time.sleep(0.35)


def prepare_people_detail(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".clped-page", timeout=120_000)
    scroll_page(page)
    time.sleep(0.8)


def prepare_films_listing(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".clf-page", timeout=120_000)
    page.wait_for_function(
        "() => !document.querySelector('.clf-page')?.textContent?.includes('Loading films')",
        timeout=120_000,
    )
    time.sleep(1)


def prepare_films_detail(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".clfd-page", timeout=180_000)
    scroll_page(page)
    time.sleep(0.8)


def prepare_films_episodes(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".clfd-page", timeout=180_000)
    page.get_by_role("button", name=re.compile(r"^Episodes$", re.I)).first.click()
    page.wait_for_selector(
        ".clfd-page--episodes .clfd-episodes-panel, .clfd-episodes-list",
        timeout=30_000,
    )
    time.sleep(0.8)


def about_page_url(tab: str, menu_key: str) -> str:
    params = [f"menu={menu_key}"]
    if tab != "ajab":
        params.insert(0, f"tab={tab}")
    return f"/about?{'&'.join(params)}"


def make_about_prepare(menu_key: str, tab: str = "ajab"):
    menu_label = menu_key.upper()

    def prepare(page) -> None:
        from pdf_comparison_common import default_prepare

        default_prepare(page)
        page.wait_for_selector(".about-container", timeout=120_000)
        page.wait_for_function(
            "() => { const el = document.querySelector('.about-state'); return !el || !el.textContent.includes('Loading'); }",
            timeout=180_000,
        )
        page.wait_for_function(
            f"""() => {{
              const btn = document.querySelector('.about-toggle-btn.active');
              return btn && btn.textContent.trim().toUpperCase() === {menu_label!r};
            }}""",
            timeout=60_000,
        )
        page.wait_for_selector(".about-content-list .about-content-item", timeout=60_000)
        scroll_page(page)
        time.sleep(0.6)

    return prepare


def prepare_glossary(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".glossary-container", timeout=120_000)
    page.wait_for_function(
        "() => !document.body.textContent.includes('Loading glossary')",
        timeout=120_000,
    )
    page.wait_for_selector(".glossary-item", timeout=120_000)
    scroll_page(page)
    time.sleep(0.6)


def prepare_poems_scroll(page) -> None:
    prepare_poems_main(page)
    scroll_page(page)


def prepare_reflections_detail_scroll(page) -> None:
    prepare_reflections_detail(page)
    page.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.45)")
    time.sleep(0.5)


def prepare_films_detail_scroll(page) -> None:
    prepare_films_detail(page)
    page.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.5)")
    time.sleep(0.5)


def prepare_radio(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".radio-page-root", timeout=120_000)
    page.wait_for_selector(".radio-panel--intro", timeout=60_000)
    time.sleep(0.6)


def prepare_radio_playlists(page) -> None:
    from pdf_comparison_common import default_prepare

    default_prepare(page)
    page.wait_for_selector(".radio-page-root", timeout=120_000)
    page.wait_for_selector(".radio-playlists-list", timeout=60_000)
    page.wait_for_selector(".radio-panel--queue", timeout=60_000)
    time.sleep(0.6)


def home_specs() -> list[ComparisonSpec]:
    home = HOME_PDF.name
    return [
        ComparisonSpec(
            pdf_path=HOME_PDF,
            pdf_page=0,
            pdf_label=f"PDF — Page 1 Home  ·  {home}",
            out_path=ROOT / "Home_Localhost_Comparison" / "1_Home" / "comparison_home_full.png",
            url="/",
            browser_label=f"Browser — {BASE_URL}/  ·  1440px",
            wait_selector=".cl-home-page-root",
            prepare=prepare_home_full,
            **apply_guides(HOME_MARBLE),
        ),
        ComparisonSpec(
            pdf_path=HOME_PDF,
            pdf_page=1,
            pdf_label=f"PDF — Page 2 Home + AJAB News popup  ·  {home}",
            out_path=ROOT / "Home_Localhost_Comparison" / "2_News_Popup" / "comparison_news_popup_full.png",
            url="/",
            browser_label=f"Browser — {BASE_URL}/ (popup open)  ·  1440×1600 viewport",
            wait_selector=".cl-home-page-root",
            viewport_h=1600,
            full_page=False,
            prepare=prepare_news_popup,
            **apply_guides(HOME_POPUP),
        ),
        ComparisonSpec(
            pdf_path=HOME_PDF,
            pdf_page=2,
            pdf_label=f"PDF — Page 3 AJAB News page  ·  {home}",
            out_path=ROOT / "Home_Localhost_Comparison" / "3_Ajab_News" / "comparison_ajab_news_full.png",
            url="/ajab-news",
            browser_label=f"Browser — {BASE_URL}/ajab-news  ·  1440px",
            wait_selector=".cl-news-page",
            prepare=prepare_ajab_news,
            **apply_guides(AJAB_NEWS),
            measure_selectors={
                "column": ".custom-inner-container",
                "heroImage": ".news-image-wrap",
                "details": ".news-detals-row",
                "thumb": ".news-thumb-row",
            },
        ),
        ComparisonSpec(
            pdf_path=HOME_PDF,
            pdf_page=3,
            pdf_label=f"PDF — Page 4 Home + search typeahead (Lorem ipsum)  ·  {home}",
            out_path=ROOT
            / "Home_Localhost_Comparison"
            / "4_Search_Typeahead_Lorem"
            / "comparison_search_typeahead_lorem_full.png",
            url="/",
            browser_label=f"Browser — {BASE_URL}/ (search: Lorem ipsum)  ·  1440×1600 viewport",
            wait_selector=".clh-page",
            viewport_h=1600,
            full_page=False,
            prepare=make_search_typeahead_prepare("Lorem ipsum"),
            **apply_guides(SEARCH_TYPEAHEAD),
        ),
        ComparisonSpec(
            pdf_path=HOME_PDF,
            pdf_page=4,
            pdf_label=f"PDF — Page 5 Home + search typeahead (Farid)  ·  {home}",
            out_path=ROOT
            / "Home_Localhost_Comparison"
            / "5_Search_Typeahead_Farid"
            / "comparison_search_typeahead_farid_full.png",
            url="/",
            browser_label=f"Browser — {BASE_URL}/ (search: Farid)  ·  1440×1600 viewport",
            wait_selector=".clh-page",
            viewport_h=1600,
            full_page=False,
            prepare=make_search_typeahead_prepare("Farid"),
            **apply_guides(SEARCH_TYPEAHEAD),
        ),
        ComparisonSpec(
            pdf_path=HOME_PDF,
            pdf_page=5,
            pdf_label=f"PDF — Page 6 Search results  ·  {home}",
            out_path=ROOT
            / "Home_Localhost_Comparison"
            / "6_Search_Results"
            / "comparison_search_results_full.png",
            url="/searche?search=farid",
            browser_label=f"Browser — {BASE_URL}/searche?search=farid  ·  1440px",
            wait_selector=".cl-search-page-root",
            full_page=True,
            prepare=prepare_search_results,
            **apply_guides(SEARCH_RESULTS),
        ),
        ComparisonSpec(
            pdf_path=HOME_PDF,
            pdf_page=6,
            pdf_label=f"PDF — Page 7 No search results  ·  {home}",
            out_path=ROOT
            / "Home_Localhost_Comparison"
            / "7_Search_No_Results"
            / "comparison_search_no_results_full.png",
            url="/searche?search=zzzznomatch999xyz",
            browser_label=f"Browser — {BASE_URL}/searche?search=zzzznomatch999xyz  ·  1440px",
            wait_selector=".search-no-results-title",
            full_page=True,
            prepare=prepare_search_no_results,
            **apply_guides(SEARCH_NO_RESULTS),
        ),
    ]


def songs_specs() -> list[ComparisonSpec]:
    songs = SONGS_PDF.name
    return [
        ComparisonSpec(
            pdf_path=SONGS_PDF,
            pdf_page=0,
            pdf_label=f"PDF — Page 1 Songs listing  ·  {songs}",
            out_path=ROOT
            / "Songs_Localhost_Comparison"
            / "1_Songs_Listing"
            / "comparison_songs_listing_full.png",
            url="/songs",
            browser_label=f"Browser — {BASE_URL}/songs  ·  1440px",
            wait_selector=".cl-songs-page",
            prepare=prepare_songs_listing,
            **apply_guides(SONGS_LISTING),
        ),
        ComparisonSpec(
            pdf_path=SONGS_PDF,
            pdf_page=1,
            pdf_label=f"PDF — Page 2 Filter panel  ·  {songs}",
            out_path=ROOT
            / "Songs_Localhost_Comparison"
            / "2_Filter_Panel"
            / "comparison_filter_panel_full.png",
            url="/songs",
            browser_label=f"Browser — {BASE_URL}/songs (Filters open)  ·  1440px",
            wait_selector=".cl-songs-page",
            full_page=False,
            prepare=prepare_filter_panel,
            **apply_guides(FILTER_PANEL),
        ),
        ComparisonSpec(
            pdf_path=SONGS_PDF,
            pdf_page=2,
            pdf_label=f"PDF — Page 3 Song detail  ·  {songs}",
            out_path=ROOT
            / "Songs_Localhost_Comparison"
            / "3_Song_Details"
            / "comparison_song_detail_full.png",
            url=f"/songs/details/{SONG_ID}",
            browser_label=f"Browser — {BASE_URL}/songs/details/{SONG_ID}  ·  1440px",
            wait_selector=".cld-page",
            prepare=prepare_song_detail,
            **apply_guides(SONG_DETAIL),
            measure_selectors={
                "video": ".cld-video-wrap",
                "related": ".cld-related",
                "versions": ".cld-versions-slider-wrap",
            },
        ),
    ]


def module_pdf(key: str) -> Path:
    src, dest_dir = MODULE_PDFS[key]
    return dest_dir / src.name


def poems_specs() -> list[ComparisonSpec]:
    pdf = module_pdf("poems")
    name = pdf.name
    base = ROOT / "Poems_Localhost_Comparison"
    return [
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=0,
            pdf_label=f"PDF — Page 1 Poems listing  ·  {name}",
            out_path=base / "1_Poems_Listing" / "comparison_poems_listing_full.png",
            url="/poems",
            browser_label=f"Browser — {BASE_URL}/poems  ·  1440px",
            wait_selector=".clp-page",
            prepare=prepare_poems_main,
            **apply_guides(POEMS_MAIN),
        ),
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=1,
            pdf_label=f"PDF — Page 2 Filter panel  ·  {name}",
            out_path=base / "2_Filter_Panel" / "comparison_poems_filter_full.png",
            url="/poems",
            browser_label=f"Browser — {BASE_URL}/poems (Filters open)  ·  1440px",
            wait_selector=".clp-page",
            full_page=False,
            prepare=prepare_poems_filter,
            **apply_guides(POEMS_FILTER),
        ),
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=2,
            pdf_label=f"PDF — Page 3 Glossary  ·  {name}",
            out_path=base / "3_Glossary" / "comparison_poems_glossary_full.png",
            url="/poems",
            browser_label=f"Browser — {BASE_URL}/poems (Glossary open)  ·  1440px",
            wait_selector=".clp-page",
            full_page=False,
            prepare=prepare_poems_glossary,
            **apply_guides(POEMS_GLOSSARY),
        ),
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=3,
            pdf_label=f"PDF — Page 4 Poems listing (scroll)  ·  {name}",
            out_path=base / "4_Poems_Scroll" / "comparison_poems_scroll_full.png",
            url="/poems",
            browser_label=f"Browser — {BASE_URL}/poems (full scroll)  ·  1440px",
            wait_selector=".clp-page",
            prepare=prepare_poems_scroll,
            **apply_guides(POEMS_MAIN),
        ),
    ]


def reflections_specs() -> list[ComparisonSpec]:
    pdf = module_pdf("reflections")
    name = pdf.name
    base = ROOT / "Reflections_Localhost_Comparison"
    detail_url = f"/reflections/details/{REFLECTION_ID}"
    return [
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=0,
            pdf_label=f"PDF — Page 1 Reflections listing  ·  {name}",
            out_path=base / "1_Reflections_Listing" / "comparison_reflections_listing_full.png",
            url="/reflections",
            browser_label=f"Browser — {BASE_URL}/reflections  ·  1440px",
            wait_selector=".clr-page",
            prepare=prepare_reflections_listing,
            **apply_guides(REFLECTIONS_LISTING),
        ),
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=1,
            pdf_label=f"PDF — Page 2 Filter panel  ·  {name}",
            out_path=base / "2_Filter_Panel" / "comparison_reflections_filter_full.png",
            url="/reflections",
            browser_label=f"Browser — {BASE_URL}/reflections (Filters open)  ·  1440px",
            wait_selector=".clr-page",
            full_page=False,
            prepare=prepare_reflections_filter,
            **apply_guides(REFLECTIONS_FILTER),
        ),
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=2,
            pdf_label=f"PDF — Page 3 Filter applied  ·  {name}",
            out_path=base / "3_Reflection_Detail" / "comparison_reflection_detail_full.png",
            url="/reflections",
            browser_label=f"Browser — {BASE_URL}/reflections (Filter applied)  ·  1440px",
            wait_selector=".clr-page",
            prepare=prepare_reflections_filter_applied,
            **apply_guides(REFLECTIONS_LISTING),
        ),
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=3,
            pdf_label=f"PDF — Page 4 Reflection detail (scroll)  ·  {name}",
            out_path=base / "4_Reflection_Detail_Scroll" / "comparison_reflection_detail_scroll_full.png",
            url=detail_url,
            browser_label=f"Browser — {BASE_URL}{detail_url} (scroll)  ·  1440px",
            wait_selector=".clrd-page",
            prepare=prepare_reflections_detail_scroll,
            **apply_guides(REFLECTIONS_DETAIL),
        ),
    ]


def people_specs() -> list[ComparisonSpec]:
    pdf = module_pdf("people")
    name = pdf.name
    base = ROOT / "People_Localhost_Comparison"
    detail_url = f"/people/{PEOPLE_ID}"
    return [
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=0,
            pdf_label=f"PDF — Page 1 People listing  ·  {name}",
            out_path=base / "1_People_Listing" / "comparison_people_listing_full.png",
            url="/people",
            browser_label=f"Browser — {BASE_URL}/people  ·  1440px",
            wait_selector=".clpe-page",
            prepare=prepare_people_listing,
            **apply_guides(PEOPLE_LISTING),
        ),
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=1,
            pdf_label=f"PDF — Page 2 Filter panel  ·  {name}",
            out_path=base / "2_Filter_Panel" / "comparison_people_filter_full.png",
            url="/people",
            browser_label=f"Browser — {BASE_URL}/people (Filters open)  ·  1440px",
            wait_selector=".clpe-page",
            full_page=False,
            prepare=prepare_people_filter,
            **apply_guides(PEOPLE_FILTER),
        ),
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=2,
            pdf_label=f"PDF — Page 3 Person detail  ·  {name}",
            out_path=base / "3_Person_Detail" / "comparison_people_detail_full.png",
            url=detail_url,
            browser_label=f"Browser — {BASE_URL}{detail_url}  ·  1440px",
            wait_selector=".clped-page",
            prepare=prepare_people_detail,
            **apply_guides(PEOPLE_DETAIL),
        ),
    ]


def films_specs() -> list[ComparisonSpec]:
    pdf = module_pdf("films")
    name = pdf.name
    base = ROOT / "Films_Localhost_Comparison"
    detail_url = f"/films/details/{FILM_ID}"
    return [
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=0,
            pdf_label=f"PDF — Page 1 Films listing  ·  {name}",
            out_path=base / "1_Films_Listing" / "comparison_films_listing_full.png",
            url="/films",
            browser_label=f"Browser — {BASE_URL}/films  ·  1440px",
            wait_selector=".clf-page",
            prepare=prepare_films_listing,
            **apply_guides(FILMS_LISTING),
        ),
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=1,
            pdf_label=f"PDF — Page 2 Film detail  ·  {name}",
            out_path=base / "2_Film_Detail" / "comparison_film_detail_full.png",
            url=detail_url,
            browser_label=f"Browser — {BASE_URL}{detail_url}  ·  1440px",
            wait_selector=".clfd-page",
            prepare=prepare_films_detail,
            **apply_guides(FILMS_DETAIL),
        ),
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=2,
            pdf_label=f"PDF — Page 3 Film detail (Episodes tab)  ·  {name}",
            out_path=base / "3_Film_Episodes" / "comparison_film_episodes_full.png",
            url=detail_url,
            browser_label=f"Browser — {BASE_URL}{detail_url} (Episodes)  ·  1440px",
            wait_selector=".clfd-page",
            full_page=False,
            prepare=prepare_films_episodes,
            **apply_guides(FILMS_DETAIL),
        ),
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=3,
            pdf_label=f"PDF — Page 4 Film detail (scroll)  ·  {name}",
            out_path=base / "4_Film_Detail_Scroll" / "comparison_film_detail_scroll_full.png",
            url=detail_url,
            browser_label=f"Browser — {BASE_URL}{detail_url} (scroll)  ·  1440px",
            wait_selector=".clfd-page",
            prepare=prepare_films_detail_scroll,
            **apply_guides(FILMS_DETAIL),
        ),
    ]


# PDF pages: Ajab intro, Kabir intro, Kabir team, Kabir films, Kabir books
ABOUT_CAPTURES = (
    (0, "ajab", "intro", "1_Intro", "intro"),
    (1, "kabir", "intro", "2_Kabir_Intro", "kabir_intro"),
    (2, "kabir", "team", "3_Team", "team"),
    (3, "kabir", "films", "4_Films", "films"),
    (4, "kabir", "books", "5_Books", "books"),
)


def about_specs() -> list[ComparisonSpec]:
    pdf = module_pdf("about")
    name = pdf.name
    base = ROOT / "About_Localhost_Comparison"
    specs: list[ComparisonSpec] = []
    for pdf_page, tab, menu_key, folder, slug in ABOUT_CAPTURES:
        url = about_page_url(tab, menu_key)
        menu_label = menu_key.upper()
        specs.append(
            ComparisonSpec(
                pdf_path=pdf,
                pdf_page=pdf_page,
                pdf_label=f"PDF — Page {pdf_page + 1} About ({menu_label})  ·  {name}",
                out_path=base / folder / f"comparison_about_{slug}_full.png",
                url=url,
                browser_label=f"Browser — {BASE_URL}{url} ({menu_label})  ·  1440px",
                wait_selector=".about-container",
                prepare=make_about_prepare(menu_key, tab),
                **apply_guides(ABOUT_PAGE),
            )
        )
    return specs


def glossary_specs() -> list[ComparisonSpec]:
    pdf = module_pdf("glossary")
    name = pdf.name
    return [
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=0,
            pdf_label=f"PDF — Page 1 Glossary  ·  {name}",
            out_path=ROOT / "Glossary_Localhost_Comparison" / "1_Glossary" / "comparison_glossary_full.png",
            url="/glossary",
            browser_label=f"Browser — {BASE_URL}/glossary  ·  1440px",
            wait_selector=".glossary-container",
            prepare=prepare_glossary,
            **apply_guides(GLOSSARY_PAGE),
        ),
    ]


def radio_specs() -> list[ComparisonSpec]:
    pdf = module_pdf("radio")
    name = pdf.name
    base = ROOT / "Radio_Localhost_Comparison"
    return [
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=0,
            pdf_label=f"PDF — Page 1 Radio  ·  {name}",
            out_path=base / "1_Radio" / "comparison_radio_full.png",
            url="/radio",
            browser_label=f"Browser — {BASE_URL}/radio  ·  1440px",
            wait_selector=".radio-page-root",
            prepare=prepare_radio,
            **apply_guides(RADIO_PAGE),
        ),
        ComparisonSpec(
            pdf_path=pdf,
            pdf_page=1,
            pdf_label=f"PDF — Page 2 Radio (Playlists)  ·  {name}",
            out_path=base / "2_Radio_Viewport" / "comparison_radio_viewport_full.png",
            url="/radio?view=playlists",
            browser_label=f"Browser — {BASE_URL}/radio?view=playlists  ·  1440px",
            wait_selector=".radio-page-root",
            viewport_h=1080,
            full_page=False,
            prepare=prepare_radio_playlists,
            **apply_guides(RADIO_PAGE),
        ),
    ]


MODULE_GROUPS: dict[str, callable] = {
    "poems": poems_specs,
    "reflections": reflections_specs,
    "people": people_specs,
    "films": films_specs,
    "about": about_specs,
    "glossary": glossary_specs,
    "radio": radio_specs,
}

ONLY_CHOICES = ("home", "songs", "poems", "reflections", "people", "films", "about", "glossary", "radio", "modules", "all")

# Screens that often fail on slow CMS / first-compile — use --retry-failed
RETRY_FOLDER_NAMES = frozenset({
    "2_News_Popup",
    "3_Song_Details",
    "4_Reflection_Detail_Scroll",
    "3_Film_Episodes",
    "5_Books",
})


def retry_failed_specs() -> list[ComparisonSpec]:
    """Return comparison specs for screens that timed out in a full run."""
    ensure_module_pdfs()
    specs: list[ComparisonSpec] = []
    if HOME_PDF.exists():
        specs.extend(home_specs())
    if SONGS_PDF.exists():
        specs.extend(songs_specs())
    for key in MODULE_GROUPS:
        pdf = module_pdf(key)
        if pdf.exists():
            specs.extend(MODULE_GROUPS[key]())
    return [s for s in specs if s.out_path.parent.name in RETRY_FOLDER_NAMES]


def collect_specs(only: str) -> list[ComparisonSpec]:
    specs: list[ComparisonSpec] = []

    if only in ("home", "all"):
        if not HOME_PDF.exists():
            raise SystemExit(f"Home PDF not found: {HOME_PDF}")
        specs.extend(home_specs())

    if only in ("songs", "all"):
        if not SONGS_PDF.exists():
            raise SystemExit(f"Songs PDF not found: {SONGS_PDF}")
        specs.extend(songs_specs())

    module_keys = list(MODULE_GROUPS.keys())
    if only == "modules":
        missing = ensure_module_pdfs()
        if missing:
            print("Warning — PDF sources missing (skipped copy):")
            for path in missing:
                print(f"  - {path}")
        for key in module_keys:
            pdf = module_pdf(key)
            if not pdf.exists():
                print(f"Warning — skipping {key}: PDF not found at {pdf}")
                continue
            specs.extend(MODULE_GROUPS[key]())
    elif only in module_keys:
        missing = ensure_module_pdfs()
        if missing:
            print("Warning — PDF sources missing:")
            for path in missing:
                print(f"  - {path}")
        pdf = module_pdf(only)
        if not pdf.exists():
            raise SystemExit(f"{only.title()} PDF not found: {pdf}")
        specs.extend(MODULE_GROUPS[only]())
    elif only == "all":
        missing = ensure_module_pdfs()
        if missing:
            print("Warning — PDF sources missing (skipped copy):")
            for path in missing:
                print(f"  - {path}")
        for key in module_keys:
            pdf = module_pdf(key)
            if not pdf.exists():
                print(f"Warning — skipping {key}: PDF not found at {pdf}")
                continue
            specs.extend(MODULE_GROUPS[key]())

    return specs


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate PDF vs localhost comparison images")
    parser.add_argument(
        "--only",
        choices=ONLY_CHOICES,
        default="all",
        help="Which module comparisons to generate (default: all)",
    )
    parser.add_argument(
        "--retry-failed",
        action="store_true",
        help="Regenerate only the five screens that often time out (popup, song detail, etc.)",
    )
    args = parser.parse_args()

    if args.retry_failed:
        specs = retry_failed_specs()
    else:
        specs = collect_specs(args.only)

    print(f"Base URL: {BASE_URL}")
    print(f"Generating {len(specs)} comparison screen(s)…\n")

    for i, spec in enumerate(specs, 1):
        print(f"[{i}/{len(specs)}] {spec.out_path.parent.name}")
        try:
            generate_comparison(spec, BASE_URL)
        except Exception as exc:  # noqa: BLE001
            print(f"  ERROR — {exc}")

    if args.only in ("songs", "all"):
        print("\nGenerating song detail video zone crop …")
        from PIL import Image

        from generate_song_detail_comparison import crop_video_zone

        out_dir = ROOT / "Songs_Localhost_Comparison" / "3_Song_Details"
        full_path = out_dir / "comparison_song_detail_full.png"
        if full_path.exists():
            full = Image.open(full_path)
            panel_w = (full.width - 32) // 2
            zone = crop_video_zone(full, panel_w)
            zone_path = out_dir / "comparison_song_detail_video_zone.png"
            zone.save(zone_path, quality=92)
            print(f"  Saved {zone_path}")
        else:
            print("  Skipped — comparison_song_detail_full.png missing")

    print("\nDone.")


if __name__ == "__main__":
    main()
