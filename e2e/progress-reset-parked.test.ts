import { expect, test, type Page } from '@playwright/test';
import { injectLoggedInFreeUser } from './helpers.js';

// logout-progress-parking.md, Phase 4/5: the reset on /my-progress removes the live progress
// keys and the signed-in account's parked blobs, and leaves another account's blobs alone.
// A real logout and login cannot run here (the e2e suite has no real session; helpers.ts only
// patches `user` into the HTML), so the parking round trip is covered by the unit tests in
// src/lib/parked-progress.test.ts and by the manual checks in the plan.

const FAKE_USER_ID = '00000000-0000-0000-0000-000000000001'; // same id as injectLoggedInFreeUser
const OTHER_USER_ID = '00000000-0000-0000-0000-0000000000aa';

// w-000001 is a real A1 card, so the page leaves the empty state and shows the reset button.
const LIVE_KEY = 'progress-w-000001';
const LIVE_VALUE = JSON.stringify({
  fsrs: {
    due: new Date(Date.now() + 86_400_000).toISOString(),
    stability: 1,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 1,
    lapses: 0,
    state: 2
  },
  seenCount: 1,
  lastSeen: new Date().toISOString(),
  level: 'A1',
  category: 'greetings'
});

function blob(entryKey: string): string {
  return JSON.stringify({
    v: 1,
    parkedAt: new Date().toISOString(),
    entries: {
      [entryKey]: JSON.stringify({
        attempts: 2,
        correct: 1,
        lastAttempt: new Date().toISOString()
      })
    }
  });
}

async function seed(page: Page) {
  await page.addInitScript(
    ({ liveKey, liveValue, ownKey, ownBlob, otherKey, otherBlob }) => {
      localStorage.setItem(liveKey, liveValue);
      localStorage.setItem(ownKey, ownBlob);
      localStorage.setItem(otherKey, otherBlob);
      localStorage.setItem('stats-active-tab', 'vocab'); // not progress: must survive
    },
    {
      liveKey: LIVE_KEY,
      liveValue: LIVE_VALUE,
      ownKey: `parked:${FAKE_USER_ID}:cloze`,
      ownBlob: blob('w-000002'),
      otherKey: `parked:${OTHER_USER_ID}:cloze`,
      otherBlob: blob('w-000003')
    }
  );
}

async function resetAll(page: Page) {
  await page.getByRole('button', { name: 'Reset all progress' }).click();
  await page.getByRole('button', { name: 'Yes, reset' }).click();
  await expect(page.getByText('No cards reviewed yet')).toBeVisible();
}

test.describe('/my-progress reset and parked progress', () => {
  test('a signed-in reset removes the live keys and the account blobs, not another account', async ({
    page
  }) => {
    await injectLoggedInFreeUser(page, { onboardingDone: true });
    await seed(page);
    await page.goto('/my-progress');

    await resetAll(page);

    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys).not.toContain(LIVE_KEY);
    expect(keys).not.toContain(`parked:${FAKE_USER_ID}:cloze`);
    expect(keys).toContain(`parked:${OTHER_USER_ID}:cloze`);
    expect(keys).toContain('stats-active-tab');
  });

  test('a guest reset removes the live keys and leaves every parked blob', async ({ page }) => {
    await seed(page);
    await page.goto('/my-progress');

    await resetAll(page);

    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys).not.toContain(LIVE_KEY);
    expect(keys).toContain(`parked:${FAKE_USER_ID}:cloze`);
    expect(keys).toContain(`parked:${OTHER_USER_ID}:cloze`);
  });
});
