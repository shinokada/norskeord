#!/usr/bin/env python3
"""
merge_vocab.py
Merges a vocab-*-new.json file into its corresponding vocab-*.json,
deduplicates on the 'norsk' field, then sorts the result by category
(then by norsk within each category). Writes the result back in-place.

Usage:
    python3 merge_vocab.py --base vocab-b1.json --new vocab-b1-new.json
    python3 merge_vocab.py --base vocab-b2.json --new vocab-b2-new.json
    python3 merge_vocab.py --base vocab-b2.json --new vocab-b2-new.json --dry-run

Paths are resolved relative to src/lib/data/ next to the scripts/ folder
unless an absolute path is given.
"""

import json
import argparse
from pathlib import Path

DEFAULT_DATA_DIR = Path(__file__).resolve().parent.parent / "src" / "lib" / "data"


def main():
    parser = argparse.ArgumentParser(description="Merge and sort vocab JSON files")
    parser.add_argument("--base", type=Path, required=True, help="Base vocab file (e.g. vocab-b1.json)")
    parser.add_argument("--new",  type=Path, required=True, help="New entries file (e.g. vocab-b1-new.json)")
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

    # Merge: existing entries take priority on duplicates
    existing_norsk = {e["norsk"] for e in base}
    added   = []
    skipped = []
    for entry in new:
        if entry["norsk"] in existing_norsk:
            skipped.append(entry["norsk"])
        else:
            added.append(entry)
            existing_norsk.add(entry["norsk"])

    merged = base + added

    # Sort by category, then norsk within each category
    merged.sort(key=lambda e: (e["category"], e["norsk"]))

    # Category summary
    cats: dict[str, int] = {}
    for e in merged:
        cats[e["category"]] = cats.get(e["category"], 0) + 1

    print(f"\nAfter merge : {len(merged):>4} entries (+{len(added)} added, {len(skipped)} duplicates skipped)")
    print(f"\nCategory breakdown:")
    for cat, count in sorted(cats.items()):
        print(f"  {cat:<25} {count:>3}")

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

    print(f"\nDone. {base_path.name} written with {len(merged)} entries, sorted by category.")


if __name__ == "__main__":
    main()
