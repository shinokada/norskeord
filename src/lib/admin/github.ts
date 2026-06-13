/**
 * Generic GitHub Contents API helper.
 *
 * Used by the admin editors to read/write JSON content files (grammar, vocab,
 * uttrykk, ...) directly from/to the repo. A write commits to GITHUB_BRANCH
 * and triggers a Vercel redeploy.
 *
 * IMPORTANT: this module reads `process.env` directly and uses GITHUB_TOKEN —
 * never import it from client-side code.
 */

import { env } from '$env/dynamic/private';

const BASE = 'https://api.github.com';

function headers() {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

function repoConfig() {
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH ?? 'main';
  if (!owner || !repo) {
    throw new Error('GITHUB_OWNER and GITHUB_REPO must be set');
  }
  return { owner, repo, branch };
}

/** Fetch a JSON file from the repo. Returns the parsed data and its current SHA. */
export async function readJsonFile<T>(path: string): Promise<{ data: T; sha: string }> {
  const { owner, repo, branch } = repoConfig();
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: headers()
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub read failed: ${res.status} ${text}`);
  }
  const file = await res.json();
  const data: T = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
  return { data, sha: file.sha };
}

/** Write a JSON file back to the repo as a single commit. */
export async function writeJsonFile(
  path: string,
  data: unknown,
  sha: string,
  message: string
): Promise<void> {
  const { owner, repo, branch } = repoConfig();
  const content = Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64');
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content, sha, branch })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub write failed: ${res.status} ${text}`);
  }
}

/** List files in a repo directory (non-recursive). Returns name + path for each entry. */
export async function listDirectory(
  path: string
): Promise<{ name: string; path: string; type: string }[]> {
  const { owner, repo, branch } = repoConfig();
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: headers()
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub list failed: ${res.status} ${text}`);
  }
  const entries = await res.json();
  if (!Array.isArray(entries)) throw new Error(`Expected directory at ${path}`);
  return entries.map((e) => ({ name: e.name, path: e.path, type: e.type }));
}

/** Fetch a raw text file from the repo. Returns the decoded content and its current SHA. */
export async function readTextFile(path: string): Promise<{ content: string; sha: string }> {
  const { owner, repo, branch } = repoConfig();
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: headers()
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub read failed: ${res.status} ${text}`);
  }
  const file = await res.json();
  const content = Buffer.from(file.content, 'base64').toString('utf-8');
  return { content, sha: file.sha };
}
