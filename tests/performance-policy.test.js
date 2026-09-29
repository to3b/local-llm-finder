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

const journeys = fs.readFileSync(new URL('../dist/journeys.js', import.meta.url), 'utf8');
assert.equal(count(journeys, /form\.addEventListener\('input'/g), 1);
assert.equal(count(journeys, /form\.addEventListener\('change'/g), 0, 'Journey changes must not duplicate input work');
assert.ok(journeys.includes("if (active === 'find') return;"), 'Inactive comparison journeys must not schedule work');
assert.ok(journeys.includes("event.target.value.trim() && !gpu()"), 'Partial GPU names must not rerun capacity simulations');

// Rendering policy: no perpetual decorative animation or document-wide result
// rewriting. These checks guard the mechanisms, not a device-specific FPS claim.
const styles = fs.readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const palette = fs.readFileSync(new URL('../dist/palette.css', import.meta.url), 'utf8');
for (const css of [styles, palette]) {
  assert.doesNotMatch(css, /ambient-drift|filter:\s*(?:blur|brightness)/, 'Ambient and hover effects must not require filtered layers');
  assert.doesNotMatch(css, /position:\s*fixed|background-attachment:\s*fixed/, 'Decorative backgrounds must scroll with the document');
}
const links = fs.readFileSync(new URL('../dist/model-links.js', import.meta.url), 'utf8');
assert.doesNotMatch(links, /MutationObserver|document\./, 'Model links must render directly without observing and rewriting the document');
assert.ok(app.includes('huggingFaceAnchor(model)'), 'Finder rows must include publisher links on first render');
assert.ok(journeys.includes('huggingFaceAnchor(item.model)'), 'Comparison cards must include publisher links');
assert.ok(journeys.includes('huggingFaceAnchor(candidate.model)'), 'Upgrade milestones must include publisher links');
console.log('Rendering policy passed: static backgrounds, filter-free hover and direct model links.');
