import { expect, test, type Page } from '@playwright/test';
import { injectLoggedInFreeUser } from './helpers.js';

// ---------------------------------------------------------------------------
// Plus call-to-action on locked screens (PlusCtas.svelte, trialOffered in $lib/trial).
//
// Three visitors, one layout rule:
//   - signed out:               filled indigo "Log in to start your free trial" link to
//                               /auth/login?next=<this page>, plus outlined orange "Get Plus" to /plus
//   - signed in, trial usable:  filled indigo "Try Plus free for 30 days" button
//   - signed in, trial used:    filled orange "Get Plus" only
//
// The suite has no real session, so "signed in" is faked by patching the SSR HTML (see
// helpers.ts). The server still sees a guest, so trialEligible is false until a test patches
// it to true. Starting a trial (POST /api/trial/start) needs a real session and is not covered.
// ---------------------------------------------------------------------------

const TRIAL_LOGIN = /log in to start your free trial/i;
const TRIAL_BUTTON = /try plus free for 30 days/i;

/**
 * A signed-in free user whose trial is still available (user and trialEligible patched in the HTML).
 * The faked user has no profile row, so the layout would open the onboarding dialog and cover the
 * page; `onboardingDone` is patched to keep it closed (same as helpers.ts).
 */
async function injectTrialEligibleUser(page: Page) {
  await page.route('**', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue();
    try {
      const response = await route.fetch();
      const body = await response.text();
      const patched = body
        .replace(
          /user:null/,
          'user:{id:"00000000-0000-0000-0000-000000000001",email:"test@example.com",app_metadata:{},user_metadata:{},aud:"authenticated",created_at:"2024-01-01T00:00:00Z"}'
        )
        // `!1` is how devalue may write false in inlined data.
        .replace(/trialEligible:(?:false|!1)/, 'trialEligible:true')
        .replace(/onboardingDone:(?:false|!1)/, 'onboardingDone:true');
      await route.fulfill({
        status: response.status(),
        headers: response.headers(),
        body: patched
      });
    } catch {
      await route.continue();
    }
  });
}

// ===========================================================================
// Signed out: the trial link goes to login and comes back to the same page
// ===========================================================================

test.describe('signed out', () => {
  test('/grammar banner: trial headline, login link with next, Get Plus to /plus', async ({
    page
  }) => {
    await page.goto('/grammar');
    const banner = page.getByTestId('grammar-upsell');
    await expect(banner).toBeVisible({ timeout: 8000 });
    await expect(banner).toContainText(/free for 30 days/i);
    await expect(banner.getByRole('link', { name: TRIAL_LOGIN })).toHaveAttribute(
      'href',
      `/auth/login?next=${encodeURIComponent('/grammar')}`
    );
    await expect(banner.locator('a[href^="/plus?ref=grammar-topics"]')).toBeVisible();
    await expect(banner.getByRole('button', { name: TRIAL_BUTTON })).toHaveCount(0);
  });

  test('chapter banner: login link keeps the chapter path, Get Plus goes to /plus', async ({
    page
  }) => {
    await page.goto('/grammar/chapter/helsetninger');
    const banner = page.getByTestId('chapter-upsell');
    await expect(banner).toBeVisible({ timeout: 8000 });
    await expect(banner).toContainText(/free for 30 days/i);
    await expect(banner.getByRole('link', { name: TRIAL_LOGIN })).toHaveAttribute(
      'href',
      `/auth/login?next=${encodeURIComponent('/grammar/chapter/helsetninger')}`
    );
    await expect(banner.locator('a[href^="/plus"]')).toBeVisible();
  });

  test('locked topic page: login link keeps path and ?level=, Get Plus goes to /plus', async ({
    page
  }) => {
    await page.goto('/grammar/noun-plurals?level=B1');
    const lock = page.getByTestId('topic-locked');
    await expect(lock).toBeVisible({ timeout: 8000 });
    await expect(lock).toContainText(/free for 30 days/i);
    await expect(lock.getByRole('link', { name: TRIAL_LOGIN })).toHaveAttribute(
      'href',
      `/auth/login?next=${encodeURIComponent('/grammar/noun-plurals?level=B1')}`
    );
    await expect(lock.locator('a[href^="/plus?ref=grammar-topic-lock"]')).toBeVisible();
  });

  test('flashcard teaser: trial headline, login link, Get Plus and "Already Plus?" remain', async ({
    page
  }) => {
    await page.goto('/a2/transport');
    await expect(page.getByText(/try all cards free for 30 days/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: TRIAL_LOGIN })).toHaveAttribute(
      'href',
      `/auth/login?next=${encodeURIComponent('/a2/transport')}`
    );
    await expect(page.locator('a[href^="/plus?ref=teaser-vocab"]')).toBeVisible();
    await expect(page.getByRole('link', { name: /already plus\?/i })).toBeVisible();
  });

  test('Get Plus is the outlined secondary, not the filled button', async ({ page }) => {
    await page.goto('/a2/transport');
    const getPlus = page.locator('a[href^="/plus?ref=teaser-vocab"]');
    await expect(getPlus).toBeVisible({ timeout: 8000 });
    await expect(getPlus).toHaveClass(/border-orange-300/);
    await expect(getPlus).not.toHaveClass(/bg-orange-500/);
  });

  test('/plus: trial link is the outlined secondary below the orange upgrade button', async ({
    page
  }) => {
    await page.goto('/plus');
    const trial = page.getByRole('link', { name: TRIAL_LOGIN });
    await expect(trial).toBeVisible({ timeout: 8000 });
    await expect(trial).toHaveAttribute('href', `/auth/login?next=${encodeURIComponent('/plus')}`);
    await expect(trial).toHaveClass(/border-indigo-300/);
    await expect(trial).not.toHaveClass(/bg-indigo-600/);
    const upgrade = page.getByRole('link', { name: /sign in to upgrade/i });
    await expect(upgrade).toHaveClass(/bg-orange-500/);
    // The plans come first: the upgrade button is above the trial link.
    const upgradeBox = await upgrade.boundingBox();
    const trialBox = await trial.boundingBox();
    expect(upgradeBox!.y).toBeLessThan(trialBox!.y);
  });

  test('/plus?next=: login brings the visitor back to /plus with next kept', async ({ page }) => {
    await page.goto('/plus?next=%2Fa2%2Ftransport');
    await expect(page.getByRole('link', { name: TRIAL_LOGIN })).toHaveAttribute(
      'href',
      `/auth/login?next=${encodeURIComponent('/plus?next=%2Fa2%2Ftransport')}`,
      { timeout: 8000 }
    );
  });

  test('quiz pill: free-for-30-days text, links to login and back to /quiz', async ({ page }) => {
    await page.goto('/quiz');
    // Above A1 only a few categories are free, so the pill shows.
    await page.locator('select#quiz-level').selectOption('A2');
    const pill = page.getByTestId('quiz-plus-pill');
    await expect(pill).toBeVisible({ timeout: 8000 });
    await expect(pill).toContainText(/free for 30 days/i);
    await expect(pill).toHaveAttribute('href', `/auth/login?next=${encodeURIComponent('/quiz')}`);
  });
});

