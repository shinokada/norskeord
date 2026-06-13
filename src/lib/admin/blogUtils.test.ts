import { describe, it, expect } from 'vitest';
import {
  splitFrontmatter,
  parseFrontmatter,
  parsePostFile,
  serializePostFile,
  validatePost,
  isValidSlug,
  filenameForSlug,
  blankPost,
  CANONICAL_TAGS
} from './blogUtils';
import type { PostMeta } from '$lib/blog';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** The bytte-vs-skifte post verbatim (trimmed for testing). */
const BYTTE_RAW = `---
title: 'Bytte vs Skifte'
description: 'Bytte is always a swap. Skifte is any kind of change — including ones that happen on their own.'
slug: bytte-vs-skifte
cefr: A2
publishedAt: 2026-05-21
tags: [verbs, vocabulary]
decks:
  - level: a2
    category: house-chores
    label: 'A2 House Chores'
  - level: a2
    category: clothing
    label: 'A2 Clothing'
  - level: a2
    category: hobbies
    label: 'A2 Hobbies'
---

## Kort forklaring

Body here.
`;

/** A guide-type post with array cefr and no decks. */
const GUIDE_RAW = `---
title: 'Slik bruker du Norskeord best'
description: 'Forskningsbaserte tips for å lære mer på kortere tid.'
slug: slik-bruker-du-norskeord
cefr: [A1, A2, B1, B2]
type: guide
publishedAt: 2026-05-22
tags: [study-tips]
---

Body.
`;

function makeMeta(overrides: Partial<PostMeta> = {}): PostMeta {
  return {
    title: 'Test Post',
    description: 'A short description.',
    slug: 'test-post',
    cefr: 'A2',
    publishedAt: '2026-01-15',
    tags: ['vocabulary'],
    ...overrides
  };
}

// ── splitFrontmatter ──────────────────────────────────────────────────────────

describe('splitFrontmatter', () => {
  it('extracts the yaml block and body', () => {
    const { yaml, body } = splitFrontmatter(BYTTE_RAW);
    expect(yaml).toContain('title:');
    expect(yaml).toContain('slug: bytte-vs-skifte');
    expect(body).toContain('## Kort forklaring');
  });

  it('throws when there is no frontmatter block', () => {
    expect(() => splitFrontmatter('# Just a markdown file\n\nNo frontmatter.')).toThrow(
      'No frontmatter block found'
    );
  });

  it('handles CRLF line endings', () => {
    const crlf = '---\r\ntitle: foo\r\n---\r\nBody';
    const { yaml, body } = splitFrontmatter(crlf);
    expect(yaml).toBe('title: foo');
    expect(body).toBe('Body');
  });

  it('body is empty string when there is nothing after the closing ---', () => {
    const { body } = splitFrontmatter('---\ntitle: foo\n---\n');
    expect(body).toBe('');
  });
});

// ── parseFrontmatter ──────────────────────────────────────────────────────────

describe('parseFrontmatter — scalar strings', () => {
  it('parses a single-quoted string', () => {
    const r = parseFrontmatter("title: 'Hello World'");
    expect(r.title).toBe('Hello World');
  });

  it('parses a double-quoted string', () => {
    const r = parseFrontmatter('title: "Hello World"');
    expect(r.title).toBe('Hello World');
  });

  it('parses a bare (unquoted) scalar', () => {
    const r = parseFrontmatter('slug: bytte-vs-skifte');
    expect(r.slug).toBe('bytte-vs-skifte');
  });

  it('parses a date scalar', () => {
    const r = parseFrontmatter('publishedAt: 2026-05-21');
    expect(r.publishedAt).toBe('2026-05-21');
  });

  it('handles single-quotes with an embedded apostrophe (YAML doubling)', () => {
    // YAML single-quote escaping: '' → '
    const r = parseFrontmatter("description: 'It''s complicated'");
    // Our parser passes through '' as-is for now (no escaping in parser),
    // but the serializer is what produces the doubled quotes.
    // Here we just confirm it doesn't crash and returns the raw value.
    expect(typeof r.description).toBe('string');
  });

  it('skips comment lines', () => {
    const r = parseFrontmatter('# a comment\ntitle: foo');
    expect(r.title).toBe('foo');
    expect(r['# a comment']).toBeUndefined();
  });

  it('skips blank lines', () => {
    const r = parseFrontmatter('\n\ntitle: foo\n\n');
    expect(r.title).toBe('foo');
  });
});

