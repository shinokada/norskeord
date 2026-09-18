#!/usr/bin/env node
// Usage:
//   node scripts/reclass/migration-map-sweep.mjs                 (report only)
//   node scripts/reclass/migration-map-sweep.mjs --write          (apply logged remaps)
//
// Stale-value fixes are decided in scripts/reclass/decisions/migration-remaps.jsonl,
// one per line:
//   {"key":"u-a2-224","action":"remap","to":"w-007952","reason":"..."}
//   {"key":"u-a1-084","action":"delete","reason":"..."}
// Any stale value with no matching decision is reported but left untouched.

import fs from 'node:fs';
import path from 'node:path';
import { levelDataPaths, loadJSON, saveJSON, collectAllIds, DECISIONS_DIR } from './lib.mjs';

const write = process.argv.includes('--write');
const { migrationMap } = levelDataPaths('a2'); // path is level-independent
const remapsFile = path.join(DECISIONS_DIR, 'migration-remaps.jsonl');

const map = loadJSON(migrationMap);
const validIds = collectAllIds();

const remaps = fs.existsSync(remapsFile)
	? fs
			.readFileSync(remapsFile, 'utf8')
			.split('\n')
			.map((l) => l.trim())
			.filter(Boolean)
			.map((l) => JSON.parse(l))
	: [];
const remapByKey = new Map(remaps.map((r) => [r.key, r]));

const stale = Object.entries(map).filter(([, id]) => !validIds.has(id));

if (stale.length === 0) {
	console.log('id-migration-map.json: no stale values found. Nothing to do.');
	process.exit(0);
}

console.log(`Found ${stale.length} stale value(s) in id-migration-map.json:\n`);

const toApply = [];
const unresolved = [];
for (const [key, id] of stale) {
	const r = remapByKey.get(key);
	if (!r) {
		unresolved.push([key, id]);
		continue;
	}
	toApply.push({ key, id, decision: r });
}

for (const [key, id] of unresolved) {
	console.log(`  NEEDS DECISION  ${key} -> ${id} (id no longer exists anywhere)`);
}
for (const { key, id, decision } of toApply) {
	const desc =
		decision.action === 'remap' ? `remap to ${decision.to}` : `delete key`;
	console.log(`  ${write ? 'APPLYING' : 'PLANNED'}  ${key} -> ${id}  :: ${desc}  (${decision.reason ?? ''})`);
}

if (unresolved.length > 0) {
	console.log(
		`\n${unresolved.length} stale value(s) have no decision yet — add them to scripts/reclass/decisions/migration-remaps.jsonl before applying.`
	);
}

if (toApply.length === 0) {
	process.exit(0);
}
if (!write) {
	console.log('\nRe-run with --write to apply the decisions above.');
	process.exit(0);
}

for (const { key, decision } of toApply) {
	if (decision.action === 'remap') {
		if (!validIds.has(decision.to)) {
			console.error(`Refusing: remap target ${decision.to} for ${key} does not exist in production either.`);
			process.exit(1);
		}
		map[key] = decision.to;
	} else if (decision.action === 'delete') {
		delete map[key];
	}
}
saveJSON(migrationMap, map);

const verify = loadJSON(migrationMap);
const stillStale = toApply.filter(({ key, decision }) => {
	if (decision.action === 'delete') return key in verify;
	return verify[key] !== decision.to;
});
if (stillStale.length > 0) {
	console.error('VERIFICATION FAILED for:', stillStale.map((s) => s.key));
	process.exit(1);
}
console.log(`\nApplied ${toApply.length} fix(es), verified via fresh read-back.`);
