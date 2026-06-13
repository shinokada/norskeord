/**
 * GitHub Git Data API helpers for committing multiple files in a single commit.
 *
 * Used by the blog admin editor to publish several added/edited/deleted posts
 * (and any other files) as one commit + one Vercel redeploy, via the
 * tree/commit/ref endpoints rather than the simpler Contents API (which only
 * supports one file per commit).
 *
 * IMPORTANT: this module reads env vars directly and uses GITHUB_TOKEN —
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

async function gh(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers ?? {}) }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export interface FileChange {
  /** Path relative to repo root, e.g. 'src/lib/posts/foo.md'. */
  path: string;
  /** New file content. Omit (or set to null) together with `delete: true` to remove the file. */
  content?: string;
  delete?: boolean;
}

/** The current commit SHA and tree SHA for the configured branch. */
export async function getBranchHead(): Promise<{ commitSha: string; treeSha: string }> {
  const { owner, repo, branch } = repoConfig();
  const ref = await gh(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  const commitSha = ref.object.sha;
  const commit = await gh(`/repos/${owner}/${repo}/git/commits/${commitSha}`);
  return { commitSha, treeSha: commit.tree.sha };
}

/**
 * Commit a batch of file changes (adds, edits, deletes) to the configured branch
 * in a single commit, using the Git Data API (blobs + tree + commit + ref update).
 *
 * Retries once on a 422/409 "ref update" conflict by re-fetching the branch head
 * and re-applying on top of the latest tree.
 */
export async function commitFiles(changes: FileChange[], message: string): Promise<void> {
  const { owner, repo, branch } = repoConfig();

  const attempt = async (retry = false): Promise<void> => {
    const { commitSha, treeSha } = await getBranchHead();

    const tree = await Promise.all(
      changes.map(async (change) => {
        if (change.delete) {
          return { path: change.path, mode: '100644', type: 'blob', sha: null };
        }
        const blob = await gh(`/repos/${owner}/${repo}/git/blobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: Buffer.from(change.content ?? '', 'utf-8').toString('base64'),
            encoding: 'base64'
          })
        });
        return { path: change.path, mode: '100644', type: 'blob', sha: blob.sha };
      })
    );

    const newTree = await gh(`/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base_tree: treeSha, tree })
    });

    const newCommit = await gh(`/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, tree: newTree.sha, parents: [commitSha] })
    });

    try {
      await gh(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sha: newCommit.sha })
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!retry && (msg.includes('422') || msg.includes('409'))) return attempt(true);
      throw e;
    }
  };

  await attempt();
}
