import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = Object.fromEntries(await Promise.all([
  ['index', 'index.html'],
  ['distIndex', 'dist/index.html'],
  ['robots', 'robots.txt'],
  ['sitemap', 'sitemap.xml'],
  ['readme', 'README.md'],
  ['changelog', 'CHANGELOG.md'],
  ['package', 'package.json']
].map(async ([key, path]) => [key, await readFile(path, 'utf8')])));

const publicUrl = 'https://to3b.github.io/local-llm-finder/';
assert.match(files.index, new RegExp(`<link rel="canonical" href="${publicUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
assert.match(files.distIndex, new RegExp(`<link rel="canonical" href="${publicUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
assert.match(files.index, /<base href="\.\/dist\/">/);
assert.match(files.robots, /Sitemap: https:\/\/to3b\.github\.io\/local-llm-finder\/sitemap\.xml/);
assert.match(files.sitemap, /<loc>https:\/\/to3b\.github\.io\/local-llm-finder\/<\/loc>/);
assert.match(files.readme, /135\+ GPU profiles/);
assert.match(files.readme, /130\+ local model profiles/);
assert.match(files.changelog, /## 1\.0\.0 — 28 September 2026/);
assert.equal(JSON.parse(files.package).version, '1.0.0');

for (const [name, content] of Object.entries(files)) {
  assert.ok(!content.includes('local-llm-finder.to3b.chatgpt.site'), `${name} still references the retired host`);
}

console.log('V1 release metadata checks passed.');
