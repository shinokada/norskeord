import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './lib.mjs';
const b1 = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'grammar-b1.json'), 'utf8'));
const faEntries = b1.filter((x) => x.topic === 'verbet-a-fa');
console.log(JSON.stringify(faEntries.slice(5), null, 2));