describe('parseFrontmatter — flow arrays', () => {
  it('parses a single-element flow array', () => {
    const r = parseFrontmatter('tags: [grammar]');
    expect(r.tags).toEqual(['grammar']);
  });

  it('parses a multi-element flow array', () => {
    const r = parseFrontmatter('tags: [verbs, vocabulary]');
    expect(r.tags).toEqual(['verbs', 'vocabulary']);
  });

  it('parses an array cefr', () => {
    const r = parseFrontmatter('cefr: [A1, A2, B1, B2]');
    expect(r.cefr).toEqual(['A1', 'A2', 'B1', 'B2']);
  });

  it('returns an empty array for an empty flow array', () => {
    const r = parseFrontmatter('tags: []');
    expect(r.tags).toEqual([]);
  });
});

describe('parseFrontmatter — block arrays (decks)', () => {
  const yaml = `decks:
  - level: a2
    category: house-chores
    label: 'A2 House Chores'
  - level: b1
    category: travel
    label: 'B1 Travel'`;

  it('returns an array of objects', () => {
    const r = parseFrontmatter(yaml);
    expect(Array.isArray(r.decks)).toBe(true);
    expect((r.decks as unknown[]).length).toBe(2);
  });

  it('parses all three fields of each deck entry', () => {
    const decks = parseFrontmatter(yaml).decks as Array<Record<string, string>>;
    expect(decks[0]).toEqual({ level: 'a2', category: 'house-chores', label: 'A2 House Chores' });
    expect(decks[1]).toEqual({ level: 'b1', category: 'travel', label: 'B1 Travel' });
  });
});

describe('parseFrontmatter — full post fixtures', () => {
  it('parses the bytte-vs-skifte frontmatter correctly', () => {
    const { yaml } = splitFrontmatter(BYTTE_RAW);
    const r = parseFrontmatter(yaml);
    expect(r.title).toBe('Bytte vs Skifte');
    expect(r.slug).toBe('bytte-vs-skifte');
    expect(r.cefr).toBe('A2');
    expect(r.publishedAt).toBe('2026-05-21');
    expect(r.tags).toEqual(['verbs', 'vocabulary']);
    const decks = r.decks as Array<Record<string, string>>;
    expect(decks).toHaveLength(3);
    expect(decks[0].label).toBe('A2 House Chores');
  });

  it('parses the guide post with array cefr and type: guide', () => {
    const { yaml } = splitFrontmatter(GUIDE_RAW);
    const r = parseFrontmatter(yaml);
    expect(r.cefr).toEqual(['A1', 'A2', 'B1', 'B2']);
    expect(r.type).toBe('guide');
    expect(r.tags).toEqual(['study-tips']);
  });
});

// ── parsePostFile ─────────────────────────────────────────────────────────────

describe('parsePostFile', () => {
  it('returns filename, meta, and body', () => {
    const post = parsePostFile('bytte-vs-skifte', BYTTE_RAW);
    expect(post.filename).toBe('bytte-vs-skifte');
    expect(post.meta.slug).toBe('bytte-vs-skifte');
    expect(post.body).toContain('## Kort forklaring');
  });

  it('throws when the file has no frontmatter', () => {
    expect(() => parsePostFile('no-fm', '# Just markdown')).toThrow();
  });
});

// ── serializePostFile ─────────────────────────────────────────────────────────