// ===========================================================================
// Signed in, trial already used (or paid): Get Plus only, filled orange
// ===========================================================================

test.describe('signed in, trial not available', () => {
  test('flashcard teaser: no trial link or button, filled orange Get Plus', async ({ page }) => {
    await injectLoggedInFreeUser(page);
    await page.goto('/a2/transport');
    const getPlus = page.locator('a[href^="/plus?ref=teaser-vocab"]');
    await expect(getPlus).toBeVisible({ timeout: 8000 });
    await expect(getPlus).toHaveClass(/bg-orange-500/);
    await expect(page.getByRole('link', { name: TRIAL_LOGIN })).toHaveCount(0);
    await expect(page.getByRole('button', { name: TRIAL_BUTTON })).toHaveCount(0);
    await expect(page.getByText(/free for 30 days/i)).toHaveCount(0);
    await expect(page.getByText(/unlock everything with norskeord plus/i)).toBeVisible();
  });

  test('locked topic page: old heading and Get Plus only', async ({ page }) => {
    await injectLoggedInFreeUser(page);
    await page.goto('/grammar/uttrykk');
    const lock = page.getByTestId('topic-locked');
    await expect(lock).toBeVisible({ timeout: 8000 });
    await expect(lock).not.toContainText(/free for 30 days/i);
    await expect(lock.getByRole('link', { name: TRIAL_LOGIN })).toHaveCount(0);
    await expect(lock.getByRole('button', { name: TRIAL_BUTTON })).toHaveCount(0);
    await expect(lock.locator('a[href^="/plus?ref=grammar-topic-lock"]')).toBeVisible();
  });
});

// ===========================================================================
// Locked practice tests on /norskproven: three states, same as the quiz pill
// ===========================================================================

test.describe('locked practice test pills', () => {
  test('signed in, trial used: Test 2 links to /plus', async ({ page }) => {
    await injectLoggedInFreeUser(page);
    await page.goto('/norskproven');
    await expect(page.getByRole('link', { name: /Test 2 🔒/i }).first()).toHaveAttribute(
      'href',
      '/plus?ref=practice-test-lock'
    );
  });

  test('signed in, trial available: Test 2 opens the trial modal and stays on the page', async ({
    page
  }) => {
    await injectTrialEligibleUser(page);
    await page.goto('/norskproven');
    // Wait for hydration: the click handler is attached after it.
    await expect(page.getByRole('link', { name: /Test 2 🔒/i }).first()).toBeVisible({
      timeout: 8000
    });
    await expect(async () => {
      await page
        .getByRole('link', { name: /Test 2 🔒/i })
        .first()
        .click();
      await expect(
        page.getByRole('dialog').getByRole('button', { name: TRIAL_BUTTON })
      ).toBeVisible({
        timeout: 1500
      });
    }).toPass({ timeout: 10000 });
    await expect(page).toHaveURL('/norskproven');
  });
});

// ===========================================================================
// Signed in, trial available: the real trial button, no login link
// ===========================================================================

test.describe('signed in, trial available', () => {
  test('flashcard teaser: trial button first, Get Plus outlined, no login link', async ({
    page
  }) => {
    await injectTrialEligibleUser(page);
    await page.goto('/a2/transport');
    await expect(page.getByRole('button', { name: TRIAL_BUTTON })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/try all cards free for 30 days/i)).toBeVisible();
    await expect(page.getByRole('link', { name: TRIAL_LOGIN })).toHaveCount(0);
    await expect(page.locator('a[href^="/plus?ref=teaser-vocab"]')).toHaveClass(
      /border-orange-300/
    );
  });

  test('locked topic page: trial button and trial headline', async ({ page }) => {
    await injectTrialEligibleUser(page);
    await page.goto('/grammar/uttrykk');
    const lock = page.getByTestId('topic-locked');
    await expect(lock).toBeVisible({ timeout: 8000 });
    await expect(lock).toContainText(/free for 30 days/i);
    await expect(lock.getByRole('button', { name: TRIAL_BUTTON })).toBeVisible();
    await expect(lock.getByRole('link', { name: TRIAL_LOGIN })).toHaveCount(0);
  });
});
