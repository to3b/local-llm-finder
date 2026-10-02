import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = p => readFile(new URL('../' + p, import.meta.url), 'utf8');
const meta = (html, name) => html.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]*)"`))?.[1];
const schemas = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => {const data=JSON.parse(m[1]); return data['@graph'] || [data];});
const canonical = html => [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map(m=>m[1]);
const root = await read('index.html');
const dist = await read('dist/index.html');
for (const html of [root, dist]) {
  assert.deepEqual(canonical(html), ['https://localllmfinder.com/']);
  assert.match(meta(html,'robots'), /^index,follow/);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(meta(html,'description'));
  assert.equal(meta(html,'og:description'),meta(html,'description'));
  const data=schemas(html);
  assert.ok(data.some(s=>s['@type']==='WebSite' && s.url==='https://localllmfinder.com/'));
  assert.ok(data.some(s=>s['@type']==='Organization' && s['@id']==='https://localllmfinder.com/#organization'));
  assert.ok(data.some(s=>s['@type']==='WebApplication' && s.isAccessibleForFree===true));
  assert.ok(!data.some(s=>s.aggregateRating||s.review),'Do not claim unmeasured ratings');
  const references=[...html.matchAll(/<a[^>]*href="(https:\/\/knowledge\.localllmfinder\.com\/(models|hardware|guides)\/[^"#]+\/)"/g)];
  assert.ok(references.some(m=>m[2]==='models'));
  assert.ok(references.some(m=>m[2]==='hardware'));
  assert.ok(references.some(m=>m[2]==='guides'),'Useful articles must be linked in source HTML without JavaScript');
  assert.ok(!/href="https:\/\/docs\.google\.com\/spreadsheets/.test(html),'Do not expose visitor edit links');
}
assert.equal(meta(root,'description'),meta(dist,'description'));
for (const path of ['dist/methodology.html','dist/privacy.html','dist/terms.html']) {
  const html=await read(path);
  assert.deepEqual(canonical(html),['https://localllmfinder.com/'+path]);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(meta(html,'description'));
  assert.match(meta(html,'robots'),/^index,follow/);
}
const sitemap=await read('sitemap.xml');
assert.equal(sitemap,await read('dist/sitemap.xml'));
for(const url of [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1])){
  const parsed=new URL(url);assert.equal(parsed.origin,'https://localllmfinder.com');
  const html=await read(parsed.pathname==='/'?'index.html':parsed.pathname.slice(1));
  assert.deepEqual(canonical(html),[url]);assert.ok(!meta(html,'robots').includes('noindex'));
}
for(const path of ['tests/index.html','tests/privacy.html','knowledge.html']) {
  const html=await read(path);assert.match(meta(html,'robots'),/^noindex/);
  assert.ok(!sitemap.includes('/'+path),'Forms and retired previews must stay outside the sitemap');
}
console.log('SEO passed: canonical pages, crawlable article links, matching metadata, truthful schema and excluded utility pages.');
