// src/lib/grammar/summary.ts
// Plain-text card previews for grammar rules (grammar-update.md, Phase 5).
//
// `GrammarRule.explanationNb` is lightly formatted (see the comment in
// rules/index.ts): blank line = new paragraph, "• " = bullet, "**x**" = bold.
// Cards used to show that string raw, so "**-er**" and bullet markers leaked
// into the preview. plainSummary() flattens it to clean prose.
//
// Pure and side-effect free.

const MIN_BLOCK_LENGTH = 60;
const DEFAULT_MAX_LENGTH = 150;

function flatten(block: string): string {
  return block
    .replace(/^\s*•\s*/gm, '') // bullet markers
    .replace(/\*\*(.+?)\*\*/g, '$1') // **bold**
    .replace(/`/g, '')
    .replace(/^#+\s*/gm, '') // stray markdown headings
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * First paragraph(s) of an explanation as one line of plain text, cut at a
 * word boundary with an ellipsis if longer than `max`. A very short first
 * paragraph (a label) is joined with the next one.
 */
export function plainSummary(explanation: string, max = DEFAULT_MAX_LENGTH): string {
  const blocks = explanation
    .split(/\n\s*\n/)
    .map(flatten)
    .filter((b) => b.length > 0);

  let text = '';
  for (const block of blocks) {
    text = text ? `${text} ${block}` : block;
    if (text.length >= MIN_BLOCK_LENGTH) break;
  }

  if (text.length <= max) return text;

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,;:.\-–—]+$/, '')}…`;
}
