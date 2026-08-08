#!/usr/bin/env python3
"""
resolve_arbeidsbok_dupes.py (one-off, Phase 3 cleanup)

1. Drops any draft entry whose 'norsk' (case-insensitive, exact) already
   exists in production vocab-*.json / uttrykk-*.json.
2. Resolves within-draft duplicate groups (same word once gender/plural/
   ubøy./'å ' markers are stripped) by merging into ONE entry per group:
     - keeps the most "complete" entry as the base (most non-empty fields)
     - appends any distinct 'note' text found on sibling duplicates
     - appends any distinct 'definition' text found on sibling duplicates
       only if meaningfully different from the base's definition
   Does NOT touch the 55 normalized-vs-production matches — those still
   need a manual per-entry review pass.

Usage:
    python scripts/resolve_arbeidsbok_dupes.py

Outputs (in scripts/outputs/):
    - arbeidsbok-resolved.json      cleaned entries ready for Phase 4
    - arbeidsbok-resolution-log.txt human-readable log of every removal/merge
"""
import json
import os
import re
from collections import defaultdict

GENDER_PATTERN = re.compile(r'\s*\((en|et|ei|en/ei|en/et|en/men)\)$', re.IGNORECASE)
PLURAL_PATTERN = re.compile(r'\s*\((b\.)?pl\.\)$', re.IGNORECASE)
UBOYELIG_PATTERN = re.compile(r'\s*\(ubøy\.\)$', re.IGNORECASE)
VERB_PREFIX = re.compile(r'^å\s+')


def normalize_norsk(s):
    s = (s or '').strip().lower()
    s = GENDER_PATTERN.sub('', s)
    s = PLURAL_PATTERN.sub('', s)
    s = UBOYELIG_PATTERN.sub('', s)
    s = VERB_PREFIX.sub('', s)
    return s.strip()


def completeness_score(entry):
    """More non-empty fields + longer note/definition = more complete."""
    fields = ['note', 'definition', 'verb_type', 'part', 'lemma', 'reference']
    score = 0
    for f in fields:
        val = entry.get(f)
        if val:
            score += 1
            score += len(str(val)) * 0.01  # tie-break on richer text
    return score


# ---------------------------------------------------------------------------
# Paths (works whether run from project root or scripts/)
# ---------------------------------------------------------------------------
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
base = os.path.join(project_root, "src", "lib", "data")

prod_files = {
    'A1': os.path.join(base, 'vocab-a1.json'),
    'A1-uttrykk': os.path.join(base, 'uttrykk-a1.json'),
    'A2': os.path.join(base, 'vocab-a2.json'),
    'A2-uttrykk': os.path.join(base, 'uttrykk-a2.json'),
    'B1': os.path.join(base, 'vocab-b1.json'),
    'B1-uttrykk': os.path.join(base, 'uttrykk-b1.json'),
    'B2': os.path.join(base, 'vocab-b2.json'),
    'B2-uttrykk': os.path.join(base, 'uttrykk-b2.json'),
    'C': os.path.join(base, 'vocab-c.json'),
    'C-uttrykk': os.path.join(base, 'uttrykk-c.json'),
}
draft_path = os.path.join(
    project_root, 'draft', 'c', 'i-samme-baat-arbeidsbok',
    'extracted-vocabularliste-clean.json'
)

outputs_dir = os.path.join(script_dir, "outputs")
os.makedirs(outputs_dir, exist_ok=True)
resolved_path = os.path.join(outputs_dir, "arbeidsbok-resolved.json")
log_path = os.path.join(outputs_dir, "arbeidsbok-resolution-log.txt")

# ---------------------------------------------------------------------------
# Load production exact-match set
# ---------------------------------------------------------------------------
prod_exact = defaultdict(list)  # norsk_lower -> [(level, category), ...]
for level, path in prod_files.items():
    if not os.path.exists(path):
        print(f"⚠️  Skipping missing file: {path}")
        continue
    with open(path, encoding='utf-8') as f:
        entries = json.load(f)
    for e in entries:
        norsk = e.get('norsk', '').strip()
        cat = e.get('category', '?')
        prod_exact[norsk.lower()].append((level, cat))

