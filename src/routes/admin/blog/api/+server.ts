import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { listDirectory, readTextFile } from '$lib/admin/github';
import { commitFiles, type FileChange } from '$lib/admin/githubTree';
import {
  parsePostFile,
  serializePostFile,
  validatePost,
  filenameForSlug
} from '$lib/admin/blogUtils';
import type { RequestHandler } from './$types';
import type { PostMeta } from '$lib/blog';

const POSTS_DIR = env.BLOG_POSTS_DIR ?? 'src/lib/posts';

function assertAdmin(locals: App.Locals) {
  const userEmail = locals.user?.email;
  if (!userEmail || userEmail !== env.ADMIN_EMAIL) {
    throw error(403, 'Forbidden');
  }
}

export interface AdminPost {
  /** Filename without extension, e.g. 'bytte-vs-skifte'. Stable key for drafts. */
  filename: string;
  meta: PostMeta;
  body: string;
}

// GET — load all posts (frontmatter + body) into the editor
export const GET: RequestHandler = async ({ locals }) => {
  assertAdmin(locals);

  const entries = await listDirectory(POSTS_DIR);
  const mdFiles = entries.filter((e) => e.type === 'file' && e.name.endsWith('.md'));

  const posts: AdminPost[] = await Promise.all(
    mdFiles.map(async (entry) => {
      const { content } = await readTextFile(entry.path);
      const filename = entry.name.replace(/\.md$/, '');
      const { meta, body } = parsePostFile(filename, content);
      return { filename, meta, body };
    })
  );

  // Newest first, like the public blog listing
  posts.sort((a, b) => (b.meta.publishedAt ?? '').localeCompare(a.meta.publishedAt ?? ''));

  return json(posts);
};

type DraftPost = AdminPost & {
  _status?: 'added' | 'edited' | 'deleted';
  _originalFilename?: string;
};

// PUT — publish the full draft (all posts) in one commit via the Git Trees API
export const PUT: RequestHandler = async ({ locals, request }) => {
  assertAdmin(locals);
  const posts: DraftPost[] = await request.json();

  // Validate all non-deleted posts before touching GitHub
  for (const p of posts) {
    if (p._status === 'deleted') continue;
    const issues = validatePost(p.meta, p.body);
    if (issues.length) throw error(400, `Post ${p.filename || p.meta.slug}: ${issues.join('; ')}`);
  }

  const added = posts.filter((p) => p._status === 'added').length;
  const edited = posts.filter((p) => p._status === 'edited').length;
  const deleted = posts.filter((p) => p._status === 'deleted').length;
  const message = buildCommitMessage(added, edited, deleted);

  const changes: FileChange[] = [];

  for (const p of posts) {
    if (!p._status) continue;

    if (p._status === 'deleted') {
      const originalFilename = p._originalFilename ?? p.filename;
      changes.push({ path: `${POSTS_DIR}/${filenameForSlug(originalFilename)}`, delete: true });
      continue;
    }

    const newFilename = p.meta.slug;
    const content = serializePostFile(p.meta, p.body);

    // If the slug changed on an edited post, delete the old file and add the new one
    if (p._status === 'edited' && p._originalFilename && p._originalFilename !== newFilename) {
      changes.push({ path: `${POSTS_DIR}/${filenameForSlug(p._originalFilename)}`, delete: true });
    }

    changes.push({ path: `${POSTS_DIR}/${filenameForSlug(newFilename)}`, content });
  }

  if (!changes.length) {
    return json({ ok: true, message: 'Nothing to publish' });
  }

  await commitFiles(changes, message);
  return json({ ok: true, message });
};

function buildCommitMessage(added: number, edited: number, deleted: number): string {
  const parts: string[] = [];
  if (added) parts.push(`add ${added} post${added > 1 ? 's' : ''}`);
  if (edited) parts.push(`edit ${edited} post${edited > 1 ? 's' : ''}`);
  if (deleted) parts.push(`delete ${deleted} post${deleted > 1 ? 's' : ''}`);
  return `admin: ${parts.length ? parts.join(', ') : 'update blog posts'}`;
}