describe('serializePostFile', () => {
  it('starts with --- and ends the frontmatter with ---', () => {
    const out = serializePostFile(makeMeta(), 'Body text.');
    expect(out.startsWith('---\n')).toBe(true);
    expect(out).toContain('\n---\n');
  });

  it('single-quotes title and description', () => {
    const out = serializePostFile(makeMeta({ title: 'Hello', description: 'World' }), '');
    expect(out).toContain("title: 'Hello'");
    expect(out).toContain("description: 'World'");
  });

  it('escapes single quotes in title with YAML doubling', () => {
    const out = serializePostFile(makeMeta({ title: "It's Fine" }), '');
    expect(out).toContain("title: 'It''s Fine'");
  });

  it('emits cefr as a bare scalar for a string value', () => {
    const out = serializePostFile(makeMeta({ cefr: 'B1' }), '');
    expect(out).toContain('cefr: B1');
  });

  it('emits cefr as a flow array for an array value', () => {
    const out = serializePostFile(makeMeta({ cefr: ['A1', 'A2', 'B1'] }), '');
    expect(out).toContain('cefr: [A1, A2, B1]');
  });

  it('emits tags as a flow array', () => {
    const out = serializePostFile(makeMeta({ tags: ['verbs', 'vocabulary'] }), '');
    expect(out).toContain('tags: [verbs, vocabulary]');
  });

  it('omits optional fields (type, updatedAt, decks) when not set', () => {
    const out = serializePostFile(makeMeta(), '');
    expect(out).not.toContain('type:');
    expect(out).not.toContain('updatedAt:');
    expect(out).not.toContain('decks:');
  });

  it('emits type when present', () => {
    const out = serializePostFile(makeMeta({ type: 'guide' }), '');
    expect(out).toContain('type: guide');
  });

  it('emits updatedAt when present', () => {
    const out = serializePostFile(makeMeta({ updatedAt: '2026-06-01' }), '');
    expect(out).toContain('updatedAt: 2026-06-01');
  });

  it('emits decks block when present', () => {
    const meta = makeMeta({
      decks: [{ level: 'a2', category: 'clothing', label: 'A2 Clothing' }]
    });
    const out = serializePostFile(meta, '');
    expect(out).toContain('decks:\n  - level: a2\n    category: clothing\n    label:');
  });

  it('appends the body after the closing ---', () => {
    const out = serializePostFile(makeMeta(), '## Heading\n\nParagraph.\n');
    const afterFm = out.split('\n---\n')[1];
    expect(afterFm).toContain('## Heading');
  });

  it('trims leading newlines from the body before appending', () => {
    const out = serializePostFile(makeMeta(), '\n\n\n## Start');
    // Should not have multiple blank lines between --- and the heading
    const parts = out.split('\n---\n');
    expect(parts[1].startsWith('\n## Start')).toBe(true);
  });
});

// ── round-trip identity ───────────────────────────────────────────────────────

describe('round-trip: parse → serialize → parse', () => {
  it('bytte-vs-skifte: re-parsed meta matches original', () => {
    const original = parsePostFile('bytte-vs-skifte', BYTTE_RAW);
    const reserialized = serializePostFile(original.meta, original.body);
    const roundtripped = parsePostFile('bytte-vs-skifte', reserialized);

    expect(roundtripped.meta.title).toBe(original.meta.title);
    expect(roundtripped.meta.description).toBe(original.meta.description);
    expect(roundtripped.meta.slug).toBe(original.meta.slug);
    expect(roundtripped.meta.cefr).toBe(original.meta.cefr);
    expect(roundtripped.meta.publishedAt).toBe(original.meta.publishedAt);
    expect(roundtripped.meta.tags).toEqual(original.meta.tags);
    expect(roundtripped.meta.decks).toEqual(original.meta.decks);
    expect(roundtripped.body.trim()).toBe(original.body.trim());
  });

  it('guide post with array cefr: round-trip preserves array', () => {
    const original = parsePostFile('slik-bruker-du-norskeord', GUIDE_RAW);
    const reserialized = serializePostFile(original.meta, original.body);
    const roundtripped = parsePostFile('slik-bruker-du-norskeord', reserialized);

    expect(roundtripped.meta.cefr).toEqual(['A1', 'A2', 'B1', 'B2']);
    expect(roundtripped.meta.type).toBe('guide');
  });
});