# ---------------------------------------------------------------------------
# Load draft
# ---------------------------------------------------------------------------
with open(draft_path, encoding='utf-8') as f:
    draft_entries = json.load(f)

log = []
log.append(f"Draft entries loaded: {len(draft_entries)}")

# ---------------------------------------------------------------------------
# Step 1: drop exact production matches
# ---------------------------------------------------------------------------
kept_after_exact = []
dropped_exact = []
for e in draft_entries:
    norsk = e.get('norsk', '').strip()
    key = norsk.lower()
    if key in prod_exact:
        dropped_exact.append((e, prod_exact[key]))
    else:
        kept_after_exact.append(e)

log.append(f"\n=== STEP 1: Dropped exact production matches ({len(dropped_exact)}) ===\n")
for e, matches in dropped_exact:
    parts = ", ".join(f"{lv}[{cat}]" for lv, cat in matches)
    log.append(f"  DROPPED {e.get('norsk')!r:40s} (already in {parts})")

# ---------------------------------------------------------------------------
# Step 2: resolve within-draft duplicate groups (by normalized key)
# ---------------------------------------------------------------------------
groups = defaultdict(list)
for e in kept_after_exact:
    norm_key = normalize_norsk(e.get('norsk', ''))
    groups[norm_key].append(e)

resolved = []
merge_log = []
for norm_key, group in groups.items():
    if len(group) == 1:
        resolved.append(group[0])
        continue

    # pick the most complete entry as base
    base = max(group, key=completeness_score)
    others = [e for e in group if e is not base]

    # merge distinct notes
    base_note = (base.get('note') or '').strip()
    extra_notes = []
    for e in others:
        n = (e.get('note') or '').strip()
        if n and n != base_note and n not in extra_notes:
            extra_notes.append(n)
    if extra_notes:
        merged_note = base_note
        for n in extra_notes:
            merged_note = f"{merged_note} | {n}" if merged_note else n
        base['note'] = merged_note

    # merge distinct definitions (only if different from base's)
    base_def = (base.get('definition') or '').strip()
    extra_defs = []
    for e in others:
        d = (e.get('definition') or '').strip()
        if d and d != base_def and d not in extra_defs:
            extra_defs.append(d)
    if extra_defs:
        merged_def = base_def
        for d in extra_defs:
            merged_def = f"{merged_def}; {d}" if merged_def else d
        base['definition'] = merged_def

    resolved.append(base)
    merge_log.append((norm_key, base, others))

log.append(f"\n=== STEP 2: Resolved within-draft duplicate groups ({len(merge_log)}) ===\n")
for norm_key, base, others in merge_log:
    log.append(f"  GROUP {norm_key!r}")
    log.append(f"    KEPT   {base.get('norsk')!r}  note={base.get('note','')!r}  def={base.get('definition','')!r}")
    for e in others:
        log.append(f"    MERGED {e.get('norsk')!r}  note={e.get('note','')!r}  def={e.get('definition','')!r}")
    log.append("")

# ---------------------------------------------------------------------------
# Write outputs
# ---------------------------------------------------------------------------
with open(resolved_path, 'w', encoding='utf-8') as f:
    json.dump(resolved, f, ensure_ascii=False, indent=2)

summary = [
    f"Draft entries loaded:            {len(draft_entries)}",
    f"Dropped (exact prod match):      {len(dropped_exact)}",
    f"Within-draft groups merged:      {len(merge_log)}",
    f"Entries removed by merging:      {sum(len(others) for _, _, others in merge_log)}",
    f"Final resolved entry count:      {len(resolved)}",
]
print("\n".join(summary))

with open(log_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(summary) + "\n")
    f.write("\n".join(log))

print(f"\nResolved entries written to: {resolved_path}")
print(f"Log written to:              {log_path}")
