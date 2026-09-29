import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');

const count = (text, pattern) => (text.match(pattern) || []).length;

assert.equal(count(app, /form\.addEventListener\('input'/g), 1, 'Finder should have one form input listener');
assert.equal(count(app, /form\.addEventListener\('change'/g), 0, 'Finder should not duplicate form work on change after input');
assert.ok(app.includes('requestAnimationFrame(() => {'), 'Finder updates should be scheduled, not run synchronously for every event');
assert.ok(app.includes('if (!isFindActive()) return;'), 'Hidden Find journey should not recompute recommendations');
assert.match(app, /function scheduleUpdate\(\) \{[\s\S]*?updateDevice\(\);[\s\S]*?if \(!isFindActive\(\)\) return;[\s\S]*?requestAnimationFrame/, 'Hardware mode must synchronize before the hidden-Find guard so device panels work in every journey');
assert.ok(app.includes("event.target === gpuInput && gpuInput.value.trim() && !selectedGPU()"), 'Partial GPU-name typing should skip full recommendation updates');
assert.ok(!app.includes('data.catalog.map(item => row('), 'Full catalogue should not be rendered during every finder update');
assert.ok(app.includes('catalogState.items.filter'), 'Catalogue search should filter data before rendering rows');
assert.ok(app.includes('matches.slice(0, catalogLimit)'), 'Catalogue should render only the visible page of rows');

console.log('UI performance policy passed: hardware state stays synchronized across journeys while recommendation work remains guarded and catalogue rendering stays lazy.');
