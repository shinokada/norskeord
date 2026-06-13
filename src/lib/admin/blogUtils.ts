import type { PostMeta, DeckLink } from '$lib/blog';

export interface BlogPost {
  /** Filename without extension, e.g. 'bytte-vs-skifte'. Stable key for drafts. */
  filename: string;
  meta: PostMeta;
  body: string; // markdown content after the frontmatter
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/**
 * Split a raw .md file into frontmatter (YAML text) and body.
 * Throws if the file has no frontmatter block.
 */
export function splitFrontmatter(raw: string): { yaml: string; body: string } {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) throw new Error('No frontmatter block found');
  return { yaml: match[1], body: match[2] };
}

/**
 * Parse the limited YAML subset used in this repo's post frontmatter:
 * - scalar strings (quoted with ' or " or bare)
 * - flow arrays: tags: [a, b, c]
 * - block arrays of flat objects (decks):
 *     decks:
 *       - level: a2
 *         category: foo
 *         label: 'A2 Foo'
 */
export function parseFrontmatter(yaml: string): Record<string, unknown> {
  const lines = yaml.split('\n');
  const result: Record<string, unknown> = {};

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) {
      i++;
      continue;
    }

    const topMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!topMatch) {
      i++;
      continue;
    }
    const [, key, rest] = topMatch;

    if (rest.trim() === '') {
      // Could be a block array (decks) on following lines
      const items: Record<string, unknown>[] = [];
      let j = i + 1;
      while (j < lines.length && /^\s*-\s/.test(lines[j])) {
        const item: Record<string, unknown> = {};
        // First field is on the "- " line itself
        const firstLine = lines[j].replace(/^\s*-\s*/, '');
        const firstField = firstLine.match(/^(\w[\w-]*):\s*(.*)$/);
        if (firstField) {
          item[firstField[1]] = parseScalar(firstField[2]);
        }
        j++;
        // Subsequent indented fields belong to the same item
        while (j < lines.length && /^\s{2,}\w/.test(lines[j]) && !/^\s*-\s/.test(lines[j])) {
          const field = lines[j].trim().match(/^(\w[\w-]*):\s*(.*)$/);
          if (field) item[field[1]] = parseScalar(field[2]);
          j++;
        }
        items.push(item);
      }
      if (items.length) {
        result[key] = items;
        i = j;
        continue;
      }
      i++;
      continue;
    }

    result[key] = parseScalar(rest.trim());
    i++;
  }

  return result;
}

function parseScalar(raw: string): unknown {
  const v = raw.trim();
  if (v === '') return '';
  // flow array: [a, b, c]
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((s) => unquote(s.trim()));
  }
  return unquote(v);
}

function unquote(v: string): string {
  if (
    (v.startsWith("'") && v.endsWith("'") && v.length >= 2) ||
    (v.startsWith('"') && v.endsWith('"') && v.length >= 2)
  ) {
    return v.slice(1, -1);
  }
  return v;
}

/** Parse a raw .md file into a BlogPost. */
export function parsePostFile(filename: string, raw: string): BlogPost {
  const { yaml, body } = splitFrontmatter(raw);
  const data = parseFrontmatter(yaml);
  return {
    filename,
    meta: data as unknown as PostMeta,
    body
  };
}

/**
 * Serialize a PostMeta + body back into a raw .md file.
 * Field order is fixed to match the existing convention in src/lib/posts/.
 */
export function serializePostFile(meta: PostMeta, body: string): string {
  const lines: string[] = ['---'];

  lines.push(`title: ${quoteScalar(meta.title)}`);
  lines.push(`description: ${quoteScalar(meta.description)}`);
  lines.push(`slug: ${meta.slug}`);
  lines.push(`cefr: ${cefrToYaml(meta.cefr)}`);
  if (meta.type) lines.push(`type: ${meta.type}`);
  lines.push(`publishedAt: ${meta.publishedAt}`);
  if (meta.updatedAt) lines.push(`updatedAt: ${meta.updatedAt}`);
  lines.push(`tags: ${arrayToFlowYaml(meta.tags ?? [])}`);

  if (meta.decks && meta.decks.length) {
    lines.push('decks:');
    for (const d of meta.decks) {
      lines.push(`  - level: ${d.level}`);
      lines.push(`    category: ${d.category}`);
      lines.push(`    label: ${quoteScalar(d.label)}`);
    }
  }

  lines.push('---');
  lines.push('');

  const trimmedBody = body.replace(/^\n{2,}/, '\n');
  return lines.join('\n') + trimmedBody;
}

function cefrToYaml(cefr: string | string[]): string {
  if (Array.isArray(cefr)) return `[${cefr.join(', ')}]`;
  return cefr;
}

function arrayToFlowYaml(arr: string[]): string {
  return `[${arr.join(', ')}]`;
}

/** Quote a scalar string with single quotes, escaping any existing single quotes (YAML doubling). */
function quoteScalar(s: string): string {
  const escaped = s.replace(/'/g, "''");
  return `'${escaped}'`;
}

/** Generate the slug-derived filename, e.g. 'bytte-vs-skifte' -> 'bytte-vs-skifte.md'. */
export function filenameForSlug(slug: string): string {
  return `${slug}.md`;
}

/** Validate a slug: lowercase letters, digits, and hyphens only. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

export const CANONICAL_TAGS = [
  'adjectives',
  'adverbs',
  'verbs',
  'nouns',
  'grammar',
  'vocabulary',
  'expressions',
  'pronunciation',
  'study-tips'
] as const;

export type CanonicalTag = (typeof CANONICAL_TAGS)[number];

/** Return a list of validation error messages. Empty = valid. */
export function validatePost(meta: Partial<PostMeta>, body: string): string[] {
  const errors: string[] = [];
  if (!meta.title?.trim()) errors.push('title is required');
  if (!meta.description?.trim()) errors.push('description is required');
  if (!meta.slug?.trim()) errors.push('slug is required');
  else if (!isValidSlug(meta.slug)) {
    errors.push('slug must be lowercase letters, digits, and hyphens only');
  }
  if (!meta.cefr || (Array.isArray(meta.cefr) && meta.cefr.length === 0)) {
    errors.push('cefr is required');
  }
  if (!meta.publishedAt?.trim()) errors.push('publishedAt is required');
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.publishedAt)) {
    errors.push('publishedAt must be in YYYY-MM-DD format');
  }
  if (meta.updatedAt && !/^\d{4}-\d{2}-\d{2}$/.test(meta.updatedAt)) {
    errors.push('updatedAt must be in YYYY-MM-DD format');
  }
  if (!meta.tags || meta.tags.length === 0) {
    errors.push('at least one tag is required');
  } else {
    for (const t of meta.tags) {
      if (!CANONICAL_TAGS.includes(t as CanonicalTag)) {
        errors.push(`tag "${t}" is not in the canonical taxonomy`);
      }
    }
  }
  if (!body.trim()) errors.push('body is required');
  if (meta.decks) {
    for (const d of meta.decks as DeckLink[]) {
      if (!d.level || !d.category || !d.label) {
        errors.push('each deck link requires level, category, and label');
      }
    }
  }
  return errors;
}

/** Return a blank post skeleton for the "new post" form. */
export function blankPost(): { meta: Partial<PostMeta>; body: string } {
  const today = new Date().toISOString().slice(0, 10);
  return {
    meta: {
      title: '',
      description: '',
      slug: '',
      cefr: 'A2',
      publishedAt: today,
      tags: [],
      decks: []
    },
    body: ''
  };
}
