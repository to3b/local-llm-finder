import assert from 'node:assert/strict';
import { recommend } from '../dist/recommend.js';

const run = ({
  mode = 'gpu', vramGB = 24, ramGB = 64, bandwidthGBs = 1008,
  speedKnown = true, useCases = ['coding'], primaryUse = 'coding',
  preference = 3, minSpeed = 15, contextK = 8
} = {}) => recommend({
  hardware: { mode, vramGB, ramGB, bandwidthGBs, speedKnown },
  useCases, primaryUse, preference, minSpeed, contextK,
  quantization: 'auto', maxWeightsGB: null, family: null
});

// Large Macs do not have a device-specific speed estimate yet. Balanced mode
// must therefore rank by task quality rather than quietly assuming small=faster.
const hugeMacBalanced = run({
  mode: 'mac', vramGB: 408, ramGB: 512, speedKnown: false,
  bandwidthGBs: undefined, preference: 3
});
assert.equal(
  hugeMacBalanced.matches[0].quality,
  Math.max(...hugeMacBalanced.catalog.map(item => item.quality))
);
assert.ok(hugeMacBalanced.matches[0].model.parametersB >= 24);

// Speed-first is still allowed to prefer a smaller model when exact speed is unknown.
const hugeMacFast = run({
  mode: 'mac', vramGB: 408, ramGB: 512, speedKnown: false,
  bandwidthGBs: undefined, preference: 1
});
assert.ok(hugeMacFast.matches[0].model.parametersB < hugeMacBalanced.matches[0].model.parametersB);

// On a known high-end GPU, Balanced should not let a tiny model win solely from
// surplus speed once larger models already clear an interactive speed target.
const balanced4090 = run();
assert.ok(balanced4090.matches[0].quality >= 92);
assert.ok(balanced4090.matches[0].model.parametersB >= 14);

console.log('Ranking regression checks passed for large Macs, speed-first mode and balanced high-end GPUs.');
