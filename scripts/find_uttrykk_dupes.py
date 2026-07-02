#!/usr/bin/env python3
"""
find_uttrykk_dupes.py
Find duplicate 'norsk' entries across uttrykk-XX.json files.
Excludes uttrykk-XX-preview.json files (they are subsets of the main files).

Usage:
    python scripts/find_uttrykk_dupes.py
"""
import json
import os
from collections import defaultdict

# Works whether run from project root or scripts/
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
base = os.path.join(project_root, "src", "lib", "data")

files = {
    'A1': os.path.join(base, 'uttrykk-a1.json'),
    'A2': os.path.join(base, 'uttrykk-a2.json'),
    'B1': os.path.join(base, 'uttrykk-b1.json'),
    'B2': os.path.join(base, 'uttrykk-b2.json'),
    'C': os.path.join(base, 'uttrykk-c.json'),
    'C-draft': os.path.join(project_root, 'draft', 'c', 'uttrykk-c-new.json'),
}

data_by_file = {}
counts = {}
for level, path in files.items():
    if not os.path.exists(path):
        print(f"⚠️  Skipping missing file: {path}")
        continue
    with open(path, encoding='utf-8') as f:
        data_by_file[level] = json.load(f)
    counts[level] = len(data_by_file[level])

print(f"Entry counts: {counts}")
total = sum(counts.values())
print(f"Total entries: {total}\n")

# norsk_lower -> list of (original_norsk, level, category)
norsk_map = defaultdict(list)
for level, entries in data_by_file.items():
    for entry in entries:
        norsk = entry.get('norsk', '').strip()
        cat = entry.get('category', '?')
        key = norsk.lower()
        norsk_map[key].append((norsk, level, cat))

within = {}
cross = {}
for k, entries in norsk_map.items():
    if len(entries) < 2:
        continue
    levels = [e[1] for e in entries]
    if len(set(levels)) == 1:
        within[k] = entries
    else:
        cross[k] = entries

output = []
output.append(f"=== CROSS-FILE DUPLICATES ({len(cross)}) ===")
output.append("(Same 'norsk' value appears in different level files)")
output.append("")
for k in sorted(cross.keys()):
    entries = cross[k]
    parts = "  |  ".join(f"{e[1]} [{e[2]}]" for e in entries)
    output.append(f"  {entries[0][0]!r:60s}  →  {parts}")

output.append("")
output.append(f"=== WITHIN-FILE DUPLICATES ({len(within)}) ===")
output.append("(Same 'norsk' value appears twice in the same file)")
output.append("")
for k in sorted(within.keys()):
    entries = within[k]
    parts = "  |  ".join(f"{e[1]} [{e[2]}]" for e in entries)
    output.append(f"  {entries[0][0]!r:60s}  →  {parts}")

result_text = "\n".join(output)
print(result_text)

# Write report next to this script
out_path = os.path.join(script_dir, "uttrykk_duplicate_report.txt")
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(f"Entry counts: {counts}\n")
    f.write(f"Total entries: {total}\n\n")
    f.write(result_text)
print(f"\nResults written to: {out_path}")
