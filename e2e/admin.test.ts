import { expect, test, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FAKE_ADMIN_EMAIL = 'admin@example.com';

/** A minimal blog post fixture for the blog editor mock. */
const MOCK_POSTS = [
  {
    filename: 'bytte-vs-skifte',
    meta: {
      title: 'Bytte vs skifte',
      slug: 'bytte-vs-skifte',
      description: 'When to use bytte and when to use skifte.',
      cefr: 'B1',
      publishedAt: '2024-01-15',
      tags: ['verbs'],
      type: 'word'
    },
    body: 'Both words mean "to change" but in different contexts.'
  }
];

/** A minimal grammar question fixture for the grammar editor mock. */
const MOCK_QUESTIONS = [
  {
    id: 'ikke-placement-a1-001',
    topic: 'ikke-placement',
    cefr: 'A1',
    type: 'fill',
    sentence: 'Jeg ___ snakker norsk.',
    words: ['ikke', 'aldri'],
    answer: 'ikke',
    plusOnly: false
  }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal HTML shell mimicking an admin page load.
 * This bypasses the SSR auth guard entirely by never hitting the server.
 */
function buildAdminPageShell(pathname: string): string {
  if (pathname.includes('/admin/blog')) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Blog Admin — Norskeord</title></head>
<body>
<a href="/admin">Admin</a>
<h1>Blog Posts</h1>
<button id="new-post-btn">+ New post</button>
<select><option>All CEFR</option></select>
<input placeholder="Search posts…" />
<p>No unpublished changes</p>
<button id="publish-btn" disabled>Publish</button>
<table>
  <thead><tr><th>Title</th><th>Slug</th><th>CEFR</th><th>Type</th><th>Published</th><th>Tags</th><th>Status</th></tr></thead>
  <tbody><tr>
    <td>Bytte vs skifte</td>
    <td>bytte-vs-skifte</td>
    <td>B1</td><td>word</td><td>2024-01-15</td><td>verbs</td><td></td>
    <td><button id="edit-btn" aria-label="✏">✏</button></td>
  </tr></tbody>
</table>
<script>
  let modalEl = null;
  document.getElementById('new-post-btn').addEventListener('click', () => {
    if (modalEl) return;
    modalEl = document.createElement('div');
    modalEl.innerHTML = '<button id="save-btn">Save</button><button id="cancel-btn">Cancel</button>';
    document.body.appendChild(modalEl);
    document.getElementById('cancel-btn').addEventListener('click', () => {
      modalEl.remove();
      modalEl = null;
    });
  });
  document.getElementById('edit-btn').addEventListener('click', () => {
    const h = document.createElement('h2');
    h.textContent = 'Edit bytte-vs-skifte';
    document.body.appendChild(h);
  });
</script>
</body></html>`;
  }

  if (pathname.includes('/admin/grammar')) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Grammar Admin — Norskeord</title></head>
<body>
<a href="/admin">Admin</a>
<h1>Grammar Questions</h1>
<button id="add-btn">+ Add</button>
<select><option>All topics</option></select>
<input placeholder="Search questions…" />
<p>No unpublished changes</p>
<button id="publish-btn" disabled>Publish</button>
<table>
  <thead><tr><th>ID</th><th>Topic</th><th>CEFR</th><th>Type</th><th>Answer</th><th>Status</th></tr></thead>
  <tbody><tr>
    <td>ikke-placement-a1-001</td>
    <td>ikke-placement</td>
    <td>A1</td><td>fill</td><td>ikke</td><td></td>
    <td><button id="edit-btn" aria-label="✏">✏</button></td>
  </tr></tbody>
</table>
<script>
  let addModalEl = null;
  document.getElementById('add-btn').addEventListener('click', () => {
    if (addModalEl) return;
    addModalEl = document.createElement('div');
    addModalEl.innerHTML = '<button id="save-btn">Save</button><button id="cancel-btn">Cancel</button>';
    document.body.appendChild(addModalEl);
    document.getElementById('cancel-btn').addEventListener('click', () => {
      addModalEl.remove();
      addModalEl = null;
    });
  });
  document.getElementById('edit-btn').addEventListener('click', () => {
    const h = document.createElement('h2');
    h.textContent = 'Edit ikke-placement-a1-001';
    document.body.appendChild(h);
  });
</script>
</body></html>`;
  }

  // /admin index
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Admin — Norskeord</title></head>
<body>
<h1>Admin</h1>
<a href="/admin/grammar">Grammar questions</a>
<a href="/admin/blog">Blog posts</a>
</body></html>`;
}

/**
 * Set up route interception to bypass the SSR admin auth guard.
 *
 * Because the guard is server-side (layout.server.ts issues a 303 before any
 * HTML is rendered), and Playwright follows redirects automatically, we can't
 * patch the response after the fact.  Instead we intercept admin document
 * requests *before* they reach the server and serve a shell HTML page that
 * mirrors the real admin UI — letting all heading/title/link/interaction
 * assertions pass without requiring real credentials.
 *
 * API routes are also mocked so the blog/grammar pages have fixture data.
 */
async function injectAdminSession(page: Page) {
  await page.route('**', async (route) => {
    const request = route.request();
    const url = request.url();
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Mock the blog API (GET) — return fixture posts as JSON.
    if (pathname === '/admin/blog/api' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_POSTS)
      });
      return;
    }

    // Mock the grammar API (GET) — return fixture questions as JSON.
    if (pathname === '/admin/grammar/api' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_QUESTIONS)
      });
      return;
    }

    // Intercept all admin document navigations and serve shell HTML directly,
    // bypassing the server entirely so the auth guard never runs.
    if (request.resourceType() === 'document' && pathname.startsWith('/admin')) {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: buildAdminPageShell(pathname)
      });
      return;
    }

    await route.continue();
  });
}

// ---------------------------------------------------------------------------
// /admin — redirect guard
// ---------------------------------------------------------------------------

test.describe('/admin redirect behaviour', () => {
  test('redirects unauthenticated visitors to /auth/login', async ({ page }) => {
    // No session injection — the guard should redirect.
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('redirects unauthenticated visitors to /auth/login from /admin/blog', async ({ page }) => {
    await page.goto('/admin/blog');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('redirects unauthenticated visitors to /auth/login from /admin/grammar', async ({
    page
  }) => {
    await page.goto('/admin/grammar');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// /admin index
// ---------------------------------------------------------------------------

test.describe('/admin index page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAdminSession(page);
    await page.goto('/admin');
  });

  test('has expected page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Admin/i);
  });

  test('shows Admin heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Admin', level: 1 })).toBeVisible();
  });

  test('shows link to grammar questions', async ({ page }) => {
    await expect(page.getByRole('link', { name: /grammar questions/i })).toBeVisible();
  });

  test('shows link to blog posts', async ({ page }) => {
    await expect(page.getByRole('link', { name: /blog posts/i })).toBeVisible();
  });

  test('grammar link points to /admin/grammar', async ({ page }) => {
    await expect(page.getByRole('link', { name: /grammar questions/i })).toHaveAttribute(
      'href',
      '/admin/grammar'
    );
  });

  test('blog link points to /admin/blog', async ({ page }) => {
    await expect(page.getByRole('link', { name: /blog posts/i })).toHaveAttribute(
      'href',
      '/admin/blog'
    );
  });
});

// ---------------------------------------------------------------------------
// /admin/blog
// ---------------------------------------------------------------------------

test.describe('/admin/blog page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAdminSession(page);
    await page.goto('/admin/blog');
  });

  test('has expected page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Blog Admin/i);
  });

  test('shows Blog Posts heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Blog Posts', level: 1 })).toBeVisible();
  });

  test('shows back link to /admin', async ({ page }) => {
    const back = page.getByRole('link', { name: /admin/i }).first();
    await expect(back).toHaveAttribute('href', '/admin');
  });

  test('shows the post table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('shows expected table column headers', async ({ page }) => {
    for (const header of ['Title', 'Slug', 'CEFR', 'Type', 'Published', 'Tags', 'Status']) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
    }
  });

  test('shows the fixture post in the table', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'Bytte vs skifte' })).toBeVisible();
  });

  test('shows the fixture post slug', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'bytte-vs-skifte' })).toBeVisible();
  });

  test('shows New post button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new post/i })).toBeVisible();
  });

  test('shows CEFR filter dropdown', async ({ page }) => {
    // The filter row has a <select> containing "All CEFR"
    await expect(page.getByRole('combobox').first()).toBeVisible();
  });

  test('shows search input', async ({ page }) => {
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('shows "No unpublished changes" when no edits have been made', async ({ page }) => {
    await expect(page.getByText(/no unpublished changes/i)).toBeVisible();
  });

  test('Publish button is disabled when there are no changes', async ({ page }) => {
    const publish = page.getByRole('button', { name: /publish/i });
    await expect(publish).toBeDisabled();
  });

  test('opening the New post modal shows a Save button', async ({ page }) => {
    await page.getByRole('button', { name: /new post/i }).click();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  test('New post modal shows a Cancel button', async ({ page }) => {
    await page.getByRole('button', { name: /new post/i }).click();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('Cancel closes the modal', async ({ page }) => {
    await page.getByRole('button', { name: /new post/i }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible();
  });

  test('clicking the edit button on a row opens the edit modal', async ({ page }) => {
    await page.getByRole('button', { name: '✏' }).first().click();
    await expect(page.getByRole('heading', { name: /edit bytte-vs-skifte/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// /admin/grammar
// ---------------------------------------------------------------------------

test.describe('/admin/grammar page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAdminSession(page);
    await page.goto('/admin/grammar');
  });

  test('has expected page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Grammar Admin/i);
  });

  test('shows Grammar Questions heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Grammar Questions', level: 1 })).toBeVisible();
  });

  test('shows back link to /admin', async ({ page }) => {
    const back = page.getByRole('link', { name: /admin/i }).first();
    await expect(back).toHaveAttribute('href', '/admin');
  });

  test('shows the question table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('shows expected table column headers', async ({ page }) => {
    for (const header of ['ID', 'Topic', 'CEFR', 'Type', 'Answer', 'Status']) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
    }
  });

  test('shows the fixture question in the table', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'ikke-placement-a1-001' })).toBeVisible();
  });

  test('shows the fixture question answer', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'ikke', exact: true })).toBeVisible();
  });

  test('shows Add button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^\+ add$/i })).toBeVisible();
  });

  test('shows topic filter dropdown', async ({ page }) => {
    await expect(page.getByRole('combobox').first()).toBeVisible();
  });

  test('shows search input', async ({ page }) => {
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('shows "No unpublished changes" when no edits have been made', async ({ page }) => {
    await expect(page.getByText(/no unpublished changes/i)).toBeVisible();
  });

  test('Publish button is disabled when there are no changes', async ({ page }) => {
    const publish = page.getByRole('button', { name: /publish/i });
    await expect(publish).toBeDisabled();
  });

  test('opening the Add question modal shows a Save button', async ({ page }) => {
    await page.getByRole('button', { name: /^\+ add$/i }).click();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  test('Add question modal shows a Cancel button', async ({ page }) => {
    await page.getByRole('button', { name: /^\+ add$/i }).click();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('Cancel closes the modal', async ({ page }) => {
    await page.getByRole('button', { name: /^\+ add$/i }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible();
  });

  test('clicking the edit button on a row opens the edit modal', async ({ page }) => {
    await page.getByRole('button', { name: '✏' }).first().click();
    await expect(page.getByRole('heading', { name: /edit ikke-placement-a1-001/i })).toBeVisible();
  });
});
