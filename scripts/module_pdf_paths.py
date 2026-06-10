"""PDF source locations and module comparison folder layout."""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDF_SOURCE = Path(r"d:\Mihir_Avni\Ajab_Old\PDFS")

MODULE_PDFS: dict[str, tuple[Path, Path]] = {
    "poems": (PDF_SOURCE / "3.Poems_01.05.2025.pdf", ROOT / "Poems_Localhost_Comparison"),
    "reflections": (PDF_SOURCE / "4.Reflection_01.05.2025.pdf", ROOT / "Reflections_Localhost_Comparison"),
    "people": (PDF_SOURCE / "5.People_01.05.2025.pdf", ROOT / "People_Localhost_Comparison"),
    "films": (PDF_SOURCE / "6.FilmMain+Detail_01.05.2025.pdf", ROOT / "Films_Localhost_Comparison"),
    "about": (PDF_SOURCE / "7.About_01.05.2025.pdf", ROOT / "About_Localhost_Comparison"),
    "glossary": (PDF_SOURCE / "8.Glossary_01.05.2025.pdf", ROOT / "Glossary_Localhost_Comparison"),
    "radio": (PDF_SOURCE / "9.Radio_01.05.2025.pdf", ROOT / "Radio_Localhost_Comparison"),
}


def ensure_module_pdfs() -> list[str]:
    """Copy module PDFs into comparison folders. Returns list of missing sources."""
    missing: list[str] = []
    for _key, (src, dest_dir) in MODULE_PDFS.items():
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / src.name
        if not src.exists():
            missing.append(str(src))
            continue
        if not dest.exists() or src.stat().st_mtime > dest.stat().st_mtime:
            shutil.copy2(src, dest)
    return missing
