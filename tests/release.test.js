import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = Object.fromEntries(await Promise.all([
  ['index', 'index.html'],
  ['distIndex', 'dist/index.html'],
  ['methodology', 'dist/methodology.html'],
  ['privacy', 'dist/privacy.html'],
  ['terms', 'dist/terms.html'],
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
  assert.ok(files[name].includes('Qwen2.5-Coder 14B'), `${name} worked example must include its current top candidate`);
  assert.match(files[name], /id="speed-input"[^>]+value="1"/, `${name} must default to no hard speed floor`);
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

console.log('V1 custom-domain and homepage SEO checks passed.');
