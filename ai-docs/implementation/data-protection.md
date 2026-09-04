# Protecting src/lib/data when the repo goes public

## My take, up front

Making `norskeord` public (to unlock CodeRabbit review) is fine for the
codebase — the actual risk is `src/lib/data/*.json`: the vocab, uttrykk, and
grammar decks are the product's content IP, and a public repo puts them in
plain sight (and in git history, forever, even if removed later).

The fix: **move `src/lib/data` into a separate private repo
(`norskeord-data`) and pull it in via a git submodule.** No paid npm plan
needed, no encrypt/decrypt logic in the app, and the public repo never
contains the data at any point in its history going forward.

Encrypting the files in place (`git-crypt`, custom AES+env var) was the
other option considered — rejected because it still leaves plaintext data
in every build's working tree/cache, needs key distribution to CI, and
doesn't solve "already-public git history" any more cleanly than just not
including the files.

## Current state

- `src/lib/data/*.json` (vocab, uttrykk, grammar, norskproven, stats) lives
  directly in the `norskeord` repo, committed to git history.
- Data is already loaded **server-side only** — `[level]/[category]/+page.server.ts`
  dynamic-imports the JSON so it's never bundled into client chunks. Good:
  the only exposure from going public is the git repo itself, not the
  shipped app.
- Build-time scripts (`pnpm stats`, `pnpm grammar:split` — see `package.json`
  `build` script) also read directly from `src/lib/data` on disk.
- Repo is deployed via Vercel (`vercel.json` present).

## What changes

- `src/lib/data` is removed from `norskeord` and becomes its own private
  repo, added back as a git submodule at the same path. Everything that
  currently does `import('$lib/data/xyz.json')` or reads the folder from a
  build script keeps working unmodified, since the submodule resolves to
  the same path on disk once checked out.
- Vercel is given access to the private `norskeord-data` repo so the
  submodule can be checked out during the build, same as it already has
  access to `norskeord`.

## Implementation steps

### Phase 1 — Create the private data repo

1. `mkdir norskeord-data && cd norskeord-data && git init`
2. Copy `src/lib/data/*` into it, commit, push to a new **private** GitHub
   repo (`gh repo create norskeord-data --private --source=. --push`).
