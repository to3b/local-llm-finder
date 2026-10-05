import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MODELS } from '../dist/data.js';
import { estimate, recommend, MEMORY_UNITS } from '../dist/recommend.js';
import { buildModelsFromCsv, parseCsv } from '../dist/live-data.js';
import { REVIEWED_MEMORY_PROFILES } from '../dist/model-memory-profiles.js';

for (const [name, profile] of Object.entries(REVIEWED_MEMORY_PROFILES)) {
  const m = MODELS.find(x => x.name === name);
  assert.equal(m.contextK, 32);
  assert.equal(m.nativeContextTokens, 32768);
  assert.equal(m.cacheType, 'f16');
  assert.equal(m.kvGBPer1K, profile.kvGBPer1K);
  const q = m.quantizations[0];
  const short = estimate(m, q, { vramGB: 24, ramGB: 32 }, 4);
  const long = estimate(m, q, { vramGB: 24, ramGB: 32 }, 16);
  assert.equal(long.cacheBytes, short.cacheBytes * 4, 'Context scaling uses the same stated cache precision');
  assert.equal(estimate(m, m.quantizations[1], { vramGB: 24, ramGB: 32 }, 16).cacheBytes, long.cacheBytes, 'Q5 weights do not change FP16 cache');
  const r = recommend({ hardware: { vramGB: 96, ramGB: 128, speedKnown: false }, useCases: ['chat'], preference: 3, minSpeed: 1, contextK: 64 }, [m]);
  assert.equal(r.catalog.length, 0, '64K does not silently enable extended context');
  assert.equal(r.excluded.context, 1);
}

const qwen = MODELS.find(x => x.name === 'Qwen3 8B');
const q = qwen.quantizations.find(x => x.name === 'Q4_K_M');
const sixteen = estimate(qwen, q, { vramGB: 8, ramGB: 32 }, 16);
assert.equal(sixteen.cacheBytes, 2359296000);
assert.ok(Math.abs(sixteen.requiredDecimalGB - 8.289296) < 1e-10);
assert.ok(Math.abs(sixteen.requiredGiB - 8.289296 * 1e9 / MEMORY_UNITS.GiB) < 1e-12);
assert.equal(sixteen.memoryFit, 'tight', '8 GiB is a tight planning fit, not a universal allocation failure');
assert.ok(sixteen.headroomGiB > 0 && sixteen.headroomGiB < 0.05);
assert.equal(estimate(qwen, q, { vramGB: 12, ramGB: 32 }, 16).memoryFit, 'fits');
// A displayed 7.7 GiB must not admit a budget smaller than the unrounded total.
const boundary = estimate(qwen, q, { vramGB: 7.94, ramGB: 32 }, 16);
assert.equal(boundary.fits, false);

const headers = ['Enabled','Model ID','Model Name','Parameters B','Family','Base Q4 GB','Context K','KV GB / 1K','Chat','Coding','Reasoning','Writing','Long Context','Cache Type','Memory Source','Native Context Tokens','Memory Reviewed At'];
const row = [true,'qwen','Qwen3 8B',8,'Qwen3',5.03,32,.147456,84,82,84,78,80,'f16',qwen.memorySource,32768,'2026-10-05'];
const csv = values => [headers,values].map(r => r.map(v => '"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');
assert.equal(buildModelsFromCsv(csv(row))[0].nativeContextTokens, 32768);
assert.throws(() => buildModelsFromCsv(csv(row.map((v,i) => i===6?64:v))), /native context/);
assert.throws(() => buildModelsFromCsv(csv(row.map((v,i) => i===13?'q4_0':v))), /Cache Type/);
assert.throws(() => buildModelsFromCsv(csv(row.map((v,i) => i===14?'':v))), /source and review date/);
assert.throws(() => buildModelsFromCsv(csv(row.map((v,i) => i===16?'05/10/2026':v))), /YYYY-MM-DD/);
const legacy = csv(row).split('\n').map(line => parseCsv(line)[0].slice(0,13).join(',')).join('\n');
assert.equal(buildModelsFromCsv(legacy)[0].cacheType, 'planning', 'Old schemas remain supported without claiming verified precision');
const doc = await readFile(new URL('../docs/catalogue-memory.md', import.meta.url), 'utf8');
assert.ok(doc.includes('decimal GB') && doc.includes('GiB'));
console.log('Sourced FP16 cache, native context, unit conversion, tight-fit boundary and legacy schema checks passed.');
