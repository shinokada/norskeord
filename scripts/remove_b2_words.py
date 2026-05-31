#!/usr/bin/env python3
"""
remove_b2_words.py
Removes 17 words (being moved to A2) from vocab-b2.json.

Usage:
    python3 remove_b2_words.py
    python3 remove_b2_words.py --dry-run
"""

import json
import argparse
from pathlib import Path

B2_FILE = Path("/Users/shinichiokada/Svelte/svelte-languages/norskeord/src/lib/data/vocab-b2.json")

WORDS_TO_REMOVE = {
    "faktisk",
    "en krig",
    "en gud",
    "i tillegg",
    "med andre ord",
    "ettersom",
    "frihet",
    "en kjærlighet",
    "en vennskap",
    "en ekteskap",
    "en prest",
    "en prøve",
    "en professor",
    "en kunde",
    "et kontinent",
    "et klima",
    "en vulkan",
}


def main():
    parser = argparse.ArgumentParser(description="Remove 17 downgraded words from vocab-b2.json")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--file", type=Path, default=B2_FILE, help="Path to vocab-b2.json")
    args = parser.parse_args()

    b2_path = args.file.resolve()
    print(f"Target file: {b2_path}")

    if not b2_path.exists():
        print(f"ERROR: File not found: {b2_path}")
        return

    with open(b2_path, encoding="utf-8") as f:
        b2 = json.load(f)

    kept = []
    removed = []
    for entry in b2:
        if entry["norsk"] in WORDS_TO_REMOVE:
            removed.append(entry)
        else:
            kept.append(entry)

    not_found = WORDS_TO_REMOVE - {e["norsk"] for e in removed}

    print(f"vocab-b2.json currently has {len(b2)} entries.")
    print(f"\nWords to REMOVE ({len(removed)}):")
    for e in removed:
        print(f"  - {e['norsk']!r:<22} [{e['category']}]")

    if not_found:
        print(f"\nWords not found in B2 — nothing to do ({len(not_found)}):")
        for w in sorted(not_found):
            print(f"  ? {w!r}")

    if args.dry_run:
        print("\nDry run — no changes written.")
        return

    with open(b2_path, "w", encoding="utf-8") as f:
        json.dump(kept, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"\nDone. vocab-b2.json now has {len(kept)} entries (-{len(removed)} removed).")


if __name__ == "__main__":
    main()