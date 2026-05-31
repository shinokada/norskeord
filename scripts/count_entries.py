#!/usr/bin/env python3
"""
count_entries.py
Counts entries in each vocab/uttrykk JSON file.

Usage:
    python3 count_entries.py
"""

import json
from pathlib import Path

BASE_DIR = Path("/Users/shinichiokada/Svelte/svelte-languages/norskeord/src/lib/data")

FILES = [
    "uttrykk-a1.json",
    "uttrykk-a2.json",
    "uttrykk-b1.json",
    "uttrykk-b2.json",
    "vocab-a1.json",
    "vocab-a2.json",
    "vocab-b1.json",
    "vocab-b2.json",
    "vocab-c1.json",
    "vocab-c2.json",
]


def main():
    total = 0
    print(f"{'File':<25} {'Entries':>7}")
    print("-" * 34)
    for filename in FILES:
        path = BASE_DIR / filename
        if not path.exists():
            print(f"{filename:<25} {'NOT FOUND':>7}")
            continue
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        count = len(data)
        total += count
        print(f"{filename:<25} {count:>7}")
    print("-" * 34)
    print(f"{'TOTAL':<25} {total:>7}")


if __name__ == "__main__":
    main()