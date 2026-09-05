#!/usr/bin/env bash
# Vercel has no SSH key for this repo, so the private norskeord-data
# submodule can't check out over the git@github.com:... URL the way it
# does locally. This swaps in a PAT-authenticated HTTPS URL, but only on
# Vercel (or anywhere DATA_REPO_TOKEN is set) — locally, SSH already works
# and this script is a no-op.
# See ai-docs/implementation/data-protection.md, Phase 4.
set -euo pipefail

if [ -z "${DATA_REPO_TOKEN:-}" ]; then
  echo "DATA_REPO_TOKEN not set — assuming local SSH access, skipping."
  exit 0
fi

if [ -n "$(ls -A src/lib/data 2>/dev/null)" ]; then
  echo "src/lib/data already populated, skipping submodule init."
  exit 0
fi

echo "Initializing src/lib/data submodule via PAT..."
git config submodule.src/lib/data.url \
  "https://x-access-token:${DATA_REPO_TOKEN}@github.com/shinokada/norskeord-data.git"
git submodule update --init --recursive
