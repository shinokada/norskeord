#!/usr/bin/env node
/**
 * split-c-uttrykk-large-groups.mjs
 *
 * Splits the four largest C-level uttrykk groups in uttrykk-c.json into 12 smaller,
 * meaning-based groups (all new slugs are uttrykk-only; no vocab-c.json content):
 *
 *   success-and-failure            49
 *   reprimand-and-insult           44
 *   power-and-confrontation        41
 *   character-and-attitude         39
 *   deception-and-secrets          27
 *   judgement-and-understanding    27
 *   cooperation-and-relationships  25
 *   activity-and-idleness          22
 *   timing-and-change              19
 *   composure-and-temper           13
 *   wisdom-and-lessons             13
 *   boasting-and-pride             12
 *
 * Sources (uttrykk-c.json only):
 *   interpersonal-conflict-expressions (104) + interpersonal-conflict-idiomatic-expressions (25)
 *   abstract-action-idioms (97), behavioral-idioms (78)
 *   proverbs: only the 27 non-`ordtak` entries move; the 46 real ordtak stay in `proverbs`.
 *
 * The four source slugs also exist in vocab-c.json (7/30/15/44 entries), so they stay in
 * CATEGORIES_BY_LEVEL.C; this script never touches vocab-c.json.
 *
 * Assignments are an explicit, hand-reviewed id → slug map, so re-runs are deterministic.
 *
 * Usage:
 *   node scripts/split-c-uttrykk-large-groups.mjs --dry-run   ← try this first
 *   node scripts/split-c-uttrykk-large-groups.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const UTTRYKK_FILE = path.join(PROJECT_ROOT, 'src/lib/data/uttrykk-c.json');

const DRY_RUN = process.argv.slice(2).includes('--dry-run');

const SOURCE_SLUGS = new Set([
  'interpersonal-conflict-expressions',
  'interpersonal-conflict-idiomatic-expressions',
  'abstract-action-idioms',
  'behavioral-idioms',
  'proverbs'
]);

// slug → space-separated numeric part of the entry id ("w-" prefix omitted)
const GROUPS = {
  'composure-and-temper':
    '006444 007187 009303 009500 009575 009686 009687 009695 009709 009802 010002 011401 011407',
  'power-and-confrontation':
    '006481 007301 007393 007604 007810 009365 009442 009468 009498 009651 009660 009661 009666 009671 009694 009737 009742 009778 009809 009814 009828 009842 009874 009909 009936 009937 009939 010650 010654 011337 011338 011341 011343 011350 011354 011361 011373 011391 011396 011402 011408',
  'deception-and-secrets':
    '006507 006605 006626 006639 007004 007498 007714 009327 009518 009654 009683 009692 009696 009717 009720 009727 009729 009751 009752 009761 009844 009877 009907 009979 011376 011393 011400',
  'activity-and-idleness':
    '006585 007447 007603 007617 007804 007870 009302 009360 009407 009426 009562 009657 009684 009760 009762 009763 009767 009770 009774 009789 010023 011352',
  'wisdom-and-lessons':
    '006632 006995 006997 009384 009482 009533 009647 009658 009678 009726 009869 010012 010027',
  'reprimand-and-insult':
    '006726 006886 006993 007418 007713 007738 007790 007828 009304 009335 009338 009356 009372 009410 009411 009470 009531 009616 009698 009730 009735 009740 009750 009758 009775 009820 009849 009862 009896 009915 009916 009945 009962 009974 010017 010032 010102 010131 011347 011349 011359 011360 011363 011374',
  'cooperation-and-relationships':
    '007423 007871 009378 009439 009441 009499 009543 009586 009617 009631 009662 009665 009723 009755 009803 009812 009885 009911 009984 010068 010559 010593 011368 011369 011390',
  'timing-and-change':
    '007680 007879 009279 009316 009381 009509 009515 009561 009615 009627 009646 009753 009961 010062 010125 010661 010671 010675 011367',
  'success-and-failure':
    '007681 007792 009425 009430 009464 009483 009522 009538 009565 009605 009624 009625 009629 009668 009676 009681 009690 009697 009699 009719 009724 009733 009736 009765 009776 009779 009782 009783 009784 009894 009918 009952 009956 009965 009969 009978 009981 009992 009993 010005 010011 010025 010036 010043 010126 011357 011383 011392 011405',
  'character-and-attitude':
    '009349 009361 009377 009428 009447 009455 009584 009593 009667 009721 009731 009738 009747 009808 009818 009825 009826 009827 009830 009837 009889 009890 009895 009928 009930 009935 009940 009966 009976 009998 010066 010076 010077 011342 011358 011365 011366 011382 011388',
  'judgement-and-understanding':
    '009399 009422 009444 009506 009563 009592 009640 009652 009653 009711 009785 009823 009871 009898 009946 009986 010006 010034 010038 010088 010112 011348 011364 011375 011379 011380 011386',
  'boasting-and-pride':
    '009573 009672 009689 009759 009824 009840 009843 009886 009963 009964 009975 011336'
};

const SLUG_BY_ID = new Map();
for (const [slug, ids] of Object.entries(GROUPS)) {
  for (const n of ids.split(/\s+/)) {
    const id = `w-${n}`;
    if (SLUG_BY_ID.has(id)) {
      console.error(`❌ Duplicate id in GROUPS: ${id}`);
      process.exit(1);
    }
    SLUG_BY_ID.set(id, slug);
  }
}

// Entries that stay where they are: the real proverbs.
const staysPut = (e) => e.category === 'proverbs' && e.kind === 'ordtak';

function main() {
  if (DRY_RUN) console.log('🔍 DRY RUN — no files will be modified\n');

  const data = JSON.parse(fs.readFileSync(UTTRYKK_FILE, 'utf8'));
  const byId = new Map(data.map((e) => [e.id, e]));

  // Every source entry must be mapped, except the real proverbs.
  const unmapped = data.filter(
    (e) => SOURCE_SLUGS.has(e.category) && !staysPut(e) && !SLUG_BY_ID.has(e.id)
  );
  if (unmapped.length > 0) {
    console.error(`❌ ${unmapped.length} source entries have no mapping — aborting:`);
    for (const e of unmapped) console.error(`   ${e.id}  [${e.category}]  ${e.lemma}`);
    process.exit(1);
  }

  // Every mapped id must exist, sit in a source slug, and not be a real proverb.
  const bad = [...SLUG_BY_ID.keys()].filter((id) => {
    const e = byId.get(id);
    return !e || !SOURCE_SLUGS.has(e.category) || staysPut(e);
  });
  if (bad.length > 0) {
    console.error(`❌ ${bad.length} mapped ids are missing or already moved — aborting:`);
    console.error('   ' + bad.join(', '));
    process.exit(1);
  }

  const counts = {};
  for (const slug of SLUG_BY_ID.values()) counts[slug] = (counts[slug] ?? 0) + 1;
  console.log(`Entries to reassign: ${SLUG_BY_ID.size}\n\nNew group sizes:`);
  for (const [slug, n] of Object.entries(counts)) console.log(`  ${slug.padEnd(32)} ${n}`);

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete — no files written.');
    return;
  }

  const bakPath = UTTRYKK_FILE + '.bak-large-groups';
  try {
    fs.copyFileSync(UTTRYKK_FILE, bakPath, fs.constants.COPYFILE_EXCL);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    console.log(`\nℹ️  Backup already exists at ${bakPath} — not overwriting.`);
  }

  const newData = data.map((e) =>
    SLUG_BY_ID.has(e.id) ? { ...e, category: SLUG_BY_ID.get(e.id) } : e
  );

  const leftovers = newData.filter(
    (e) =>
      e.category !== 'proverbs' &&
      [
        'interpersonal-conflict-expressions',
        'interpersonal-conflict-idiomatic-expressions',
        'abstract-action-idioms',
        'behavioral-idioms'
      ].includes(e.category)
  );
  if (leftovers.length > 0) {
    console.error(`❌ ${leftovers.length} entries still carry a source slug — aborting write.`);
    process.exit(1);
  }

  fs.writeFileSync(UTTRYKK_FILE, JSON.stringify(newData, null, 2) + '\n', 'utf8');
  console.log(`\n✅ Done — reassigned ${SLUG_BY_ID.size} entries in uttrykk-c.json.`);
  console.log(`   Backup: ${bakPath} (delete after committing)`);
}

main();
