#!/usr/bin/env python3
"""
merge_uttrykk_b2.py
Merges uttrykk-b2-new.json into uttrykk-b2.json without duplicates.
Deduplicates on 'norsk'. Sorts result by norsk alphabetically.
Writes result back to uttrykk-b2.json in-place.

Usage:
    python3 merge_uttrykk_b2.py
    python3 merge_uttrykk_b2.py --dry-run
"""

import json
import argparse
from pathlib import Path

BASE_DIR     = Path("/Users/shinichiokada/Svelte/svelte-languages/norskeord/src/lib/data")
BASE_FILE    = BASE_DIR / "uttrykk-b2.json"
NEW_FILE     = BASE_DIR / "uttrykk-b2-new.json"


def main():
    parser = argparse.ArgumentParser(description="Merge uttrykk-b2-new.json into uttrykk-b2.json")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--base", type=Path, default=BASE_FILE)
    parser.add_argument("--new",  type=Path, default=NEW_FILE)
    args = parser.parse_args()

    base_path = args.base.resolve()
    new_path  = args.new.resolve()

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

    print(f"\nuttrykk-b2.json     : {len(base):>4} entries")
    print(f"uttrykk-b2-new.json : {len(new):>4} entries")

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

    print(f"\nAfter merge         : {len(merged):>4} entries (+{len(added)} added, {len(skipped)} duplicates skipped)")

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

    print(f"\nDone. uttrykk-b2.json written with {len(merged)} entries, sorted alphabetically.")


if __name__ == "__main__":
    main()