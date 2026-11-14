import { expect, test, type Page } from '@playwright/test';
import { injectLoggedInFreeUser } from './helpers.js';

// Small-screen app shell (ai-docs/implementation/mobile-web-shell.md, Phase 7).
// Below `md` (768px) the practice routes get a bottom tab bar and a compact top bar and lose the
// footer from view; everything else, and every route at 1280px, is unchanged. The footer is
// hidden with CSS, not removed, so its links stay in the HTML a crawler sees.

const TABS_ROUTES = ['/learn/a1', '/grammar', '/quiz', '/my-progress'];
const SITE_ROUTES = ['/', '/blog', '/plus', '/guide'];

const bar = (page: Page) => page.getByTestId('bottom-nav');
const topBar = (page: Page) => page.getByTestId('mobile-top-bar');
// A footer-only link: on a `tabs` or `session` route the footer is in the DOM but not visible.
const footerPrivacyLink = (page: Page) => page.locator('footer a[href="/privacy"]');
const moreMenu = (page: Page) => page.getByTestId('more-menu');

// The bar is server-rendered, so a click before hydration is silently lost. Retry until the
// sheet is really open; clicking again while it is open is not needed (toPass stops at success).
async function openMoreSheet(page: Page) {
  await expect(async () => {
    await bar(page).locator('button').click({ timeout: 2000 });
    await expect(moreMenu(page)).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10000 });
}

// ===========================================================================
// 375px, guest
// ===========================================================================

