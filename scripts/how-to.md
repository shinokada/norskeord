# How to use scripts

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