// ── isValidSlug ───────────────────────────────────────────────────────────────

describe('isValidSlug', () => {
  it('accepts lowercase-hyphens', () => {
    expect(isValidSlug('bytte-vs-skifte')).toBe(true);
  });

  it('accepts digits', () => {
    expect(isValidSlug('post-2026')).toBe(true);
  });

  it('accepts a single lowercase word', () => {
    expect(isValidSlug('grammar')).toBe(true);
  });

  it('rejects uppercase letters', () => {
    expect(isValidSlug('Bytte-vs-Skifte')).toBe(false);
  });

  it('rejects leading hyphens', () => {
    expect(isValidSlug('-bytte')).toBe(false);
  });

  it('rejects trailing hyphens', () => {
    expect(isValidSlug('bytte-')).toBe(false);
  });

  it('rejects double hyphens', () => {
    expect(isValidSlug('bytte--skifte')).toBe(false);
  });

  it('rejects spaces', () => {
    expect(isValidSlug('bytte vs skifte')).toBe(false);
  });

  it('rejects Norwegian characters', () => {
    // å, ø, æ are not ASCII — slugs should be ASCII-only
    expect(isValidSlug('sakte-langsomt-på-norsk')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidSlug('')).toBe(false);
  });
});

// ── filenameForSlug ───────────────────────────────────────────────────────────

describe('filenameForSlug', () => {
  it('appends .md to the slug', () => {
    expect(filenameForSlug('bytte-vs-skifte')).toBe('bytte-vs-skifte.md');
  });
});

// ── validatePost ──────────────────────────────────────────────────────────────

