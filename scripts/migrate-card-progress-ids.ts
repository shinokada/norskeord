/**
 * migrate-card-progress-ids.ts
 *
 * Phase 2 (Supabase step) of ai-docs/implementation/id-new-format.md.
 *
 * Updates public.card_progress.vocab_id for the owner's account from the
 * old category-in-id format to the new v-{level}-{NNNN} format, using
 * src/lib/data/id-migration-map.json (written by
 * `node scripts/renumber-ids.mjs --emit-mapping`).
 *
 * Only rows for ADMIN_USER_ID are touched — per id-new-format.md, Supabase
 * currently only has rows for the owner, so this is scoped defensively
 * rather than updating every user's rows blind.
 *
 * Dry run by default — lists what would change. Pass --apply to write.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/migrate-card-progress-ids.ts            # dry run
 *   npx tsx --env-file=.env scripts/migrate-card-progress-ids.ts --apply    # apply
 *
 * Env vars required:
 *   PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_USER_ID
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP_PATH = join(__dirname, '../src/lib/data/id-migration-map.json');

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
if (!ADMIN_USER_ID) {
  console.error('❌  ADMIN_USER_ID is not set in .env');
  process.exit(1);
}

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APPLY = process.argv.includes('--apply');

async function main() {
  const mapping: Record<string, string> = JSON.parse(readFileSync(MAP_PATH, 'utf-8'));
  console.log(`Loaded ${Object.keys(mapping).length} id mapping(s) from id-migration-map.json`);

  // Fetch this user's current card_progress rows and find which ones have a
  // stale (mapped) vocab_id — don't blind-UPDATE all 7,930 possible ids,
  // only the ones actually present.
  const { data: rows, error } = await supabase
    .from('card_progress')
    .select('id, vocab_id')
    .eq('user_id', ADMIN_USER_ID);

  if (error) {
    throw new Error(`Failed to read card_progress: ${error.message}`);
  }

  const toUpdate = (rows ?? [])
    .filter((row) => mapping[row.vocab_id])
    .map((row) => ({ rowId: row.id, oldId: row.vocab_id, newId: mapping[row.vocab_id] }));

  console.log(`card_progress rows for this user: ${rows?.length ?? 0}`);
  console.log(`Rows with a stale vocab_id: ${toUpdate.length}`);

  if (toUpdate.length === 0) {
    console.log('Nothing to update.');
    return;
  }

  for (const u of toUpdate.slice(0, 20)) {
    console.log(`  ${u.oldId}  →  ${u.newId}`);
  }
  if (toUpdate.length > 20) {
    console.log(`  … and ${toUpdate.length - 20} more`);
  }

  if (!APPLY) {
    console.log('\nDry run — nothing updated. Re-run with --apply to write these changes.');
    return;
  }

  console.log('\nUpdating…');
  let updated = 0;
  let failed = 0;
  for (const u of toUpdate) {
    const { error: updateError } = await supabase
      .from('card_progress')
      .update({ vocab_id: u.newId })
      .eq('id', u.rowId);

    if (updateError) {
      failed++;
      console.error(`[err] row ${u.rowId} (${u.oldId} → ${u.newId}): ${updateError.message}`);
    } else {
      updated++;
    }
  }

  if (failed > 0) {
    throw new Error(
      `Updated ${updated} of ${toUpdate.length} row(s) — ${failed} failed, see [err] lines above`
    );
  }

  console.log(`\nDone. Updated ${updated} of ${toUpdate.length} row(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
