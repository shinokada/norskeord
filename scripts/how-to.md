# How to use scripts

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