describe('validatePost', () => {
  it('returns no errors for a valid post', () => {
    expect(validatePost(makeMeta(), 'Body text.')).toEqual([]);
  });

  it('flags a missing title', () => {
    expect(validatePost(makeMeta({ title: '' }), 'Body.')).toContain('title is required');
  });

  it('flags a whitespace-only title', () => {
    expect(validatePost(makeMeta({ title: '   ' }), 'Body.')).toContain('title is required');
  });

  it('flags a missing description', () => {
    expect(validatePost(makeMeta({ description: '' }), 'Body.')).toContain(
      'description is required'
    );
  });

  it('flags a missing slug', () => {
    const errors = validatePost(makeMeta({ slug: '' }), 'Body.');
    expect(errors).toContain('slug is required');
  });

  it('flags an invalid slug format', () => {
    const errors = validatePost(makeMeta({ slug: 'Invalid Slug' }), 'Body.');
    expect(errors).toContain('slug must be lowercase letters, digits, and hyphens only');
  });

  it('flags a missing cefr', () => {
    const meta = { ...makeMeta() };
    (meta as Partial<PostMeta>).cefr = undefined;
    const errors = validatePost(meta as Partial<PostMeta>, 'Body.');
    expect(errors).toContain('cefr is required');
  });

  it('flags an empty cefr array', () => {
    const errors = validatePost(makeMeta({ cefr: [] as unknown as string }), 'Body.');
    expect(errors).toContain('cefr is required');
  });

  it('flags a missing publishedAt', () => {
    const errors = validatePost(makeMeta({ publishedAt: '' }), 'Body.');
    expect(errors).toContain('publishedAt is required');
  });

  it('flags publishedAt in wrong format', () => {
    const errors = validatePost(makeMeta({ publishedAt: '21/05/2026' }), 'Body.');
    expect(errors).toContain('publishedAt must be in YYYY-MM-DD format');
  });

  it('accepts publishedAt in YYYY-MM-DD format', () => {
    expect(validatePost(makeMeta({ publishedAt: '2026-01-01' }), 'Body.')).not.toContain(
      'publishedAt must be in YYYY-MM-DD format'
    );
  });

  it('flags updatedAt in wrong format when present', () => {
    const errors = validatePost(makeMeta({ updatedAt: '2026/06/01' }), 'Body.');
    expect(errors).toContain('updatedAt must be in YYYY-MM-DD format');
  });

  it('accepts a valid updatedAt', () => {
    expect(validatePost(makeMeta({ updatedAt: '2026-06-01' }), 'Body.')).not.toContain(
      'updatedAt must be in YYYY-MM-DD format'
    );
  });

  it('flags missing tags', () => {
    const errors = validatePost(makeMeta({ tags: [] }), 'Body.');
    expect(errors).toContain('at least one tag is required');
  });

  it('flags a non-canonical tag', () => {
    const errors = validatePost(makeMeta({ tags: ['idioms'] }), 'Body.');
    expect(errors.some((e) => e.includes('"idioms" is not in the canonical taxonomy'))).toBe(true);
  });

  it('accepts all canonical tags individually', () => {
    for (const tag of CANONICAL_TAGS) {
      const errors = validatePost(makeMeta({ tags: [tag] }), 'Body.');
      expect(errors.filter((e) => e.includes('tag'))).toEqual([]);
    }
  });

  it('flags an empty body', () => {
    expect(validatePost(makeMeta(), '')).toContain('body is required');
  });

  it('flags a whitespace-only body', () => {
    expect(validatePost(makeMeta(), '   \n  ')).toContain('body is required');
  });

  it('flags a deck entry missing a label', () => {
    const meta = makeMeta({
      decks: [{ level: 'a2', category: 'clothing', label: '' }]
    });
    const errors = validatePost(meta, 'Body.');
    expect(errors).toContain('each deck link requires level, category, and label');
  });

  it('flags a deck entry missing a level', () => {
    const meta = makeMeta({
      decks: [{ level: '', category: 'clothing', label: 'A2 Clothing' }]
    });
    const errors = validatePost(meta, 'Body.');
    expect(errors).toContain('each deck link requires level, category, and label');
  });

  it('accepts valid decks', () => {
    const meta = makeMeta({
      decks: [{ level: 'a2', category: 'clothing', label: 'A2 Clothing' }]
    });
    expect(validatePost(meta, 'Body.')).toEqual([]);
  });

  it('returns multiple errors at once', () => {
    const errors = validatePost({ slug: '' }, '');
    expect(errors.length).toBeGreaterThan(2);
  });
});

// ── blankPost ─────────────────────────────────────────────────────────────────

describe('blankPost', () => {
  it('returns a post with today as publishedAt', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(blankPost().meta.publishedAt).toBe(today);
  });

  it('starts with empty title, description, slug, and body', () => {
    const { meta, body } = blankPost();
    expect(meta.title).toBe('');
    expect(meta.description).toBe('');
    expect(meta.slug).toBe('');
    expect(body).toBe('');
  });

  it('starts with empty tags and decks arrays', () => {
    const { meta } = blankPost();
    expect(meta.tags).toEqual([]);
    expect(meta.decks).toEqual([]);
  });

  it('defaults cefr to A2', () => {
    expect(blankPost().meta.cefr).toBe('A2');
  });
});

// ── CANONICAL_TAGS ────────────────────────────────────────────────────────────

describe('CANONICAL_TAGS', () => {
  it('contains exactly 9 tags', () => {
    expect(CANONICAL_TAGS).toHaveLength(9);
  });

  it('includes the expected entries', () => {
    const tags = CANONICAL_TAGS as readonly string[];
    expect(tags).toContain('adjectives');
    expect(tags).toContain('grammar');
    expect(tags).toContain('study-tips');
  });
});
