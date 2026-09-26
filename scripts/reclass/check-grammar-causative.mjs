import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './lib.mjs';

const raw = fs.readFileSync(path.join(DATA_DIR, 'grammar-b1.json'), 'utf8');
const data = JSON.parse(raw);

console.log(
  'Top-level shape:',
  Array.isArray(data) ? `array of ${data.length}` : Object.keys(data)
);

// Search the whole file text for causative-related keywords
const keywords = ['causative', 'kausativ', 'få noen til', 'til å', 'få + '];
for (const kw of keywords) {
  const count = (raw.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || [])
    .length;
  console.log(`"${kw}": ${count} occurrence(s)`);
}

// If array of topic objects, print titles/ids that look relevant
if (Array.isArray(data)) {
  for (const item of data) {
    const text = JSON.stringify(item).toLowerCase();
    if (
      text.includes('få') &&
      (text.includes('til å') || text.includes('causat') || text.includes('kausativ'))
    ) {
      console.log('\n--- possible match ---');
      console.log(JSON.stringify(item, null, 2).slice(0, 2000));
    }
  }
}
