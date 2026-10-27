#!/usr/bin/env node
/**
 * split-b2-figurative-idioms.mjs
 *
 * Splits the 339-entry `figurative-idioms` bucket in uttrykk-b2.json into 9
 * smaller groups (mixed scheme: imagery for animals/body, meaning for the rest).
 *
 *   animal-idioms              57   imagery  (fisk, hest, hund, katt, høne…)
 *   body-idioms                45   imagery  (finger, hode, øye, tann…)
 *   money-and-cost             16   meaning
 *   success-and-failure        63   meaning
 *   effort-and-work            19   meaning
 *   communication-and-thinking 42   meaning
 *   emotions-and-attitudes     31   meaning
 *   social-and-conflict        50   meaning
 *   timing-and-change          16   meaning
 *
 * Imagery wins over meaning when an idiom fits both ("ha grønne fingre" →
 * body-idioms). Assignments are an explicit id → slug map (hand-reviewed), not
 * keyword rules, so re-running is deterministic.
 *
 * Only touches entries whose category is currently 'figurative-idioms', so a
 * repeat run after a successful migration is a no-op.
 *
 * Usage:
 *   node scripts/split-b2-figurative-idioms.mjs --dry-run   ← try this first
 *   node scripts/split-b2-figurative-idioms.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const UTTRYKK_FILE = path.join(PROJECT_ROOT, 'src/lib/data/uttrykk-b2.json');
const SOURCE_SLUG = 'figurative-idioms';

const DRY_RUN = process.argv.slice(2).includes('--dry-run');

// slug → space-separated numeric part of the entry id ("w-" prefix omitted)
const GROUPS = {
  'animal-idioms':
    '008987 010938 011076 011086 011131 011133 011135 011140 011141 011143 011146 011147 011150 011153 011157 011164 011165 011166 011167 011169 011171 011172 011173 011174 011175 011176 011177 011179 011181 011182 011183 011186 011190 011192 011195 011196 011197 011200 011203 011205 011206 011207 011208 011209 011210 011215 011216 011217 011219 011220 011222 011223 011225 011228 011229 011248 011282',
  'body-idioms':
    '008751 008808 008853 009000 009003 009046 009212 010760 010766 010774 010966 010969 010970 010975 010982 010985 010994 011008 011009 011013 011024 011037 011061 011240 011241 011243 011245 011247 011254 011255 011256 011257 011258 011259 011260 011265 011274 011276 011277 011288 011289 011303 011311 011314 011319',
  'money-and-cost':
    '008781 010367 010756 011038 011040 011041 011042 011043 011044 011046 011047 011048 011049 011050 011051 011052',
  'success-and-failure':
    '008746 008747 008825 008848 008993 008994 009121 009122 009150 010301 010319 010331 010462 010466 010470 010897 010898 010900 010901 010902 010903 010904 010912 010913 010914 010915 010916 010917 010922 010923 010927 010928 010937 010944 010955 010957 010965 010999 011000 011022 011034 011056 011058 011059 011060 011062 011063 011064 011066 011068 011083 011096 011097 011145 011251 011252 011261 011281 011285 011286 011315 011316 011317',
  'effort-and-work':
    '008755 010776 010924 010925 010932 010946 010947 010948 010958 010959 010960 010961 010967 011054 011077 011078 011079 011082 011279',
  'communication-and-thinking':
    '008677 008694 008696 008742 008749 008804 008883 008986 008996 008997 009002 009022 009028 009043 009091 009103 009120 010761 010935 010940 010949 010950 010951 010952 010971 010972 011019 011020 011023 011028 011029 011032 011033 011035 011036 011074 011242 011295 011296 011305 011312 011318',
  'emotions-and-attitudes':
    '008616 008693 008816 008984 009157 010336 010731 010764 010775 010939 010986 010987 010988 010989 010990 010991 010992 011053 011057 011069 011070 011239 011244 011262 011271 011273 011280 011287 011299 011304 011310',
  'social-and-conflict':
    '008695 008753 008757 008946 008985 009001 009131 009223 010299 010757 010763 010907 010919 010943 010973 010974 010978 010979 010980 010981 010983 010984 011014 011015 011016 011017 011018 011025 011026 011027 011039 011084 011087 011090 011091 011092 011093 011094 011095 011221 011268 011269 011270 011278 011290 011292 011298 011300 011301 011302',
  'timing-and-change':
    '010338 010909 010910 010911 010968 011002 011003 011004 011007 011010 011011 011012 011081 011085 011089 011098'
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

function main() {
  if (DRY_RUN) console.log('🔍 DRY RUN — no files will be modified\n');

  const data = JSON.parse(fs.readFileSync(UTTRYKK_FILE, 'utf8'));
  const source = data.filter((e) => e.category === SOURCE_SLUG);
  console.log(`'${SOURCE_SLUG}' entries found: ${source.length}`);

  if (source.length === 0) {
    console.log('\n✅ Nothing to do.');
    return;
  }

  const unmapped = source.filter((e) => !SLUG_BY_ID.has(e.id));
  if (unmapped.length > 0) {
    console.error(`❌ ${unmapped.length} entries have no mapping — aborting:`);
    for (const e of unmapped) console.error(`   ${e.id}  ${e.lemma}`);
    process.exit(1);
  }

  const sourceIds = new Set(source.map((e) => e.id));
  const stale = [...SLUG_BY_ID.keys()].filter((id) => !sourceIds.has(id));
  if (stale.length > 0) {
    console.error(`❌ ${stale.length} mapped ids are not in '${SOURCE_SLUG}' — aborting:`);
    console.error('   ' + stale.join(', '));
    process.exit(1);
  }

  const counts = {};
  for (const e of source) counts[SLUG_BY_ID.get(e.id)] = (counts[SLUG_BY_ID.get(e.id)] ?? 0) + 1;
  console.log('\nNew group sizes:');
  for (const [slug, n] of Object.entries(counts)) console.log(`  ${slug.padEnd(28)} ${n}`);

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete — no files written.');
    return;
  }

  // COPYFILE_EXCL: never overwrite an existing snapshot. .bak already holds the
  // pre-first-split state, so this one gets its own name.
  const bakPath = UTTRYKK_FILE + '.bak-figurative';
  try {
    fs.copyFileSync(UTTRYKK_FILE, bakPath, fs.constants.COPYFILE_EXCL);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    console.log(`\nℹ️  Backup already exists at ${bakPath} — not overwriting.`);
  }

  const newData = data.map((e) =>
    e.category === SOURCE_SLUG ? { ...e, category: SLUG_BY_ID.get(e.id) } : e
  );

  if (newData.some((e) => e.category === SOURCE_SLUG)) {
    console.error(`❌ Entries still carry '${SOURCE_SLUG}' — aborting write.`);
    process.exit(1);
  }

  fs.writeFileSync(UTTRYKK_FILE, JSON.stringify(newData, null, 2) + '\n', 'utf8');
  console.log(`\n✅ Done — reassigned ${source.length} entries in uttrykk-b2.json.`);
  console.log(`   Backup: ${bakPath}`);
}

main();
