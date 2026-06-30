import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// /resources page
// ---------------------------------------------------------------------------

test.describe('/resources page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resources');
  });

  test('page loads with expected h1', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Norwegian Learning Resources'
    );
  });

  // ── All 7 section headings are present ───────────────────────────────────

  const sections = [
    'Norsktrening',
    'Online Learning',
    'Reading',
    'Vocabulary & Flashcards',
    'Listening',
    'Grammar',
    'Dictionaries'
  ];

  for (const title of sections) {
    test(`shows "${title}" section heading`, async ({ page }) => {
      await expect(page.getByRole('heading', { name: title, level: 2 })).toBeVisible();
    });
  }

  // ── Key resource links are present and open externally ───────────────────

  test('Røde Kors Norsktrening link has correct href and target=_blank', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Røde Kors Norsktrening' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://www.rodekors.no/tilbudene/norsktrening/');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('Ordbøkene.no link has correct href', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Ordbøkene.no' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://ordbokene.no/');
  });

  test('NAOB link has correct href', async ({ page }) => {
    const link = page.getByRole('link', { name: 'NAOB' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://naob.no/');
  });

  test('Klar Tale link has correct href', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Klar Tale' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://www.klartale.no/');
  });

  // ── Footer note ──────────────────────────────────────────────────────────

  test('footer note shows contact link', async ({ page }) => {
    const footerNote = page.getByText(/know a great free resource/i).locator('..');
    await expect(footerNote).toBeVisible();
    const contactLink = footerNote.getByRole('link', { name: /contact/i });
    await expect(contactLink).toBeVisible();
    await expect(contactLink).toHaveAttribute('href', '/contact');
  });
});
