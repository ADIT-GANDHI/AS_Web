"""Shared PDF vs localhost side-by-side comparison builder."""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

import fitz
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import Page, sync_playwright

VIEWPORT_W = 1440
VIEWPORT_H = 900
GAP = 32
HEADER_H = 72
FOOTER_H = 44
CANVAS_BG = (245, 245, 243)
GUIDE_RED = (210, 45, 45)
GUIDE_RED_LIGHT = (200, 80, 80)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)
    except OSError:
        return ImageFont.load_default()


def render_pdf_page(pdf_path: Path, page_index: int, width: int) -> tuple[Image.Image, float]:
    doc = fitz.open(pdf_path)
    page = doc[page_index]
    scale = width / page.rect.width
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    doc.close()
    return img, scale


def hide_dev_overlays(page: Page) -> None:
    page.evaluate(
        """() => {
          document.querySelectorAll('nextjs-portal,[data-nextjs-toast]').forEach(el => el.remove());
        }"""
    )


def default_prepare(page: Page) -> None:
    page.wait_for_function(
        "() => !document.querySelector('.loader-overlay')",
        timeout=180_000,
    )
    hide_dev_overlays(page)
    time.sleep(1.5)


def stabilize_for_screenshot(page: Page) -> None:
    """Scroll to top, wait for fonts, and pause animations before full-page capture."""
    page.evaluate("() => window.scrollTo(0, 0)")
    page.evaluate("() => document.fonts.ready")
    page.evaluate(
        """() => {
          document.querySelectorAll('*').forEach((el) => {
            el.getAnimations?.().forEach((a) => a.cancel());
          });
        }"""
    )
    time.sleep(0.75)


def _legacy_guides_to_lines(guides: dict[str, int]) -> tuple[list[int], list[int]]:
    """Convert legacy guides dict to v_lines / h_lines."""
    v: list[int] = []
    h: list[int] = []
    for key, val in guides.items():
        if key in ("content_left", "content_right", "page_left", "page_right") or key.endswith("_left"):
            v.append(val)
        elif key.endswith("_top") or key.endswith("_bottom"):
            h.append(val)
    return v, h


@dataclass
class ComparisonSpec:
    pdf_path: Path
    pdf_page: int
    pdf_label: str
    out_path: Path
    url: str
    browser_label: str
    wait_selector: str | None = None
    viewport_w: int = VIEWPORT_W
    viewport_h: int = VIEWPORT_H
    full_page: bool = True
    prepare: Callable[[Page], None] | None = None
    artboard_w: float = 1920.0
    v_lines: tuple[int, ...] = ()
    h_lines: tuple[int, ...] = ()
    guides: dict[str, int] | None = None  # legacy — merged into v_lines/h_lines
    measure_selectors: dict[str, str] = field(default_factory=dict)
    footer_note: str = (
        "Red guides: PDF layout bands (vertical + horizontal) on both panels · "
        "Browser measured boxes shown lighter when present"
    )


def goto_route(page: Page, base_url: str, url: str, timeout_ms: int = 180_000) -> None:
    """Navigate with a long timeout; dev compile on first visit can exceed 120s."""
    target = f"{base_url.rstrip('/')}{url}"
    try:
        page.goto(target, wait_until="domcontentloaded", timeout=timeout_ms)
    except Exception:
        page.goto(target, wait_until="commit", timeout=timeout_ms)
    time.sleep(1.5)


def capture_browser(spec: ComparisonSpec, base_url: str) -> Image.Image:
    temp = spec.out_path.parent / f"_temp_{spec.out_path.stem}.png"
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(
            viewport={"width": spec.viewport_w, "height": spec.viewport_h}
        )
        goto_route(page, base_url, spec.url)
        # Run prepare first — it waits through loaders/API; a strict wait_selector
        # before prepare often times out while detail pages still show Loader.
        if spec.prepare:
            spec.prepare(page)
        else:
            if spec.wait_selector:
                page.wait_for_selector(spec.wait_selector, timeout=180_000)
            default_prepare(page)
        stabilize_for_screenshot(page)
        page.screenshot(path=str(temp), full_page=spec.full_page, timeout=300_000)
        browser.close()
    return Image.open(temp).convert("RGB")


def resolved_guide_lines(spec: ComparisonSpec) -> tuple[tuple[int, ...], tuple[int, ...]]:
    v = list(spec.v_lines)
    h = list(spec.h_lines)
    if spec.guides:
        lv, lh = _legacy_guides_to_lines(spec.guides)
        v.extend(lv)
        h.extend(lh)
    return tuple(sorted(set(v))), tuple(sorted(set(h)))


def draw_guides_on_panel(
    draw: ImageDraw.ImageDraw,
    panel_x: int,
    panel_w: int,
    panel_h: int,
    y_offset: int,
    artboard_w: float,
    v_lines: tuple[int, ...],
    h_lines: tuple[int, ...],
    *,
    line_width: int = 2,
    color: tuple[int, int, int] = GUIDE_RED,
) -> None:
    scale = panel_w / artboard_w
    for x_pt in v_lines:
        x = panel_x + int(x_pt * scale)
        draw.line([(x, y_offset), (x, y_offset + panel_h)], fill=color, width=line_width)
    for y_pt in h_lines:
        y = y_offset + int(y_pt * scale)
        y = max(y_offset, min(y, y_offset + panel_h))
        draw.line([(panel_x, y), (panel_x + panel_w, y)], fill=color, width=line_width)


