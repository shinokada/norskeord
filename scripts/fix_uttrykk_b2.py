#!/usr/bin/env python3
"""
fix_uttrykk_b2.py
Sets category="uttrykk" and part="phrase" on every entry in uttrykk-b2-new.json.

Usage:
    python3 fix_uttrykk_b2.py
    python3 fix_uttrykk_b2.py --dry-run
"""

import json
import argparse
from pathlib import Path

FILE = Path("/Users/shinichiokada/Svelte/svelte-languages/norskeord/src/lib/data/uttrykk-b2-new.json")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--file", type=Path, default=FILE)
    args = parser.parse_args()

    path = args.file.resolve()
    print(f"Target file: {path}")

    if not path.exists():
        print(f"ERROR: File not found: {path}")
        return

    with open(path, encoding="utf-8") as f:
        entries = json.load(f)

    changed = 0
    for e in entries:
        if e.get("category") != "uttrykk" or e.get("part") != "phrase":
            e["category"] = "uttrykk"
            e["part"] = "phrase"
            changed += 1

    print(f"Total entries : {len(entries)}")
    print(f"Updated       : {changed}")
    print(f"Already correct: {len(entries) - changed}")

    if args.dry_run:
        print("\nDry run — no changes written.")
        return

    with open(path, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"\nDone. All entries now have category='uttrykk' and part='phrase'.")


if __name__ == "__main__":
    main()