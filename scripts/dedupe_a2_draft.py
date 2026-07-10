#!/usr/bin/env python3
"""
dedupe_a2_draft.py

Removes duplicate entries from the A2 draft files:
  - draft/a2/extracted-vocab-a2.json
  - draft/a2/extracted-uttrykk-a2.json

A draft entry is removed if:
  1. Its 'norsk' value (case-insensitive, trimmed) already exists in one
     of the official level files. This mirrors the exact scope used by
     scripts/find_dupes.py:
       - extracted-vocab-a2.json is checked against ALL official vocab
         AND uttrykk files (A1, A2, B1, B2, C).
       - extracted-uttrykk-a2.json is checked against ALL official
         uttrykk files only (A1, A2, B1, B2, C).
  2. It duplicates another entry earlier in the same draft file (the
     first occurrence is kept, later ones are dropped).

A timestamped backup of each draft file is written to scripts/outputs/
before it is overwritten, and a full report of everything removed is
written to scripts/outputs/dedupe-a2-draft-report.txt.

Usage (run from project root):
    python scripts/dedupe_a2_draft.py
    python scripts/dedupe_a2_draft.py --dry-run   # report only, no writes
"""
import json
import os
import sys
import shutil
import datetime

# Works whether run from project root or scripts/
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
data_dir = os.path.join(project_root, "src", "lib", "data")
draft_dir = os.path.join(project_root, "draft", "a2")
outputs_dir = os.path.join(script_dir, "outputs")

DRY_RUN = "--dry-run" in sys.argv


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def norm(s):
    return (s or "").strip().lower()


def build_reference_set(paths):
    s = set()
    for p in paths:
        if not os.path.exists(p):
            print(f"  ⚠️  Skipping missing reference file: {p}")
            continue
        for entry in load(p):
            s.add(norm(entry.get("norsk", "")))
    return s


def dedupe_file(draft_path, reference_paths, label):
    if not os.path.exists(draft_path):
        print(f"⚠️  Draft file not found: {draft_path}")
        return None

    reference_set = build_reference_set(reference_paths)
    entries = load(draft_path)
    original_count = len(entries)

    kept = []
    removed_cross = []
    removed_within = []
    seen_in_draft = set()

    for entry in entries:
        key = norm(entry.get("norsk", ""))
        if key in reference_set:
            removed_cross.append(entry)
            continue
        if key in seen_in_draft:
            removed_within.append(entry)
            continue
        seen_in_draft.add(key)
        kept.append(entry)

    print(f"\n=== {label} ===")
    print(f"  Original entries                    : {original_count}")
    print(f"  Removed (already in official files) : {len(removed_cross)}")
    print(f"  Removed (duplicate within draft)     : {len(removed_within)}")
    print(f"  Remaining entries                    : {len(kept)}")

    if DRY_RUN:
        print("  (dry run — no files written)")
    else:
        os.makedirs(outputs_dir, exist_ok=True)
        timestamp = datetime.datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
        backup_name = f"{os.path.splitext(os.path.basename(draft_path))[0]}-backup-{timestamp}.json"
        backup_path = os.path.join(outputs_dir, backup_name)
        shutil.copy2(draft_path, backup_path)

        with open(draft_path, "w", encoding="utf-8") as f:
            json.dump(kept, f, ensure_ascii=False, indent="\t")
            f.write("\n")

        print(f"  Backup saved to  : {backup_path}")
        print(f"  Updated file     : {draft_path}")

    return {
        "label": label,
        "original": original_count,
        "removed_cross": removed_cross,
        "removed_within": removed_within,
        "kept": len(kept),
    }


def write_report(results):
    out_path = os.path.join(outputs_dir, "dedupe-a2-draft-report.txt")
    lines = []
    lines.append(f"Dedup run: {datetime.datetime.now().isoformat()}")
    lines.append(f"Mode: {'DRY RUN' if DRY_RUN else 'WRITE'}")
    lines.append("")
    for r in results:
        lines.append(f"=== {r['label']} ===")
        lines.append(f"Original entries: {r['original']}")
        lines.append(f"Removed (cross-file, already exists elsewhere): {len(r['removed_cross'])}")
        lines.append(f"Removed (duplicate within draft file): {len(r['removed_within'])}")
        lines.append(f"Remaining: {r['kept']}")
        lines.append("")
        if r["removed_cross"]:
            lines.append("-- Removed: already exists in an official file --")
            for e in sorted(r["removed_cross"], key=lambda x: norm(x.get("norsk", ""))):
                lines.append(f"  {e.get('norsk', '')!r}")
            lines.append("")
        if r["removed_within"]:
            lines.append("-- Removed: duplicate within the draft file itself --")
            for e in sorted(r["removed_within"], key=lambda x: norm(x.get("norsk", ""))):
                lines.append(f"  {e.get('norsk', '')!r}")
            lines.append("")

    os.makedirs(outputs_dir, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"\nFull report written to: {out_path}")


def main():
    print("Removing duplicates from A2 draft files...")
    if DRY_RUN:
        print("(DRY RUN — no files will be modified)")

    vocab_reference = [
        os.path.join(data_dir, "vocab-a1.json"),
        os.path.join(data_dir, "uttrykk-a1.json"),
        os.path.join(data_dir, "vocab-a2.json"),
        os.path.join(data_dir, "uttrykk-a2.json"),
        os.path.join(data_dir, "vocab-b1.json"),
        os.path.join(data_dir, "uttrykk-b1.json"),
        os.path.join(data_dir, "vocab-b2.json"),
        os.path.join(data_dir, "uttrykk-b2.json"),
        os.path.join(data_dir, "vocab-c.json"),
        os.path.join(data_dir, "uttrykk-c.json"),
    ]
    uttrykk_reference = [
        os.path.join(data_dir, "uttrykk-a1.json"),
        os.path.join(data_dir, "uttrykk-a2.json"),
        os.path.join(data_dir, "uttrykk-b1.json"),
        os.path.join(data_dir, "uttrykk-b2.json"),
        os.path.join(data_dir, "uttrykk-c.json"),
    ]

    results = []
    r1 = dedupe_file(
        os.path.join(draft_dir, "extracted-vocab-a2.json"),
        vocab_reference,
        "extracted-vocab-a2.json",
    )
    if r1:
        results.append(r1)

    r2 = dedupe_file(
        os.path.join(draft_dir, "extracted-uttrykk-a2.json"),
        uttrykk_reference,
        "extracted-uttrykk-a2.json",
    )
    if r2:
        results.append(r2)

    write_report(results)
    print("\nDone. Re-run scripts/find_dupes.py to verify.")


if __name__ == "__main__":
    main()
