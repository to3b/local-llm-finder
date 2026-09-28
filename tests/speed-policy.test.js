import assert from 'node:assert/strict';
import { GPUs } from '../dist/data.js';
import { recommend } from '../dist/recommend.js';

const card = GPUs.find(gpu => gpu.name.includes('RTX 4090'));
assert.ok(card, 'RTX 4090 profile should exist');

const run = (preference, minSpeed) => recommend({
  hardware: { mode: 'gpu', vramGB: card.vramGB, ramGB: 64, bandwidthGBs: card.bandwidthGBs, speedKnown: true },
  useCases: ['coding'], primaryUse: 'coding', preference, minSpeed,
  contextK: 8, quantization: 'auto', maxWeightsGB: null, family: null
});

const noFloor = run(3, 1);
assert.ok(noFloor.matches.length > 0);
assert.equal(noFloor.slower.length, 0, 'No explicit speed floor should not create a slower-model bucket');

const floor = run(3, 50);
assert.ok(floor.slower.length > 0, 'An explicit speed floor should move slower fits into the slower bucket');
assert.ok(floor.matches.every(item => item.speedLow >= 50));

const fastest = run(1, 1);
const strongest = run(5, 1);
assert.ok(fastest.matches.length > 0 && strongest.matches.length > 0);
assert.ok(fastest.matches[0].speedLow >= strongest.matches[0].speedLow, 'Speed-first mode should still value throughput when no hard floor is set');

console.log('Optional speed-floor policy passed.');
