import assert from 'node:assert/strict';
import { loadLiveCatalogue, LIVE_DATA_STATE, LIVE_SHEET } from '../dist/live-data.js';

const modelHeader = 'Enabled,Model ID,Model Name,Parameters B,Active Params B,Family,Base Q4 GB,Context K,KV GB / 1K,Chat,Coding,Reasoning,Writing,Long Context';
const gpuHeader = 'Enabled,GPU ID,GPU Name,VRAM GB,Bandwidth GB/s,Architecture';
const csv = [
  [modelHeader, ...Array.from({ length: 130 }, (_, i) => `TRUE,m${i},Model ${i},8,,Test,5,64,0.05,80,81,82,83,84`)].join('\n'),
  [gpuHeader, ...Array.from({ length: 135 }, (_, i) => `TRUE,g${i},GPU ${i},12,400,Test`)].join('\n'),
  'Model Name,Q4_K_M GB,Q5_K_M GB,Q8_0 GB,Active Params B,Chat,Coding,Reasoning,Writing,Long Context\nModel 0,4.8,5.6,,,,99,,,'
];
const gids = [LIVE_SHEET.modelsGid, LIVE_SHEET.gpusGid, LIVE_SHEET.calibrationsGid];
const storage = new Map();
const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
const originalFetch = globalThis.fetch;
const originalWarn = console.warn;
let requests = 0;
let delayMs = 0;
function network() {
  globalThis.fetch = async (url, { signal }) => {
    requests++;
    if (delayMs) await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, delayMs);
      signal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    });
    return { ok: true, text: async () => csv[gids.indexOf(new URL(url).searchParams.get('gid'))] };
  };
}
function fallback() { return { MODELS: [{ id: 'bundled-model' }], GPUs: [{ id: 'bundled-gpu' }] }; }
try {
  globalThis.window = { setTimeout, clearTimeout, localStorage };
  console.warn = () => {};
  network();
  delayMs = 80;
  let data = fallback();
  const coldStart = performance.now();
  assert.equal(await loadLiveCatalogue(data), true);
  const coldMs = performance.now() - coldStart;
  assert.equal(requests, 3);
  assert.equal(data.MODELS.length, 130);
  assert.equal(data.GPUs.length, 135);
  assert.equal(data.MODELS[0].quality.coding, 99);
  const [cacheKey, validCache] = [...storage][0];

  // A fresh cache must remain usable even when the network never settles.
  globalThis.fetch = () => { requests++; return new Promise(() => {}); };
  data = fallback();
  const warmStart = performance.now();
  assert.equal(await loadLiveCatalogue(data), true);
  const warmMs = performance.now() - warmStart;
  assert.equal(requests, 3, 'Repeat visit should make zero network requests');
  assert.equal(data.MODELS[0].quantizations[0].weightsGB, 4.8);
  assert.match(LIVE_DATA_STATE.reason, /recent cache/);
  console.log(`Catalogue loading: simulated cold visit ${coldMs.toFixed(1)}ms; cached visit ${warmMs.toFixed(1)}ms; 3 requests reduced to 0.`);

  delayMs = 0;
  network();
  const parsed = JSON.parse(validCache);
  for (const invalid of [
    '{broken',
    JSON.stringify({ ...parsed, savedAt: Date.now() - 300001 }),
    JSON.stringify({ ...parsed, savedAt: Date.now() + 60000 }),
    JSON.stringify({ ...parsed, source: 'different workbook' }),
    JSON.stringify({ ...parsed, csv: [modelHeader + '\nTRUE,bad,Too few,8,,Test,5,64,.05,80,80,80,80,80', csv[1], csv[2]] }),
    JSON.stringify({ ...parsed, csv: [csv[0], csv[1], csv[2].replace('Model 0', 'Unknown model')] })
  ]) {
    storage.set(cacheKey, invalid);
    const before = requests;
    assert.equal(await loadLiveCatalogue(fallback()), true);
    assert.equal(requests - before, 3, 'Invalid or expired caches must fetch and validate all tabs');
  }

  // Storage being blocked must neither reject valid live data nor lose fallback.
  Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
  assert.equal(await loadLiveCatalogue(fallback()), true);
  Object.defineProperty(window, 'localStorage', { configurable: true, value: localStorage });
  storage.clear();
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  data = fallback();
  const beforeFailure = structuredClone(data);
  assert.equal(await loadLiveCatalogue(data), false);
  assert.deepEqual(data, beforeFailure);
  assert.equal(storage.size, 0);

  // A late/invalid required tab cannot partially replace either catalogue.
  network();
  const validCalibrations = csv[2];
  csv[2] = validCalibrations.replace('Model 0', 'Unknown model');
  data = fallback();
  assert.equal(await loadLiveCatalogue(data), false);
  assert.deepEqual(data, beforeFailure);
  assert.equal(storage.size, 0);
  csv[2] = validCalibrations;

  delayMs = 100;
  data = fallback();
  assert.equal(await loadLiveCatalogue({ ...data, timeoutMs: 5 }), false);
  assert.deepEqual(data, beforeFailure);
  assert.match(LIVE_DATA_STATE.reason, /timed out/);
  assert.equal(storage.size, 0);
  console.log('Catalogue cache, expiry, validation, storage failures and transactional fallback passed.');
} finally {
  delete globalThis.window;
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
}
