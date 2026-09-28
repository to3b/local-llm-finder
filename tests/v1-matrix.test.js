import assert from 'node:assert/strict';
import '../dist/catalog-extra.js';
import { GPUs } from '../dist/data.js';
import { recommend, USE_CASES } from '../dist/recommend.js';

const gpuIds = [
  'rtx-4060',
  'rtx-3060',
  'rx-7800-xt',
  'rtx-4090',
  'rtx-a6000',
  'a100-80',
  'arc-b580'
];
const preferences = [1, 3, 5];
const tasks = Object.keys(USE_CASES);
let scenarios = 0;

function check(result, label) {
  assert.ok(result.catalog.length > 0, `${label}: should have at least one fitting model`);
  assert.ok(result.matches.length > 0, `${label}: should have at least one recommended match`);
  assert.ok(result.matches.length <= 5, `${label}: shortlist should stay compact`);
  for (const item of result.matches) {
    assert.equal(item.fits, true, `${label}: recommendation must fit`);
    assert.ok(item.model.contextK >= 8, `${label}: recommendation must support requested context`);
  }
  for (let i = 1; i < result.matches.length; i++) {
    assert.ok(result.matches[i - 1].rank >= result.matches[i].rank, `${label}: recommendations must be rank sorted`);
  }
}

for (const id of gpuIds) {
  const gpu = GPUs.find(item => item.id === id);
  assert.ok(gpu, `QA GPU missing: ${id}`);
  for (const primaryUse of tasks) {
    for (const preference of preferences) {
      const label = `${gpu.name} / ${primaryUse} / preference ${preference}`;
      const result = recommend({
        hardware: {
          mode: 'gpu',
          vramGB: gpu.vramGB,
          ramGB: Math.max(32, gpu.vramGB * 2),
          bandwidthGBs: gpu.bandwidthGBs,
          speedKnown: true
        },
        useCases: [primaryUse],
        primaryUse,
        preference,
        minSpeed: 10,
        contextK: 8,
        quantization: 'auto',
        maxWeightsGB: null,
        family: null
      });
      check(result, label);
      assert.ok(result.matches.every(item => item.meetsSpeed !== false), `${label}: shortlist must respect speed floor`);
      scenarios++;
    }
  }
}

for (const ramGB of [16, 64, 192, 512]) {
  for (const primaryUse of tasks) {
    for (const preference of preferences) {
      const vramGB = Math.max(2, Math.floor(ramGB * .8 - 1));
      const label = `Mac ${ramGB} GB / ${primaryUse} / preference ${preference}`;
      const result = recommend({
        hardware: { mode: 'mac', vramGB, ramGB, speedKnown: false },
        useCases: [primaryUse],
        primaryUse,
        preference,
        minSpeed: 10,
        contextK: 8,
        quantization: 'auto',
        maxWeightsGB: null,
        family: null
      });
      check(result, label);
      assert.ok(result.matches.every(item => item.meetsSpeed === null), `${label}: Mac speed must remain unknown without chip data`);
      scenarios++;
    }
  }
}

console.log(`V1 QA matrix passed across ${scenarios} hardware/workload/preference scenarios.`);
