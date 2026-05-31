#!/usr/bin/env python3
"""
merge_uttrykk.py
Merges a uttrykk-*-new.json file into its corresponding uttrykk-*.json,
deduplicates on the 'norsk' field, then sorts the result alphabetically
by norsk. Writes the result back in-place.

Usage:
    python3 merge_uttrykk.py --base uttrykk-b1.json --new uttrykk-b1-new.json
    python3 merge_uttrykk.py --base uttrykk-b2.json --new uttrykk-b2-new.json
    python3 merge_uttrykk.py --base uttrykk-b2.json --new uttrykk-b2-new.json --dry-run

Paths are resolved relative to src/lib/data/ next to the scripts/ folder
unless an absolute path is given.
"""

import json
import argparse
from pathlib import Path

DEFAULT_DATA_DIR = Path(__file__).resolve().parent.parent / "src" / "lib" / "data"


def main():
    parser = argparse.ArgumentParser(description="Merge and sort uttrykk JSON files")
    parser.add_argument("--base", type=Path, required=True, help="Base uttrykk file (e.g. uttrykk-b1.json)")
    parser.add_argument("--new",  type=Path, required=True, help="New entries file (e.g. uttrykk-b1-new.json)")
    parser.add_argument("--dry-run", action="store_true",   help="Preview counts without writing")
    args = parser.parse_args()

    # Resolve relative paths against the data directory
    base_path = args.base if args.base.is_absolute() else DEFAULT_DATA_DIR / args.base
    new_path  = args.new  if args.new.is_absolute()  else DEFAULT_DATA_DIR / args.new
    base_path = base_path.resolve()
    new_path  = new_path.resolve()

    print(f"Base file : {base_path}")
    print(f"New file  : {new_path}")

    for p in (base_path, new_path):
        if not p.exists():
            print(f"ERROR: File not found: {p}")
            return

    with open(base_path, encoding="utf-8") as f:
        base = json.load(f)
    with open(new_path, encoding="utf-8") as f:
        new = json.load(f)

    print(f"\n{base_path.name:<30} {len(base):>4} entries")
    print(f"{new_path.name:<30} {len(new):>4} entries")

    existing = {e["norsk"] for e in base}
    added   = []
    skipped = []
    for entry in new:
        if entry["norsk"] in existing:
            skipped.append(entry["norsk"])
        else:
            added.append(entry)
            existing.add(entry["norsk"])

    merged = base + added
    merged.sort(key=lambda e: e["norsk"].lower())

    print(f"\nAfter merge : {len(merged):>4} entries (+{len(added)} added, {len(skipped)} duplicates skipped)")

    if skipped:
        print(f"\nSkipped duplicates ({len(skipped)}):")
        for w in sorted(skipped):
            print(f"  = {w!r}")

    if args.dry_run:
        print("\nDry run — no changes written.")
        return

    with open(base_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"\nDone. {base_path.name} written with {len(merged)} entries, sorted alphabetically.")


if __name__ == "__main__":
    main()
