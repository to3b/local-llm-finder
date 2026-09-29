import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GPUs } from '../dist/data.js';
import { recommend } from '../dist/recommend.js';
import { fitLabel } from '../dist/presentation.js';

const files = Object.fromEntries(await Promise.all([
  ['index', 'index.html'],
  ['distIndex', 'dist/index.html'],
  ['knowledge', 'knowledge.html'],
  ['methodology', 'dist/methodology.html'],
  ['privacy', 'dist/privacy.html'],
  ['terms', 'dist/terms.html'],
  ['docsCss', 'dist/docs.css'],
  ['app', 'dist/app.js'],
  ['journeys', 'dist/journeys.js'],
  ['copyTune', 'dist/copy-tune.js'],
  ['robots', 'robots.txt'],
  ['sitemap', 'sitemap.xml'],
  ['readme', 'README.md'],
  ['changelog', 'CHANGELOG.md'],
  ['package', 'package.json'],
  ['cname', 'CNAME']
].map(async ([key, path]) => [key, await readFile(path, 'utf8')])));

const publicUrl = 'https://localllmfinder.com/';
const homepageTitle = 'Local LLM Finder: Find Models for Your GPU, RAM or Mac';
const homepageHeading = 'Which local LLM can your computer run?';

assert.match(files.index, new RegExp(`<link rel="canonical" href="${publicUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
assert.match(files.distIndex, new RegExp(`<link rel="canonical" href="${publicUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
assert.match(files.index, /<base href="\.\/dist\/">/);
for (const name of ['index', 'distIndex']) {
  assert.ok(files[name].includes(`<title>${homepageTitle}</title>`), `${name} must use the deliberate homepage title`);
  assert.ok(files[name].includes(`<h1 id="page-heading">${homepageHeading}</h1>`), `${name} must expose the hardware-intent H1 in source HTML`);
  assert.ok(files[name].includes('What fits an RTX 3060 12 GB for coding?'), `${name} must include the static worked example`);
  assert.match(files[name], /id="speed-input"[^>]+value="1"/, `${name} must default to no hard speed floor`);
  assert.match(files[name], /id="priority-input"[^>]+min="1"[^>]+max="5"[^>]+step="1"/, `${name} must keep the five-step speed/quality slider`);
  assert.ok(files[name].includes('id="advanced-settings"'), `${name} must keep Advanced settings`);
  assert.ok(files[name].includes('id="power-settings"'), `${name} must keep Power user model controls`);
  assert.ok(files[name].includes('id="quant-input"'), `${name} must keep fixed/automatic quantization controls`);
  assert.ok(files[name].includes('href="/knowledge.html"'), `${name} must expose the Knowledge preview`);
  assert.ok(files[name].includes('class="homepage-trust"'), `${name} must keep the compact trust note`);
  assert.ok(!files[name].includes('How the finder works'), `${name} should not reintroduce the removed filler explainer`);
  assert.ok(!files[name].includes('Local LLM basics'), `${name} should not reintroduce the removed homepage FAQ`);
}

assert.match(files.knowledge, /<meta name="robots" content="noindex,follow">/, 'Knowledge preview must stay out of search until substantive pages launch');
assert.match(files.knowledge, /<link rel="canonical" href="https:\/\/localllmfinder\.com\/knowledge\.html">/);
assert.ok(files.knowledge.includes('Pages will be published when they have enough useful information to stand on their own.'), 'Knowledge preview must explain the staged publishing approach');
assert.ok(files.knowledge.includes('href="/"'), 'Knowledge preview must link back to the Finder');

for (const name of ['knowledge', 'methodology', 'privacy', 'terms']) {
  assert.ok(files[name].includes('docs.css?v=20260929a'), `${name} must use the shared static-page design`);
  assert.ok(files[name].includes('class="site-topbar"'), `${name} must use the shared site header`);
  assert.ok(files[name].includes('class="doc-footer"'), `${name} must use the shared site footer`);
}
assert.ok(files.docsCss.includes('.docs-shell'), 'shared static-page stylesheet must define the document shell');
assert.ok(files.docsCss.includes('.doc-hero'), 'shared static-page stylesheet must define the document hero');
assert.ok(files.docsCss.includes('.site-topbar'), 'shared static-page stylesheet must define the site header');

// Keep the crawlable worked example tied to the same engine/data that powers the UI.
// This catches stale homepage copy whenever a calibration or ranking change alters it.
const exampleGpu = GPUs.find(gpu => gpu.id === 'rtx-3060');
assert.ok(exampleGpu, 'RTX 3060 profile must exist for the homepage example');
const example = recommend({
  hardware: { mode: 'gpu', vramGB: 12, ramGB: 32, bandwidthGBs: exampleGpu.bandwidthGBs, speedKnown: true },
  useCases: ['coding'], primaryUse: 'coding', preference: 3, minSpeed: 1, contextK: 8,
  quantization: 'auto', maxWeightsGB: null, family: null
});
assert.ok(example.matches.length >= 3, 'Homepage worked example requires three current matches');
const fmt = value => Number.isInteger(value) ? String(value) : value.toFixed(1);
for (const [rank, item] of example.matches.slice(0, 3).entries()) {
  const expected = `<article><span class="step-number">#${rank + 1}</span><h3>${item.model.name}</h3><p>${item.quant.name} · ${fmt(item.requiredGB)} GB estimated memory · ${item.speedLow}–${item.speedHigh} tok/s rough speed · ${fitLabel(item.quality)} coding fit.</p></article>`;
  for (const name of ['index', 'distIndex']) {
    assert.ok(files[name].includes(expected), `${name} worked example #${rank + 1} must match the current recommendation engine`);
  }
}

assert.ok(files.journeys.includes(`document.title = '${homepageTitle}'`), 'journey UI must preserve the source title');
assert.ok(files.journeys.includes(`textContent = '${homepageHeading}'`), 'journey UI must preserve the source H1');
assert.ok(files.copyTune.includes(`heading.textContent = '${homepageHeading}'`), 'copy tuning must preserve the source H1');
assert.match(files.app, /new URL\('\/', window\.location\.origin\)/, 'shared setup links must use the canonical root URL');
assert.match(files.journeys, /new URL\('\/', location\.origin\)/, 'journey hashes must use the canonical root URL');

assert.match(files.methodology, /<link rel="canonical" href="https:\/\/localllmfinder\.com\/dist\/methodology\.html">/);
assert.match(files.privacy, /<link rel="canonical" href="https:\/\/localllmfinder\.com\/dist\/privacy\.html">/);
assert.match(files.terms, /<link rel="canonical" href="https:\/\/localllmfinder\.com\/dist\/terms\.html">/);
for (const name of ['methodology', 'privacy', 'terms']) {
  assert.match(files[name], /href="\/">(?:Local LLM Finder|← Back to the finder)<\/a>/, `${name} must link back to the canonical root`);
}

assert.match(files.robots, /Sitemap: https:\/\/localllmfinder\.com\/sitemap\.xml/);
assert.match(files.sitemap, /<loc>https:\/\/localllmfinder\.com\/<\/loc>/);
assert.ok(!files.sitemap.includes('/knowledge.html'), 'noindex Knowledge preview must not be placed in the sitemap');
assert.equal(files.cname.trim(), 'localllmfinder.com');
assert.match(files.readme, /Public site: https:\/\/localllmfinder\.com\//);
assert.match(files.readme, /135\+ GPU profiles/);
assert.match(files.readme, /130\+ local model profiles/);
assert.match(files.changelog, /## 1\.0\.0 — 28 September 2026/);
assert.equal(JSON.parse(files.package).version, '1.0.0');

for (const [name, content] of Object.entries(files)) {
  assert.ok(!content.includes('local-llm-finder.to3b.chatgpt.site'), `${name} still references the retired host`);
  if (!['changelog'].includes(name)) {
    assert.ok(!content.includes('https://to3b.github.io/local-llm-finder/'), `${name} still points to the old public URL`);
  }
}

console.log('V1 custom-domain, homepage SEO, compact support content, shared static-page design, Knowledge preview and worked-example checks passed.');
