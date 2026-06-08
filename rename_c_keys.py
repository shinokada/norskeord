#!/usr/bin/env python3
"""
Run from the norskeord project root:
  python3 rename_c_keys.py

Renames C1/C2 i18n keys in messages/en.json and messages/nb.json
to match the merged C level.
"""

import json
import re
import sys
from pathlib import Path

# ── Key rename map ────────────────────────────────────────────────────────────
# Keys to REMOVE (replaced by merged equivalents):
REMOVE = {
    "nav_c1",
    "nav_c2",
    "home_level_c2",
    "plus_unlocked_c2_label",
    "plus_unlocked_c2_teaser",
    # All category_c2_* will be renamed to category_c_* below
}

# Keys to RENAME (old_key -> new_key):
RENAME = {
    "home_level_c1": "home_level_c",
    "plus_unlocked_c1_label": "plus_unlocked_c_label",
    "plus_unlocked_c1_teaser": "plus_unlocked_c_teaser",
}

# category_c1_* -> category_c_*
# category_c2_* -> category_c_*  (C2 categories merge into same namespace, no slug collisions)

# ── Value updates for en.json ─────────────────────────────────────────────────
EN_VALUE_UPDATES = {
    "home_level_c": "C — Mastery",          # was "C1 — Advanced"; C2 was "C2 — Mastery"
    "plus_unlocked_c_label": "C — Mastery",
    "plus_unlocked_c_teaser": "+18 categories including rhetoric, linguistics, diplomacy, archaic usage, proverbs, advanced law, neuroscience, and more.",
    "home_hero_badge": "Norwegian learning — A1 to C",
    "home_hero_body": "Vocabulary flashcards, grammar practice, quizzes, and Norskprøven preparation — all in one place, from A1 to C.",
    "home_subheading": "Practice Norwegian vocabulary from A1 to C. Pick a level and a category to get started.",
}

# ── Value updates for nb.json ─────────────────────────────────────────────────
NB_VALUE_UPDATES = {
    "home_level_c": "C — Mestringsnivå",
    "plus_unlocked_c_label": "C — Mestringsnivå",
    "plus_unlocked_c_teaser": "+18 kategorier inkludert retorikk, lingvistikk, diplomati, arkaisk språk, ordtak, avansert juss, nevrovitenskap og mer.",
    "home_hero_badge": "Norsk ordforråd og fraser",
    "home_hero_body": "Alt du trenger for å lære norsk — vokabular-flashkort, grammatikkøvelser, quiz og Norskprøven-forberedelse. Alt på ett sted, fra A1 til C.",
    "home_subheading": "Øv norsk ordforråd fra A1 til C. Velg et nivå og en kategori for å begynne.",
}


def process(path: Path, value_updates: dict) -> None:
    raw = path.read_text(encoding="utf-8")
    data: dict = json.loads(raw)

    new_data: dict = {}
    for key, value in data.items():
        # Skip removed keys
        if key in REMOVE:
            print(f"  REMOVE  {key}")
            continue

        # Rename exact keys
        if key in RENAME:
            new_key = RENAME[key]
            print(f"  RENAME  {key}  ->  {new_key}")
            new_data[new_key] = value
            continue

        # Rename category_c1_* -> category_c_*
        if key.startswith("category_c1_"):
            new_key = "category_c_" + key[len("category_c1_"):]
            print(f"  RENAME  {key}  ->  {new_key}")
            new_data[new_key] = value
            continue

        # Rename category_c2_* -> category_c_*
        if key.startswith("category_c2_"):
            new_key = "category_c_" + key[len("category_c2_"):]
            print(f"  RENAME  {key}  ->  {new_key}")
            new_data[new_key] = value
            continue

        # Keep as-is
        new_data[key] = value

    # Apply value updates
    for key, new_value in value_updates.items():
        if key in new_data:
            old = new_data[key]
            if old != new_value:
                print(f"  VALUE   {key}")
                print(f"          old: {old}")
                print(f"          new: {new_value}")
            new_data[key] = new_value
        else:
            print(f"  WARNING: value update key not found: {key}")

    out = json.dumps(new_data, ensure_ascii=False, indent=2)
    path.write_text(out + "\n", encoding="utf-8")
    print(f"  Written: {path}")


def main():
    root = Path(".")
    en = root / "messages" / "en.json"
    nb = root / "messages" / "nb.json"

    if not en.exists():
        print(f"ERROR: {en} not found. Run from the project root.", file=sys.stderr)
        sys.exit(1)

    print(f"\n=== en.json ===")
    process(en, EN_VALUE_UPDATES)

    print(f"\n=== nb.json ===")
    process(nb, NB_VALUE_UPDATES)

    print("\nDone. Re-run `pnpm dev` (or the Paraglide compile step) to regenerate messages.")


if __name__ == "__main__":
    main()