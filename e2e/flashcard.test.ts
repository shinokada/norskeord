import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Norske flashcard');
});

test('home page shows all CEFR level headings', async ({ page }) => {
	await page.goto('/');
	for (const label of [
		'A1 — Beginner',
		'A2 — Elementary',
		'B1 — Intermediate',
		'B2 — Upper Intermediate',
		'C1 — Advanced',
		'C2 — Mastery'
	]) {
		await expect(page.getByRole('heading', { name: label, level: 2 })).toBeVisible();
	}
});

test('home page has category links for A1', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'greetings' })).toHaveAttribute(
		'href',
		'/a1/greetings'
	);
	await expect(page.getByRole('link', { name: 'animals' })).toHaveAttribute('href', '/a1/animals');
});

test('A1 greetings flashcard page loads and shows title', async ({ page }) => {
	await page.goto('/a1/greetings');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('A1');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Nivå A1 — Greetings');
});

test('A1 greetings page has mode toggle buttons', async ({ page }) => {
	await page.goto('/a1/greetings');
	await expect(page.getByRole('button', { name: 'Norsk → English' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'English → Norsk' })).toBeVisible();
});

test('B1 travel flashcard page loads', async ({ page }) => {
	await page.goto('/b1/travel');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('B1');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Nivå B1 — Travel');
});

test('C1 philosophy flashcard page loads', async ({ page }) => {
	await page.goto('/c1/philosophy');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('C1');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Nivå C1 — Philosophy');
});

test('about page has expected h1', async ({ page }) => {
	await page.goto('/about');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('ABOUT');
});
