import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile('dist/app.js', 'utf8');

// Shared setups deliberately use a URL hash so GitHub Pages serves the same static
// document while the browser restores state locally. Keep every written key readable.
const writtenKeys = [...app.matchAll(/params\.set\('([^']+)'/g)].map(match => match[1]);
const readKeys = new Set([...app.matchAll(/params\.(?:get|has)\('([^']+)'/g)].map(match => match[1]));

for (const key of writtenKeys) {
  assert.ok(readKeys.has(key), `Shared-state key ${key} is written but never restored`);
}

for (const required of ['d', 't', 'p', 'c']) {
  assert.ok(writtenKeys.includes(required), `Shared setup should include ${required}`);
}

assert.match(app, /new URL\('\/', window\.location\.origin\)/, 'Shared setup links should use the canonical site root');
assert.match(app, /url\.search = '';/);
assert.match(app, /url\.hash = '';/);
assert.match(app, /url\.hash = params\.toString\(\);/);
assert.match(app, /const oldTasks = \(params\.get\('u'\) \|\| ''\)/, 'Legacy task links should remain readable');
assert.match(app, /params\.get\('t'\)/, 'Primary-task links should be restored');

console.log(`Share-state regression passed across ${new Set(writtenKeys).size} URL-hash keys.`);
