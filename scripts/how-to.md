# How to use scripts

## add-language-translations.mjs

Populates `[language]` and `example_[language]` fields (e.g. `ukrainian` /
`example_ukrainian`) on entries in `src/lib/data/*.json` for multi-language
support. See `ai-docs/multi-language.md` for the field spec and
`ai-docs/ideas/multi-languages.md` for language priority/rationale.

```
# Set your API key (or put it in a .env file in the project root)
export ANTHROPIC_API_KEY=sk-ant-...

# Dry run first — pilot file is vocab-a1.json by default
node scripts/add-language-translations.mjs --language ukrainian --dry-run

# Run for real
node scripts/add-language-translations.mjs --language ukrainian

# Process a different file (or several, comma-separated)
node scripts/add-language-translations.mjs --language ukrainian --files vocab-a2.json
node scripts/add-language-translations.mjs --language ukrainian --files uttrykk-a1.json,uttrykk-a1-preview.json

# Smaller batches if you hit rate limits
node scripts/add-language-translations.mjs --language ukrainian --batch 10

# Re-process entries that already have the field (e.g. after a prompt tweak)
node scripts/add-language-translations.mjs --language ukrainian --force

# Add a new language later (e.g. Polish) — just swap --language,
# after adding it to LANGUAGE_CONFIG at the top of the script
node scripts/add-language-translations.mjs --language polish --files vocab-a1.json
```

Writes a `.bak` backup of each file before overwriting it.

## Find duplicates and apply the decisions

```
# Step 1 – analyse (calls Claude API, writes dupe_decisions.json)
export ANTHROPIC_API_KEY=sk-ant-...
node scripts/analyse_dupes.mjs

# Step 2 – preview what will be deleted (safe, no writes)
node scripts/apply_dupe_decisions.mjs --dry-run

# Step 3 – apply for real
node scripts/apply_dupe_decisions.mjs
```

## Merg files

```
# B1 --dry-run
python scripts/merge_vocab.py --base vocab-b1.json --new vocab-b1-new.json --dry-run
python scripts/merge_uttrykk.py --base uttrykk-b1.json --new uttrykk-b1-new.json --dry-run

python scripts/merge_vocab.py --base vocab-b1.json --new vocab-b1-new.json
python scripts/merge_uttrykk.py --base uttrykk-b1.json --new uttrykk-b1-new.json

# B2 (replaces merge_b2.py / merge_uttrykk_b2.py) --dry-run
python scripts/merge_vocab.py --base vocab-b2.json --new vocab-b2-new.json --dry-run
python scripts/merge_uttrykk.py --base uttrykk-b2.json --new uttrykk-b2-new.json --dry-run

python3 scripts/merge_vocab.py --base vocab-b2.json --new vocab-b2-new.json
python3 scripts/merge_uttrykk.py --base uttrykk-b2.json --new uttrykk-b2-new.json
```

## stats

```
# same as before — no change
pnpm stats

# new: summary + per-category breakdown for every level
pnpm stats -- --detail
```

## add-b2-fields.mjs

```
# Set your API key (or put it in a .env file in the same folder)
export ANTHROPIC_API_KEY=sk-ant-...

# Dry run first to see what it'll do
node add-b2-fields.mjs --dry-run

# Usage (from project root):
node scripts/add-b2-fields.mjs --files ./draft/flashcard/vocab-b2.json

# Usage (from scripts/ directory):
node add-b2-fields.mjs --files vocab-b2-combined.json

# Run for real (processes both combined files by default)
node add-b2-fields.mjs

# Process specific files
node add-b2-fields.mjs --files vocab-b2-combined.json

# Smaller batches if you hit rate limits
node add-b2-fields.mjs --batch 10
```
