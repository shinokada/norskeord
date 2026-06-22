/**
 * cleanup-e2e-users.ts
 *
 * Deletes leftover Supabase Auth users created by the Playwright OTP login
 * tests (e2e/login.test.ts → uniqueEmail()). Those tests use
 * shouldCreateUser: true, so every run of the "OTP step" suite creates a
 * real (unverified) user shaped like:
 *
 *   e2e-<timestamp>-<random>@example.com
 *
 * This script finds users whose email matches that exact shape and deletes
 * them. It's a dry run by default — pass --delete to actually remove them.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/cleanup-e2e-users.ts            # list only
 *   npx tsx --env-file=.env scripts/cleanup-e2e-users.ts --delete   # delete
 *
 * Env vars required:
 *   PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Matches uniqueEmail() in e2e/login.test.ts: `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`
const E2E_EMAIL_PATTERN = /^e2e-\d+-\d+@example\.com$/;

const shouldDelete = process.argv.includes('--delete');

async function findE2eUsers() {
  const matches: { id: string; email: string; createdAt: string; confirmed: boolean }[] = [];

  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(`listUsers failed on page ${page}: ${error.message}`);
    }

    for (const user of data.users) {
      if (user.email && E2E_EMAIL_PATTERN.test(user.email)) {
        matches.push({
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
          confirmed: user.email_confirmed_at != null
        });
      }
    }

    if (data.users.length < perPage) break; // last page
    page++;
  }

  return matches;
}

async function main() {
  const matches = await findE2eUsers();

  if (matches.length === 0) {
    console.log('No leftover e2e test users found.');
    return;
  }

  console.log(`Found ${matches.length} e2e test user(s):\n`);
  for (const m of matches) {
    const flag = m.confirmed ? '⚠ confirmed' : 'unverified';
    console.log(`  ${m.email}  (created ${m.createdAt}, ${flag})`);
  }

  if (!shouldDelete) {
    console.log('\nDry run — nothing deleted. Re-run with --delete to remove these users.');
    return;
  }

  console.log('\nDeleting…');
  let deleted = 0;
  for (const m of matches) {
    const { error } = await supabase.auth.admin.deleteUser(m.id);
    if (error) {
      console.error(`[err] ${m.email}: ${error.message}`);
    } else {
      console.log(`[ok]  ${m.email}`);
      deleted++;
    }
  }

  console.log(`\nDone. Deleted ${deleted} of ${matches.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