3. Sanity check: confirm no `.bak` / `.bak2` files get carried over
   (`uttrykk-b1.json.bak`, `vocab-b1.json.bak`, `vocab-c.json.bak2` currently
   sit in `src/lib/data` — drop these, they're stray, not needed downstream).

### Phase 2 — Swap the public repo over

1. `git rm -r src/lib/data && git commit -m "chore: move data to private submodule"`.
2. `git submodule add git@github.com:shinokada/norskeord-data.git src/lib/data`.
3. Commit the resulting `.gitmodules` + submodule pointer.

This only fixes `HEAD` going forward. See Phase 3 — it's not optional.

### Phase 3 — Purge history, tags, and releases before flipping public

**Why this phase exists:** removing `src/lib/data` at `HEAD` does nothing
about old commits. Every past commit's tree still has the JSON in it, and
GitHub's "Source code (zip)" / "(tar.gz)" links on a release aren't stored
files — they're generated on request from that tag's commit. So any
existing release, tag, or just `git clone` of full history still hands out
the data once the repo is public, regardless of what Phase 2 did. Deleting
the Releases alone doesn't fix this — the commits behind them are still
reachable by anyone browsing or cloning the repo.

The repo being **still private right now is the only cheap window** to fix
this properly — rewrite history while nobody outside can see it, instead
of doing it later as an incident response.

**Does `git rm` do this?** No — `git rm -r src/lib/data && git commit` (Phase 2)
only stops the path existing in *new* commits going forward. Every commit
made *before* that one still has the full files in its tree, and `git log`/
`git show <old-sha>:src/lib/data/vocab-b1.json` still retrieves them
forever, exactly like Phase 2's own note above says. `git filter-repo` is
the tool that actually does what you're picturing — it's effectively
running that same `git rm` **retroactively, on every commit in the
repo's history**, then rewriting every downstream commit SHA (and tag) to
match. That's step 2 below.

0. **Before scrubbing, account for anyone who already has a copy of the
   current history** — this is the one thing a rewrite *can't* fix
   retroactively:
   - **Collaborators who've already cloned the repo.** Each of their local
     clones keeps the old history with the data in it regardless of what
     you force-push. Not a public-exposure risk by itself (they're already
     trusted with repo access), but they'll need to re-clone or hard-reset
     after the rewrite rather than just `git pull` (a normal pull/merge on
     top of rewritten history gets messy fast).
   - **Forks.** Private repos can only be forked by collaborators or within
     the same GitHub org — check Settings → General → "Forks" (or
     `gh api repos/shinokada/norskeord/forks`) for any that exist. Any fork
     keeps the pre-scrub history independently; it won't inherit the
     rewrite automatically. If any exist, either delete them or ask the
     fork owner to re-fork after the scrub.
   - **CI/deploy caches** (Vercel's own git cache, any GitHub Actions
     runners) can hold a stale clone too — not public-facing, but worth a
     mental note that a redeploy right after the force-push is the way to
     confirm Vercel picked up the rewritten history rather than a cached copy.
   - If none of these apply (solo repo, no forks, no other clones) — which
     is the common case for a project like this — skip straight to step 1.

   **Confirmed for this repo (2026-09-04): no collaborators, no forks, no
   other clones exist.** Step 0 is a non-issue — go straight to step 1
   whenever you're ready to run the scrub.
1. Make a fresh mirror clone to work on (don't do this in your working copy):
   ```bash
   git clone --mirror git@github.com:shinokada/norskeord.git norskeord-scrub
   cd norskeord-scrub
   ```
2. Strip `src/lib/data` from every commit, on every branch and tag, using
   [`git filter-repo`](https://github.com/newren/git-filter-repo) (the
   modern, correct tool for this — not `filter-branch` or BFG for path
   removal with tag rewriting):
   ```bash
   git filter-repo --path src/lib/data --invert-paths
   ```
   This rewrites every commit SHA that touched the path, including ones
   behind existing tags.
3. Force-push the rewritten history and tags back:
   ```bash
   git push --force --all
   git push --force --tags
   ```
4. **Recreate the GitHub Releases.** Rewriting history changes the tag SHAs,
   which detaches existing Releases from their (now gone) original commits.
   For each existing release: note its tag name + release notes, then
   either edit it in the GitHub UI to confirm it now points at the rewritten
   tag, or delete and recreate with `gh release create v1.2.3 --notes-file
   notes.md` — the important part is that the tag itself was force-pushed in
   step 3, so a recreated release at the same tag name now points at the
   scrubbed commit.
5. Sanity check before going further: `git clone` the repo fresh into a
   throwaway directory, `git log --all --full-history -- src/lib/data` should
   return nothing, and downloading a release zip should not contain
   `src/lib/data`.
6. Only proceed to Phase 4 once step 5 is confirmed clean.

If for some reason history can't be rewritten (long-lived forks depending
on old SHAs, etc.), the fallback is accepting that historical data is
permanently exposed once public and this whole migration only protects
data added *after* that point — worth spelling out as a real tradeoff
rather than assuming Phase 2 alone covers it.

### Phase 4 — CI / Vercel access

1. Confirm the Vercel GitHub App integration has access to **both**
   `norskeord` and `norskeord-data` (Vercel → Project → Git → the
   installation must list `norskeord-data` as an accessible repo). If it's
   currently scoped to "only select repositories," add `norskeord-data`
   there — this is usually sufficient and needs no token.
2. Fallback if Vercel can't see private submodules directly: generate a
   fine-grained GitHub PAT (read-only, scoped to `norskeord-data`), add it
   as a Vercel env var (`DATA_REPO_TOKEN`), and rewrite the submodule URL to
   use it at build time, e.g. a `prepare`/`prebuild` step:
   ```bash
   git config submodule.src/lib/data.url \
     https://x-access-token:${DATA_REPO_TOKEN}@github.com/shinokada/norskeord-data.git
   git submodule update --init --recursive
   ```
3. Verify `git submodule update --init --recursive` actually runs before
   `pnpm build` in the Vercel build log (Vercel auto-detects submodules in
   most cases — confirm rather than assume, since `pnpm stats` and
   `grammar:split` need the files on disk before `vite build` runs).

### Phase 5 — Local dev

1. Update `README.md` clone instructions: `git clone --recurse-submodules
git@github.com:shinokada/norskeord.git`, or for an existing clone:
   `git submodule update --init`.
2. Anyone without access to `norskeord-data` can still clone/run
   `norskeord` for code review — `src/lib/data` just stays empty, and
   pages that read from it return empty decks rather than failing the
   build outright (worth a quick check that `vocabLoaders`/`uttrykkLoaders`
   fail gracefully on a missing file, not a hard crash — separate task if
   they don't today).

### Phase 6 — Flip the repo to public

1. Only after Phase 4 is verified working end-to-end on a real Vercel
   deploy (not just locally) — a broken submodule checkout mid-migration is
   the main risk here.
2. Flip `norskeord` to public on GitHub, confirm CodeRabbit picks it up.
3. Confirm `norskeord-data` stays private and is not referenced by URL
   anywhere public-facing (it isn't — submodule pointer is just a commit
   SHA + repo URL, not browsable without access).

## Impact on the new-vocab-uttrykk-pipeline

(`ai-docs/implementation/new-vocab-uttrykk-pipeline.md`) — Stages 1–4 are
unaffected (they only read/write inside `draft/new-entries/{batch}/`,
never touch `src/lib/data`). Stages 5 and 6 do touch it, and both still
work exactly as documented **for the file read/write part** — the
submodule checks out to the same path on disk, so `copy_file_user_to_claude`,
`edit_file`, and `move_file` against `src/lib/data/{kind}-{level}.json`
behave identically. What changes is what happens _after_ the write:

- **Today:** Stage 6 writes production files, then `git status`/`git diff`
  in `norskeord` shows the change; a commit there is the whole story.
- **After the submodule move:** those writes land inside the
  `norskeord-data` submodule, not `norskeord` itself. `git status` in the
  parent repo will just show `src/lib/data` as "modified (new commits)" —
  it won't show the actual JSON diff. Two commits are needed, in order:
  1. Inside `src/lib/data`: `git add -A && git commit -m "batch NN: +N
vocab, +N uttrykk" && git push` (commits/pushes to `norskeord-data`).
  2. Back in `norskeord` root: `git add src/lib/data && git commit -m
"chore: bump data submodule (batch NN)"` — this bumps the submodule
     pointer so the deployed app picks up the new commit.
- **Claude can't do either commit itself.** The Filesystem tool only
  reads/writes files on the user's machine — no git commands — and
  `bash_tool` runs in Claude's own sandbox, not the user's. So Stage 6's
  existing "Checkpoint 4 (final): spot-check merged entries" step grows a
  second half: after spot-checking, run the two commits above yourself
  before the batch is actually live. Worth adding as an explicit line to
  Stage 6 in the pipeline doc so it isn't missed.
- **`.bak` files land in the submodule too** — reinforces the open
  question below about gitignoring them there; otherwise every batch's
  backup file becomes a permanent part of `norskeord-data` history.
- Stage 5's "copy production file to Claude's sandbox to compute the
  highest existing ID" step is unaffected — it's a read against whatever
  is currently checked out locally, submodule or not.

## Other scripts that touch src/lib/data (audit)

Checked every script in `scripts/` for reads/writes against `src/lib/data`.
Beyond `stats` (`generate-stats.mjs`) and `search:index`
(`build-search-index.ts`), already known:

| Script                                                                                                 | package.json alias                           | Reads `lib/data`                    | Writes `lib/data`                                              | Impact                                                                                                                   |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ----------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `build-grammar-level-index.mjs`                                                                        | `grammar:split` (runs on every `pnpm build`) | `grammar.json`                      | `grammar-a1.json`…`grammar-c.json`, `grammar-topic-index.json` | **Same problem as `stats`** — writes land in the submodule.                                                              |
| `generate-stats.mjs`                                                                                   | `stats` (runs on every `pnpm build`)         | all vocab/uttrykk/grammar files     | `stats.json`                                                   | Already flagged — includes a `generatedAt` timestamp, so **every build dirties the submodule even with no data change.** |
| `build-search-index.ts`                                                                                | `search:index`                               | all vocab/uttrykk files             | `static/data/search-index.json`                                | Outside the submodule (already gitignored per its own header comment) — no impact.                                       |
| `check-spelling.ts`                                                                                    | `check:spelling`                             | vocab/uttrykk files                 | — (read-only)                                                  | No impact, works unmodified against the submodule checkout.                                                              |
| `generate-og.mjs`                                                                                      | `og`, `og:blog`, `og:decks`                  | `src/lib/types.ts` (not `lib/data`) | `static/og/*.png`                                              | No impact.                                                                                                               |
| `generate-lessons.ts`                                                                                  | `generate:lessons`                           | —                                   | —                                                              | Marked "not used any more" in its own header; unrelated (Supabase + Claude API).                                         |
| `check-message-keys.mjs`, `check-unused-keys.mjs`, `check-category-keys.ts`, `check-language-sync.mjs` | `check:i18n`, `check:languages`, etc.        | `messages/`, `src/**`               | `messages/*.json` (with `--fix`)                               | No impact — none of these touch `lib/data`.                                                                              |

So the full "writes into the submodule" list is: **`stats` and `grammar:split`** — both chained into `pnpm build` itself, not just the data pipeline.

## Solution — fold generation into the commit step, and stop committing pure timestamp noise

Two changes, both to how Stage 6 (and `pnpm build` generally) are used
once the submodule is live:

1. **Run generation before the submodule commit, not after.** Add to the
   end of Stage 6, before the two commits described above:
   ```bash
   pnpm stats                # always — updates src/lib/data/stats.json
   pnpm grammar:split        # only if this batch touched grammar.json
   ```
   Then `git add -A` inside `src/lib/data` picks up the regenerated files
   alongside the merged vocab/uttrykk JSON, so one submodule commit covers
   everything instead of the derived files drifting out of sync until the
   next unrelated build happens to regenerate them.
2. **Make `stats.json`'s timestamp not count as a real diff.** Right now
   `generatedAt: new Date().toISOString()` means _any_ local `pnpm build`
   — even just testing something unrelated — leaves `norskeord-data` with
   an uncommitted one-line change. Two options, pick one:
   - **Ignore it:** add `stats.json` to `norskeord-data/.gitignore` and
     drop it from the repo entirely; `pnpm build` still generates it fresh
     locally and on Vercel, so nothing actually needs it committed — it's
     a build artifact like `search-index.json` already is, just
     mis-homed inside `lib/data` today. Simplest fix, and consistent with
     how `search-index.json` is already treated.
     - Requires checking nothing imports `stats.json` as a static
       pre-built file rather than expecting it fresh from the last build
       (quick grep for `stats.json` under `src/routes` before doing this).
   - **Keep it committed, but stop the noise:** change `generatedAt` to
     only update when the actual counts change (compare against the
     previous file's `byLevel`/`grandTotal` before writing). More
     surgical, but more code to maintain for something `.gitignore`
     already solves.
     Recommendation: gitignore it inside `norskeord-data` unless something
     downstream genuinely needs a committed, human-readable stats snapshot.
3. **Gitignore `.bak`/`.bak2` files in `norskeord-data`.** Stage 5's backup
   convention (`uttrykk-b1.json.bak`, `vocab-c.json.bak2`, etc.) currently
   leaves these sitting in `src/lib/data` — harmless in the old setup, but
   in the submodule they'd otherwise become permanent history in
   `norskeord-data` every time a batch runs. Add to
   `norskeord-data/.gitignore`:
   ```
   *.bak
   *.bak2
   ```

## Open questions

- Confirm nothing reads a _committed_ `stats.json` expecting it to be
  pre-built (vs. always regenerated at build time) before gitignoring it.
- Update Stage 6 of `new-vocab-uttrykk-pipeline.md` to spell out the
  two-commit (submodule + pointer bump) step, plus the `pnpm stats` /
  `grammar:split` pre-commit step above, once this migration lands.
