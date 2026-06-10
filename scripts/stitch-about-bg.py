"""Stack About kaleidoscope tiles (Figma 367:10269–10271) into about-page-bg.png."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

FILL = (248, 246, 242)


def load_rgb(path: Path) -> Image.Image:
    im = Image.open(path)
    if im.mode == "RGBA":
        base = Image.new("RGB", im.size, FILL)
        base.paste(im, mask=im.split()[3])
        return base
    return im.convert("RGB")


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: stitch-about-bg.py tile1.png tile2.png ... out.png", file=sys.stderr)
        sys.exit(1)
    *tile_paths, out_path = sys.argv[1:]
    tiles = [load_rgb(Path(p)) for p in tile_paths]
    w = max(t.size[0] for t in tiles)
    h = sum(t.size[1] for t in tiles)
    out = Image.new("RGB", (w, h), FILL)
    y = 0
    for t in tiles:
        out.paste(t, (0, y))
        y += t.size[1]
    out.save(out_path, optimize=True)
    print(out_path, out.size)


if __name__ == "__main__":
    main()
