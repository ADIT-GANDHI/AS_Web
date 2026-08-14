"""Rebuild AI vs live pairs without re-rendering PDFs."""
from pathlib import Path
import json
import importlib.util

spec = importlib.util.spec_from_file_location(
    "cmp", Path(__file__).with_name("build-poems-ai-comparisons.py")
)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

manifest = []
for i, item in enumerate(m.PAGE_MAP):
    ai = m.AI_DIR / f"pdf-p{item['pdf'] + 1:02d}.png"
    live = m.LIVE_DIR / item["live"]
    out = m.PAIR_DIR / f"pair-{i + 1:02d}.png"
    m.side_by_side(ai, live, out, item["label"], item["crop"])
    manifest.append(
        {
            "label": item["label"],
            "ai": str(ai.relative_to(m.OUT)) if ai.exists() else None,
            "live": str(live.relative_to(m.OUT)) if live.exists() else None,
            "pair": str(out.relative_to(m.OUT)) if out.exists() else None,
        }
    )

(m.OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print("pairs rebuilt", m.OUT)
