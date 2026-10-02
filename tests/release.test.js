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
  ['recommendModule', 'dist/recommend.js'],
  ['copyTune', 'dist/copy-tune.js'],
  ['robots', 'robots.txt'],
  ['sitemap', 'sitemap.xml'],
  ['readme', 'README.md'],
  ['changelog', 'CHANGELOG.md'],
  ['package', 'package.json'],
  ['cname', 'CNAME']
].map(async ([key, path]) => [key, await readFile(path, 'utf8')])));

const publicUrl = 'https://localllmfinder.com/';
const knowledgeUrl = 'https://knowledge.localllmfinder.com/';
const homepageTitle = 'Local LLM Finder: Find Models for Your GPU, RAM or Mac';
const homepageHeading = 'Which local LLM can your computer run?';

assert.match(files.index, new RegExp(`<link rel="canonical" href="${publicUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
assert.match(files.distIndex, new RegExp(`<link rel="canonical" href="${publicUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
assert.match(files.index, /<base href="\.\/dist\/">/);
for (const name of ['index', 'distIndex']) {
  assert.ok(files[name].includes(`<title>${homepageTitle}</title>`), `${name} must use the deliberate homepage title`);
  assert.ok(files[name].includes(`<h1 id="page-heading">${homepageHeading}</h1>`), `${name} must expose the hardware-intent H1 in source HTML`);
  assert.ok(!files[name].includes('example-heading'), `${name} must omit the removed worked example`);
  assert.match(files[name], /id="speed-input"[^>]+value="1"/, `${name} must default to no hard speed floor`);
  assert.match(files[name], /id="priority-input"[^>]+min="1"[^>]+max="5"[^>]+step="1"/, `${name} must keep the five-step speed/quality slider`);
  assert.ok(files[name].includes('id="advanced-settings"'), `${name} must keep Advanced settings`);
  assert.ok(files[name].includes('id="power-settings"'), `${name} must keep Power user model controls`);
  assert.ok(files[name].includes('id="quant-input"'), `${name} must keep fixed/automatic quantization controls`);
  assert.ok(files[name].includes(`href="${knowledgeUrl}"`), `${name} must link to the Knowledge subdomain`);
  assert.ok(!files[name].includes('href="/knowledge.html"'), `${name} must not point visitors at the retired local Knowledge preview`);
  assert.ok(files[name].includes('class="homepage-trust"'), `${name} must keep the compact trust note`);
  assert.ok(!files[name].includes('How the finder works'), `${name} should not reintroduce the removed filler explainer`);
  assert.ok(!files[name].includes('Local LLM basics'), `${name} should not reintroduce the removed homepage FAQ`);
}

// Preloads and runtime imports must identify the same release modules.
const recommendImport = files.app.match(/from '(\.\/recommend\.js\?v=[^']+)'/)[1];
const journeyImport = files.recommendModule.match(/import\('(\.\/journeys\.js\?v=[^']+)'\)/)[1];
assert.ok(files.journeys.includes(`from '${recommendImport}'`), 'recommendation module must be shared by Finder and journeys');
for (const name of ['index', 'distIndex']) {
  const appScript = files[name].match(/<script type="module" src="([^"]*app\.js\?v=[^"]+)"/)[1];
  for (const url of [appScript, recommendImport, journeyImport]) {
    assert.ok(files[name].includes(`<link rel="modulepreload" href="${url}">`), `${name} must preload the exact runtime module URL: ${url}`);
  }
}

assert.match(files.knowledge, /<meta name="robots" content="noindex,follow">/, 'Knowledge preview must stay out of search until substantive pages launch');
assert.match(files.knowledge, /<link rel="canonical" href="https:\/\/knowledge\.localllmfinder\.com\/">/, 'Retired preview must identify the destination Knowledge site');
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

assert.ok(files.journeys.includes(`document.title = '${homepageTitle}'`), 'journey UI must preserve the source title');
assert.ok(files.journeys.includes(`textContent = '${homepageHeading}'`), 'journey UI must preserve the source H1');
assert.ok(files.copyTune.includes(`heading.textContent = '${homepageHeading}'`), 'copy tuning must preserve the source H1');
assert.ok(files.app.includes('new URL("/", window.location.origin)'), 'Share links must use the configured site root');
assert.ok(files.journeys.includes('new URL("/", location.origin)'), 'Journey links must use the configured site root');

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

console.log('V1 custom-domain, homepage SEO, compact support content, Knowledge subdomain link, shared static-page design, Knowledge preview checks passed.');
