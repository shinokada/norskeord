#!/usr/bin/env python3
"""
merge_b2.py
Merges vocab-b2-new.json into vocab-b2.json, deduplicates on the
'norsk' field, then sorts the result by category (then by norsk within
each category).  Writes the result back to vocab-b2.json in-place.

Usage:
    python3 merge_b2.py
    python3 merge_b2.py --dry-run     # preview counts, no write
"""

import json
import argparse
from pathlib import Path

BASE_DIR = Path("/Users/shinichiokada/Svelte/svelte-languages/norskeord/src/lib/data")
B2_FILE     = BASE_DIR / "vocab-b2.json"
B2_NEW_FILE = BASE_DIR / "vocab-b2-new.json"


def main():
    parser = argparse.ArgumentParser(description="Merge and sort vocab-b2 files")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--b2",     type=Path, default=B2_FILE,     help="Path to vocab-b2.json")
    parser.add_argument("--b2-new", type=Path, default=B2_NEW_FILE, help="Path to vocab-b2-new.json")
    args = parser.parse_args()

    b2_path     = args.b2.resolve()
    b2_new_path = args.b2_new.resolve()

    print(f"Base file : {b2_path}")
    print(f"New file  : {b2_new_path}")

    for p in (b2_path, b2_new_path):
        if not p.exists():
            print(f"ERROR: File not found: {p}")
            return

    with open(b2_path, encoding="utf-8") as f:
        b2 = json.load(f)
    with open(b2_new_path, encoding="utf-8") as f:
        b2_new = json.load(f)

    print(f"\nvocab-b2.json     : {len(b2):>4} entries")
    print(f"vocab-b2-new.json : {len(b2_new):>4} entries")

    # Merge: existing entries take priority on duplicates
    existing_norsk = {e["norsk"] for e in b2}
    added = []
    skipped = []
    for entry in b2_new:
        if entry["norsk"] in existing_norsk:
            skipped.append(entry["norsk"])
        else:
            added.append(entry)
            existing_norsk.add(entry["norsk"])

    merged = b2 + added

    # Sort by category, then norsk within each category
    merged.sort(key=lambda e: (e["category"], e["norsk"]))

    # Category summary
    cats: dict[str, int] = {}
    for e in merged:
        cats[e["category"]] = cats.get(e["category"], 0) + 1

    print(f"\nAfter merge       : {len(merged):>4} entries (+{len(added)} added, {len(skipped)} duplicates skipped)")
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

    with open(b2_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"\nDone. vocab-b2.json written with {len(merged)} entries, sorted by category.")


if __name__ == "__main__":
    main()