test.describe('mobile shell at 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const route of TABS_ROUTES) {
    test(`${route}: bottom bar and top bar are shown, the footer is hidden but in the DOM`, async ({
      page
    }) => {
      await page.goto(route);
      await expect(bar(page)).toBeVisible();
      await expect(topBar(page)).toBeVisible();
      // SEO: the footer links must still be in the HTML, only hidden with CSS.
      await expect(footerPrivacyLink(page)).toHaveCount(1);
      await expect(footerPrivacyLink(page)).toBeHidden();
    });
  }

  for (const route of SITE_ROUTES) {
    test(`${route}: no bottom bar, no compact top bar, footer visible`, async ({ page }) => {
      await page.goto(route);
      await expect(bar(page)).toHaveCount(0);
      await expect(topBar(page)).toHaveCount(0);
      await expect(footerPrivacyLink(page)).toBeVisible();
    });
  }

  test('a flashcard session route has the compact top bar with a back arrow, no bottom bar and no visible footer', async ({
    page
  }) => {
    await page.goto('/a1/greetings');
    // Below md the compact top bar already shows the category, so the plain "Studying: X" line is
    // hidden (it stays in the DOM, and stays visible on desktop).
    await expect(page.getByText(/studying:\s*greetings/i)).toBeHidden();
    await expect(bar(page)).toHaveCount(0);
    await expect(footerPrivacyLink(page)).toBeHidden();

    // The compact bar replaces the full Nav: back to the level's Learn page, labelled with that
    // level ("A1", so the arrow does not read as "back to Greetings"), titled by category.
    await expect(topBar(page)).toBeVisible();
    await expect(topBar(page).locator('a[href="/learn/a1"]')).toBeVisible();
    await expect(topBar(page).locator('a[href="/learn/a1"]')).toHaveText('A1');
    await expect(topBar(page).locator('a[href="/"]')).toHaveCount(0);
    await expect(topBar(page)).toContainText('Greetings');
  });

  test('grammar review: back arrow labelled Grammar, and a centred title', async ({ page }) => {
    await page.goto('/review/grammar?level=B1');
    await expect(bar(page)).toHaveCount(0);
    const back = topBar(page).locator('a[href="/grammar"]');
    await expect(back).toBeVisible();
    await expect(back).toHaveText('Grammar');
    // The title is the "due today" label, centred between the arrow and the right slot.
    await expect(topBar(page).locator('p')).toHaveText(/due/i);
  });

  test('the active tab follows the route', async ({ page }) => {
    await page.goto('/learn/a1');
    await expect(bar(page).locator('a[href="/learn/a1"]')).toHaveAttribute('aria-current', 'page');
    await expect(bar(page).locator('a[href="/grammar"]')).not.toHaveAttribute('aria-current', /.+/);

    await page.goto('/grammar');
    await expect(bar(page).locator('a[href="/grammar"]')).toHaveAttribute('aria-current', 'page');
  });

  test('a tab root shows the brand, a sub-page shows a back arrow instead', async ({ page }) => {
    await page.goto('/grammar');
    await expect(topBar(page).locator('a[href="/"]')).toBeVisible();

    await page.goto('/grammar/noun-plurals');
    await expect(topBar(page).locator('a[href="/grammar"]')).toBeVisible();
    await expect(topBar(page).locator('a[href="/"]')).toHaveCount(0);
  });

  test('a guest sees a Log in button in the top bar, and no search icon', async ({ page }) => {
    await page.goto('/learn/a1');
    const login = page.getByTestId('mobile-login-button');
    // Shown once the client auth store has finished loading, so allow for that.
    await expect(login).toBeVisible();
    await expect(page.getByTestId('mobile-search-button')).toHaveCount(0);
    await expect(login).toHaveAttribute('href', '/auth/login');
  });

  test('the top bar stays at the top when the page is scrolled', async ({ page }) => {
    await page.goto('/learn/a1');
    await expect(topBar(page)).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const box = await topBar(page).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThanOrEqual(1);
  });

  test('every tab is at least 48px wide and high and has no tap highlight', async ({ page }) => {
    await page.goto('/learn/a1');
    await expect(bar(page)).toBeVisible();
    const items = await bar(page).locator('a, button').all();
    expect(items).toHaveLength(5);
    for (const item of items) {
      const box = await item.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(48);
      expect(box!.height).toBeGreaterThanOrEqual(48);
    }
    const highlight = await bar(page).evaluate((el) =>
      getComputedStyle(el).getPropertyValue('-webkit-tap-highlight-color')
    );
    expect(highlight).toBe('rgba(0, 0, 0, 0)');
  });

  // -------------------------------------------------------------------------
  // The bar leaves while a session is on screen and comes back afterwards
  // -------------------------------------------------------------------------

  test('quiz: the bar is shown on the picker and hidden during a quiz', async ({ page }) => {
    await page.goto('/quiz');
    await expect(bar(page)).toBeVisible();

    await page.getByRole('button', { name: /greetings/i }).click();
    await page.getByRole('button', { name: /start quiz/i }).click();
    await expect(page.getByText(/question 1 of|spørsmål 1 av/i)).toBeVisible({ timeout: 10000 });
    await expect(bar(page)).toHaveCount(0);

    // The top bar becomes the session header: `← Quiz | A1 · Greetings`, no flag and wordmark.
    await expect(page.getByTestId('mobile-back-button')).toContainText('Quiz');
    await expect(page.getByTestId('mobile-session-title')).toHaveText(/A1.*Greetings/i);
    await expect(topBar(page).locator('a[href="/"]')).toHaveCount(0);
    // The page's own back link is hidden below md (the top bar has the arrow now).
    await expect(page.getByRole('button', { name: /^←\s*Quiz$/ })).toBeHidden();

    // The arrow leaves the quiz at once, like the in-page link did: back to the picker.
    await page.getByTestId('mobile-back-button').click();
    await expect(bar(page)).toBeVisible();
    await expect(page.getByTestId('mobile-back-button')).toHaveCount(0);
    await expect(topBar(page).locator('a[href="/"]')).toBeVisible();
  });

  test('grammar topic: the bar is hidden on the Practise tab and back on the Rule tab', async ({
    page
  }) => {
    await page.goto('/grammar/noun-plurals');
    await expect(bar(page)).toBeVisible();

    // The page is server-rendered: retry the tab click until the page is hydrated.
    const practice = page.getByTestId('topic-tab-practice');
    await expect(async () => {
      await practice.click({ timeout: 2000 });
      await expect(practice).toHaveAttribute('aria-selected', 'true', { timeout: 1000 });
    }).toPass({ timeout: 10000 });
    await expect(bar(page)).toHaveCount(0);

    await page.getByTestId('topic-tab-rule').click();
    await expect(bar(page)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Guest: the Profile tab opens the More sheet
  // -------------------------------------------------------------------------

  test('guest: the Profile tab opens a sheet with Log in and the More links', async ({ page }) => {
    await page.goto('/learn/a1');
    await openMoreSheet(page);

    // Stays on the page: it is a sheet, not a navigation to the login page.
    await expect(page).toHaveURL('/learn/a1');
    await expect(page.getByRole('link', { name: /log in/i }).first()).toBeVisible();
    for (const href of ['/plus', '/guide', '/faq', '/contact', '/privacy', '/terms']) {
      await expect(moreMenu(page).locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('guest: Escape closes the sheet', async ({ page }) => {
    await page.goto('/learn/a1');
    await openMoreSheet(page);
    await page.keyboard.press('Escape');
    await expect(moreMenu(page)).toHaveCount(0);
    await expect(page).toHaveURL('/learn/a1');
  });

  test('guest: following Privacy closes the sheet and shows the normal site layout', async ({
    page
  }) => {
    await page.goto('/learn/a1');
    await openMoreSheet(page);
    await moreMenu(page).locator('a[href="/privacy"]').click();

    await expect(page).toHaveURL('/privacy');
    await expect(moreMenu(page)).toHaveCount(0);
    await expect(bar(page)).toHaveCount(0);
    await expect(footerPrivacyLink(page)).toBeVisible();

    // Back returns to the practice page with the sheet still closed.
    await page.goBack();
    await expect(page).toHaveURL('/learn/a1');
    await expect(moreMenu(page)).toHaveCount(0);
    await expect(bar(page)).toBeVisible();
  });

  test('guest: the language buttons in the sheet switch the interface language', async ({
    page
  }) => {
    await page.goto('/learn/a1');
    await openMoreSheet(page);

    const pressed = moreMenu(page).locator('button[aria-pressed="true"]');
    const text = () => pressed.evaluate((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim());
    const before = await text();

    await moreMenu(page).locator('button[aria-pressed="false"]').first().click();
    await expect(moreMenu(page)).toHaveCount(0);

    await openMoreSheet(page);
    await expect.poll(text).not.toBe(before);
  });

  test('guest: the dark-mode toggle in the sheet switches the page theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/learn/a1');
    await openMoreSheet(page);
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    // For a guest the only button without aria-pressed in the menu is the dark-mode toggle.
    await moreMenu(page).locator('button:not([aria-pressed])').click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  // -------------------------------------------------------------------------
  // Signed in
  // -------------------------------------------------------------------------

  test('signed in: the Profile tab links to /my-profile and opens no sheet', async ({ page }) => {
    await injectLoggedInFreeUser(page, { onboardingDone: true });
    await page.goto('/learn/a1');
    await expect(bar(page).locator('a[href="/my-profile"]')).toBeVisible();
    await expect(bar(page).locator('button')).toHaveCount(0);
  });
});

// ===========================================================================
// 1280px: nothing changes
// ===========================================================================

test.describe('desktop at 1280px', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const route of TABS_ROUTES) {
    test(`${route}: no bottom bar, no compact top bar, footer visible`, async ({ page }) => {
      await page.goto(route);
      await expect(bar(page)).toBeHidden();
      await expect(topBar(page)).toBeHidden();
      await expect(footerPrivacyLink(page)).toBeVisible();
    });
  }

  test('/a1/greetings: the compact top bar is hidden on desktop', async ({ page }) => {
    await page.goto('/a1/greetings');
    await expect(page.getByText(/studying:\s*greetings/i)).toBeVisible();
    await expect(topBar(page)).toBeHidden();
  });
});
