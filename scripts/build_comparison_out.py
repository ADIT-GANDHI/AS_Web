"""Regenerate PDF vs localhost comparisons and package them for upload.

Creates: Comparison_Out/
  README.md
  index.html
  PDFs/
  Home/<screen>/comparison_*.png
  Songs/<screen>/comparison_*.png
  Poems/ … Reflections/ … etc.

Usage:
  python scripts/build_comparison_out.py              # regenerate + pack
  python scripts/build_comparison_out.py --pack-only  # pack existing captures only
"""
from __future__ import annotations

import argparse
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Comparison_Out"
sys.path.insert(0, str(ROOT / "scripts"))

from generate_all_pdf_comparisons import (  # noqa: E402
    BASE_URL,
    HOME_PDF,
    SONGS_PDF,
    about_specs,
    collect_specs,
    films_specs,
    filter_comparison_specs,
    glossary_specs,
    home_specs,
    module_pdf,
    people_specs,
    poems_specs,
    radio_specs,
    reflections_specs,
    retry_failed_specs,
    songs_specs,
)
from generate_song_detail_comparison import crop_video_zone  # noqa: E402
from module_pdf_paths import ensure_module_pdfs  # noqa: E402
from pdf_comparison_common import generate_comparison  # noqa: E402
from PIL import Image  # noqa: E402

PACKAGES: tuple[tuple[str, callable], ...] = (
    ("Home", home_specs),
    ("Songs", songs_specs),
    ("Poems", poems_specs),
    ("Reflections", reflections_specs),
    ("People", people_specs),
    ("Films", films_specs),
    ("About", about_specs),
    ("Glossary", glossary_specs),
    ("Radio", radio_specs),
)

INDEX_ROWS: list[tuple[str, str, str, str]] = []

PDF_MANIFEST: tuple[tuple[Path, str, str], ...] = (
    (HOME_PDF, HOME_PDF.name, "Home & News module (7 pages)"),
    (SONGS_PDF, SONGS_PDF.name, "Songs module (3 pages)"),
    (module_pdf("poems"), "3.Poems_01.05.2025.pdf", "Poems module (4 pages)"),
    (module_pdf("reflections"), "4.Reflection_01.05.2025.pdf", "Reflections module (4 pages)"),
    (module_pdf("people"), "5.People_01.05.2025.pdf", "People module (3 pages)"),
    (module_pdf("films"), "6.FilmMain+Detail_01.05.2025.pdf", "Films module (4 pages)"),
    (module_pdf("about"), "7.About_01.05.2025.pdf", "About module (5 pages)"),
    (module_pdf("glossary"), "8.Glossary_01.05.2025.pdf", "Glossary module (1 page)"),
    (module_pdf("radio"), "9.Radio_01.05.2025.pdf", "Radio module (2 pages)"),
)


def regenerate_all(*, retry_failed: bool = False) -> list[str]:
    errors: list[str] = []
    ensure_module_pdfs()
    specs = retry_failed_specs() if retry_failed else collect_specs("all")
    specs = filter_comparison_specs(specs)
    print(f"Base URL: {BASE_URL}")
    print(f"Regenerating {len(specs)} comparison screen(s)…\n")

    for i, spec in enumerate(specs, 1):
        label = spec.out_path.parent.name
        print(f"[{i}/{len(specs)}] {label}")
        try:
            generate_comparison(spec, BASE_URL)
        except Exception as exc:  # noqa: BLE001
            msg = f"{label}: {exc}"
            print(f"  ERROR — {msg}")
            errors.append(msg)
            if not spec.out_path.exists():
                continue

    print("\nGenerating song detail video zone crop …")
    full_path = ROOT / "Songs_Localhost_Comparison" / "3_Song_Details" / "comparison_song_detail_full.png"
    zone_path = ROOT / "Songs_Localhost_Comparison" / "3_Song_Details" / "comparison_song_detail_video_zone.png"
    try:
        if full_path.exists():
            full = Image.open(full_path)
            panel_w = (full.width - 32) // 2
            crop_video_zone(full, panel_w).save(zone_path, quality=92)
            print(f"  Saved {zone_path.relative_to(ROOT)}")
        else:
            errors.append("song detail video zone: missing comparison_song_detail_full.png")
    except Exception as exc:  # noqa: BLE001
        errors.append(f"song detail video zone: {exc}")

    return errors


def copy_asset(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)