def measure_browser_boxes(
    spec: ComparisonSpec,
    base_url: str,
    panel_w: int,
) -> dict[str, dict[str, float]]:
    if not spec.measure_selectors:
        return {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(
            viewport={"width": spec.viewport_w, "height": spec.viewport_h}
        )
        goto_route(page, base_url, spec.url)
        if spec.prepare:
            spec.prepare(page)
        else:
            if spec.wait_selector:
                page.wait_for_selector(spec.wait_selector, timeout=180_000)
            default_prepare(page)
        boxes = page.evaluate(
            """(sels) => {
              const r = (sel) => {
                const el = document.querySelector(sel);
                if (!el) return null;
                const b = el.getBoundingClientRect();
                return {
                  left: b.left,
                  top: b.top + window.scrollY,
                  right: b.right,
                  bottom: b.bottom + window.scrollY,
                };
              };
              const out = {};
              for (const [k, sel] of Object.entries(sels)) out[k] = r(sel);
              return out;
            }""",
            spec.measure_selectors,
        )
        browser.close()
    return boxes


def draw_measured_boxes(
    draw: ImageDraw.ImageDraw,
    boxes: dict[str, dict[str, float] | None],
    panel_x: int,
    panel_w: int,
    panel_h: int,
    y_offset: int,
    viewport_w: int,
) -> None:
    br_scale = panel_w / viewport_w
    for name, box in boxes.items():
        if not box:
            continue
        color = GUIDE_RED if name in ("video", "primary") else GUIDE_RED_LIGHT
        lw = 2 if name in ("video", "primary") else 1
        for val in [box["left"], box["right"]]:
            x = int(val * br_scale) + panel_x
            draw.line([(x, y_offset), (x, y_offset + panel_h)], fill=color, width=lw)
        for val in [box["top"], box["bottom"]]:
            y = int(val * br_scale) + y_offset
            y = max(y_offset, min(y, y_offset + panel_h))
            draw.line([(panel_x, y), (panel_x + panel_w, y)], fill=color, width=lw)


def build_comparison(
    spec: ComparisonSpec,
    pdf_img: Image.Image,
    browser_img: Image.Image,
    pdf_scale: float,
    base_url: str,
) -> Image.Image:
    panel_w = max(pdf_img.width, browser_img.width)
    pdf_panel = pdf_img.resize(
        (panel_w, int(pdf_img.height * panel_w / pdf_img.width)), Image.LANCZOS
    )
    br_panel = browser_img.resize(
        (panel_w, int(browser_img.height * panel_w / browser_img.width)), Image.LANCZOS
    )
    content_h = max(pdf_panel.height, br_panel.height)
    canvas_h = HEADER_H + content_h + FOOTER_H
    canvas_w = panel_w * 2 + GAP
    canvas = Image.new("RGB", (canvas_w, canvas_h), CANVAS_BG)
    draw = ImageDraw.Draw(canvas)

    title_font = load_font(22, bold=True)
    small_font = load_font(14)

    draw.rectangle([0, 0, panel_w, HEADER_H], fill=(48, 48, 48))
    draw.rectangle([panel_w + GAP, 0, canvas_w, HEADER_H], fill=(16, 52, 96))
    draw.text((16, 22), spec.pdf_label, fill=(255, 255, 255), font=title_font)
    draw.text(
        (panel_w + GAP + 16, 22),
        spec.browser_label,
        fill=(255, 255, 255),
        font=title_font,
    )

    canvas.paste(pdf_panel, (0, HEADER_H))
    canvas.paste(br_panel, (panel_w + GAP, HEADER_H))

    v_lines, h_lines = resolved_guide_lines(spec)
    artboard_w = spec.artboard_w or pdf_img.width / pdf_scale if pdf_scale else 1920.0

    draw = ImageDraw.Draw(canvas)
    if v_lines or h_lines:
        draw_guides_on_panel(
            draw, 0, panel_w, pdf_panel.height, HEADER_H, artboard_w, v_lines, h_lines
        )
        draw_guides_on_panel(
            draw,
            panel_w + GAP,
            panel_w,
            br_panel.height,
            HEADER_H,
            artboard_w,
            v_lines,
            h_lines,
        )

    boxes = measure_browser_boxes(spec, base_url, panel_w)
    if boxes:
        draw_measured_boxes(
            draw, boxes, panel_w + GAP, panel_w, br_panel.height, HEADER_H, spec.viewport_w
        )

    draw.rectangle([0, HEADER_H + content_h, canvas_w, canvas_h], fill=(40, 40, 40))
    draw.text((16, HEADER_H + content_h + 12), spec.footer_note, fill=(210, 210, 210), font=small_font)
    return canvas


def generate_comparison(spec: ComparisonSpec, base_url: str) -> Path:
    spec.out_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"  PDF page {spec.pdf_page + 1} …")
    pdf_img, pdf_scale = render_pdf_page(spec.pdf_path, spec.pdf_page, spec.viewport_w)
    print(f"  Browser {base_url}{spec.url} …")
    browser_img = capture_browser(spec, base_url)
    comparison = build_comparison(spec, pdf_img, browser_img, pdf_scale, base_url)
    comparison.save(spec.out_path, quality=92)
    print(f"  Saved {spec.out_path}")
    temp = spec.out_path.parent / f"_temp_{spec.out_path.stem}.png"
    if temp.exists():
        temp.unlink(missing_ok=True)
    return spec.out_path
