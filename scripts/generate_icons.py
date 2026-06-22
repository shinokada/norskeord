#!/usr/bin/env python3
"""
Regenerate Norskeord icons as full-bleed square Norwegian flags.
iOS/iPadOS clips to rounded rect automatically — no padding needed.
Move this to /static directory first, then run to generate icons in place, backing up originals to _icons_backup/.

Usage:
    cd /Users/shinichiokada/Svelte/svelte-languages/norskeord/static
    python3 generate_icons.py

Requires Pillow:  pip install Pillow
"""

from PIL import Image, ImageDraw
import shutil
from pathlib import Path

RED   = (239, 43,  45, 255)
WHITE = (255, 255, 255, 255)
BLUE  = (0,   40,  168, 255)

# Norwegian flag official proportions: 22 × 16 units
# White cross: x = 7–12, y = 5–10
# Blue cross:  x = 8–11, y = 6–9

def make_icon(size: int) -> Image.Image:
    ss  = 4          # supersampling for smooth edges
    big = size * ss

    img = Image.new("RGBA", (big, big), RED)
    d   = ImageDraw.Draw(img)

    ux = big / 22.0
    uy = big / 16.0

    # White cross
    d.rectangle([int(7*ux), 0,         int(12*ux), big       ], fill=WHITE)
    d.rectangle([0,         int(5*uy),  big,        int(10*uy)], fill=WHITE)

    # Blue cross
    d.rectangle([int(8*ux), 0,         int(11*ux), big      ], fill=BLUE)
    d.rectangle([0,         int(6*uy),  big,       int(9*uy) ], fill=BLUE)

    return img.resize((size, size), Image.LANCZOS)

ICONS = {
    "apple-touch-icon.png":       180,
    "android-chrome-192x192.png": 192,
    "android-chrome-512x512.png": 512,
    "favicon-32x32.png":           32,
    "favicon-16x16.png":           16,
}

def main():
    static_dir = Path(__file__).parent
    backup_dir = static_dir / "_icons_backup"
    backup_dir.mkdir(exist_ok=True)

    for fname, sz in ICONS.items():
        src = static_dir / fname
        bak = backup_dir / fname
        if src.exists() and not bak.exists():
            shutil.copy2(src, bak)
            print(f"  backed up → {bak.relative_to(static_dir)}")

        make_icon(sz).save(src, "PNG", optimize=True)
        print(f"  ✓  {fname:40s}  {sz}×{sz}")

    print(f"\nOriginals saved in {backup_dir.name}/ — delete when happy.")

if __name__ == "__main__":
    main()