def build_out_folder() -> list[str]:
    global INDEX_ROWS
    INDEX_ROWS = []
    missing: list[str] = []

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    pdf_dir = OUT / "PDFs"
    pdf_dir.mkdir()
    for pdf_path, pdf_name, _desc in PDF_MANIFEST:
        if pdf_path.exists():
            copy_asset(pdf_path, pdf_dir / pdf_name)
        else:
            missing.append(f"PDF missing: {pdf_path.relative_to(ROOT)}")

    extra_songs = (
        ROOT
        / "Songs_Localhost_Comparison"
        / "3_Song_Details"
        / "comparison_song_detail_video_zone.png"
    )

    for module, spec_fn in PACKAGES:
        for spec in filter_comparison_specs(spec_fn()):
            rel_folder = spec.out_path.parent.relative_to(ROOT / f"{module}_Localhost_Comparison")
            dest = OUT / module / rel_folder / spec.out_path.name
            if spec.out_path.exists():
                copy_asset(spec.out_path, dest)
                INDEX_ROWS.append((module, str(rel_folder), spec.out_path.name, spec.url))
            else:
                missing.append(f"Comparison missing: {spec.out_path.relative_to(ROOT)}")

        if module == "Songs" and extra_songs.exists():
            dest = OUT / "Songs" / "3_Song_Details" / extra_songs.name
            copy_asset(extra_songs, dest)
            INDEX_ROWS.append(("Songs", "3_Song_Details", extra_songs.name, "/songs/details (video zone crop)"))

    readme = OUT / "README.md"
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# PDF vs Localhost Comparison Pack",
        "",
        f"Generated: **{stamp}**",
        "",
        "Side-by-side captures: **PDF (left)** · **localhost (right)** with red alignment guides.",
        "",
        "## Contents",
        "",
        "### Reference PDFs (`PDFs/`)",
    ]
    for _path, pdf_name, desc in PDF_MANIFEST:
        lines.append(f"- `{pdf_name}` — {desc}")

    for module, _spec_fn in PACKAGES:
        lines.extend(
            [
                "",
                f"### {module} screens (`{module}/`)",
                "",
                "| Folder | Route | File |",
                "|--------|-------|------|",
            ]
        )
        for mod, folder, fname, route in INDEX_ROWS:
            if mod != module:
                continue
            lines.append(f"| `{folder}` | `{route}` | `{fname}` |")

    lines.extend(
        [
            "",
            "## Regenerate",
            "",
            "```powershell",
            '$env:PLAYWRIGHT_BASE_URL="http://127.0.0.1:3000"',
            "npx next dev -p 3000",
            "python scripts/build_comparison_out.py",
            "```",
            "",
            "Open `index.html` in a browser for a quick visual index.",
        ]
    )
    readme.write_text("\n".join(lines) + "\n", encoding="utf-8")

    cards = []
    for module, folder, fname, route in INDEX_ROWS:
        img_rel = f"{module}/{folder}/{fname}".replace("\\", "/")
        title = f"{module} · {folder.replace('_', ' ')}"
        cards.append(
            f"""    <section class="card">
      <h2>{title}</h2>
      <p class="meta">Route: <code>{route}</code></p>
      <a href="{img_rel}"><img src="{img_rel}" alt="{title}" loading="lazy" /></a>
    </section>"""
        )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ajab Shahar — PDF vs Localhost Comparisons</title>
  <style>
    body {{ font-family: system-ui, sans-serif; margin: 0; background: #f5f5f3; color: #333; }}
    header {{ background: #fff; border-bottom: 1px solid #ddd; padding: 24px 32px; }}
    h1 {{ margin: 0 0 8px; font-size: 1.5rem; }}
    .stamp {{ color: #666; font-size: 0.9rem; }}
    main {{ padding: 24px 32px 48px; display: grid; gap: 32px; }}
    .card {{ background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 16px; }}
    .card h2 {{ margin: 0 0 8px; font-size: 1.1rem; }}
    .meta {{ margin: 0 0 12px; color: #666; font-size: 0.85rem; }}
    img {{ max-width: 100%; height: auto; border: 1px solid #ccc; display: block; }}
    code {{ background: #eee; padding: 2px 6px; border-radius: 4px; }}
  </style>
</head>
<body>
  <header>
    <h1>PDF vs Localhost — Comparison Pack</h1>
    <p class="stamp">Generated {stamp} · Viewport 1440px · Red guides on both panels</p>
  </header>
  <main>
{chr(10).join(cards)}
  </main>
</body>
</html>
"""
    (OUT / "index.html").write_text(html, encoding="utf-8")
    return missing


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Comparison_Out upload folder")
    parser.add_argument(
        "--pack-only",
        action="store_true",
        help="Skip Playwright regeneration; package existing comparison PNGs only",
    )
    parser.add_argument(
        "--retry-failed",
        action="store_true",
        help="Regenerate only the five previously failing screens, then repack",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=None,
        help="Output pack folder (default: Comparison_Out at repo root)",
    )
    parser.add_argument(
        "--skip-news-popup",
        action="store_true",
        help="Skip Home PDF page 2 (AJAB News popup on /)",
    )
    args = parser.parse_args()

    global OUT
    OUT = (args.out_dir or (ROOT / "Comparison_Out")).resolve()
    if args.skip_news_popup:
        os.environ["COMPARISON_SKIP_NEWS_POPUP"] = "1"

    regen_errors: list[str] = []
    if args.pack_only:
        print("Skipping regeneration (--pack-only).\n")
    else:
        regen_errors = regenerate_all(retry_failed=args.retry_failed)

    missing = build_out_folder()

    print(f"\nPackaged upload folder: {OUT}")
    print(f"  Screens indexed: {len(INDEX_ROWS)}")
    pdf_count = len(list((OUT / "PDFs").glob("*.pdf"))) if (OUT / "PDFs").exists() else 0
    print(f"  PDFs: {pdf_count} file(s)")

    if regen_errors:
        print("\nRegeneration warnings:")
        for err in regen_errors:
            print(f"  - {err}")

    if missing:
        print("\nMissing assets in upload pack:")
        for item in missing:
            print(f"  - {item}")
        raise SystemExit(1)

    print("\nDone — Comparison_Out is ready to upload.")


if __name__ == "__main__":
    main()
