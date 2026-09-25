import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './lib.mjs';

const b1 = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'grammar-b1.json'), 'utf8'));
const topics = [...new Set(b1.map((x) => x.topic))].sort();
console.log('B1 grammar topics (' + topics.length + '):');
console.log(topics.join('\n'));

console.log('\n--- topics containing "fa" or "verb" or "kausativ" ---');
console.log(topics.filter((t) => /fa|verb|kausativ|infinitiv/i.test(t)).join('\n'));

// Check the topic index file for descriptions
const idxPath = path.join(DATA_DIR, 'grammar-topic-index.json');
const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
console.log('\n--- grammar-topic-index.json shape ---');
console.log(Array.isArray(idx) ? `array of ${idx.length}` : Object.keys(idx));
const idxText = JSON.stringify(idx).toLowerCase();
console.log('contains "kausativ":', idxText.includes('kausativ'));
console.log('contains "causative":', idxText.includes('causative'));
console.log('contains "få noen til":', idxText.includes('få noen til'));

// find verbet-a-fa topic entries fully, to see what it actually teaches
const faEntries = b1.filter((x) => x.topic === 'verbet-a-fa');
console.log(`\n--- topic "verbet-a-fa": ${faEntries.length} entries ---`);
console.log(JSON.stringify(faEntries.slice(0, 5), null, 2));
