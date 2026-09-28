import assert from 'node:assert/strict';
import { MODELS } from '../dist/data.js';
import { recommend } from '../dist/recommend.js';

const run = ({ vramGB = 12, bandwidthGBs = 504, ramGB = 32, useCases = ['coding'], primaryUse = null, preference = 3, minSpeed = 15, contextK = 8, speedKnown = true, mode = 'gpu', quantization = 'auto', maxWeightsGB = null, family = null } = {}) =>
  recommend({ hardware: { vramGB, bandwidthGBs, ramGB, speedKnown, mode }, useCases, primaryUse, preference, minSpeed, contextK, quantization, maxWeightsGB, family });

assert.ok(MODELS.length >= 90);
assert.equal(new Set(MODELS.map(model => model.id)).size, MODELS.length);
assert.equal(new Set(MODELS.map(model => model.name)).size, MODELS.length);
for (const model of MODELS) {
  assert.ok(model.parametersB > 0 && model.contextK >= 4 && model.kvGBPer1K > 0);
  assert.ok(Object.values(model.quality).every(score => score >= 0 && score <= 100));
  assert.ok(model.quantizations.every(quant => quant.weightsGB > 0));
  assert.equal(model.provenance, 'prototype-sample');
}

const small = run({ vramGB: 8, bandwidthGBs: 448, ramGB: 16, preference: 1 });
assert.ok(small.matches.length > 0);
assert.ok(small.matches.every(x => x.requiredGB <= 8 && x.hostRAMGB <= 16 && x.speedLow >= 15));
assert.ok(small.catalog.length > small.matches.length);
assert.equal(small.catalog.length + small.excluded.memory + small.excluded.context, MODELS.length);
assert.ok(small.catalog.every(x => x.fits && x.model.contextK >= 8));

const speed = run({ preference: 1 });
const quality = run({ preference: 5 });
assert.notEqual(speed.matches[0].model.name, quality.matches[0].model.name);
assert.ok(speed.matches[0].speedLow > quality.matches[0].speedLow);
assert.ok(quality.matches[0].quality > speed.matches[0].quality);
assert.ok(quality.matches[0].model.name.includes('Coder'));

const reasoning = run({ vramGB: 24, bandwidthGBs: 1008, ramGB: 64, useCases: ['reasoning'], preference: 5, contextK: 16 });
assert.ok(reasoning.matches[0].quality >= 90);
assert.ok(reasoning.matches.some(x => x.model.name.includes('DeepSeek')));
assert.ok(reasoning.slower.every(x => x.fits && !x.meetsSpeed));

const long = run({ vramGB: 32, bandwidthGBs: 1792, ramGB: 64, useCases: ['longContext'], preference: 5, contextK: 64 });
assert.ok(long.excluded.context > 0);
assert.ok(long.matches.every(x => x.model.contextK >= 64));

const tight = run({ vramGB: 8, bandwidthGBs: 448, ramGB: 16, useCases: ['longContext'], contextK: 64 });
assert.ok(tight.catalog.length < long.catalog.length);
assert.ok(tight.excluded.memory > long.excluded.memory);

const tooFast = run({ minSpeed: 500 });
assert.ok(tooFast.matches.every(x => x.speedLow >= 500));
assert.ok(tooFast.slower.length > 0);

const combined = run({ useCases: ['coding', 'reasoning'], preference: 5 });
assert.ok(combined.matches.length > 0);
assert.notEqual(combined.matches[0].quality, quality.matches[0].quality);

const macLike = run({ vramGB: 11, bandwidthGBs: 180, ramGB: 16, useCases: ['chat'] });
const unknown = run({ mode: 'unsure', speedKnown: false, vramGB: 11, bandwidthGBs: 90, ramGB: 16, useCases: ['chat'] });
assert.ok(macLike.matches.every(x => x.requiredGB <= 11));
assert.ok(unknown.matches.length > 0);
assert.ok(unknown.matches.every(x => x.meetsSpeed === null && x.requiredGB <= 11));
assert.equal(unknown.slower.length, 0);

for (const ramGB of [8, 16, 32]) {
  const vramGB = Math.max(2, Math.floor(ramGB * .8 - 1));
  const result = run({ mode: 'unsure', speedKnown: false, vramGB, ramGB, bandwidthGBs: 90, useCases: ['chat'] });
  assert.ok(result.matches.length > 0, `${ramGB} GB unsure path should offer starting points`);
}

assert.throws(() => run({ vramGB: 0 }), /valid hardware/);
assert.throws(() => run({ useCases: [] }), /valid hardware/);
assert.throws(() => run({ preference: 3.5 }), /valid hardware/);

const capacityOnly = run({ vramGB: 16, speedKnown: false, useCases: ['chat'] });
assert.ok(capacityOnly.matches.length > 0);
assert.ok(capacityOnly.matches.every(x => x.meetsSpeed === null));

const slow16 = run({ vramGB: 16, bandwidthGBs: 288, useCases: ['coding'] });
const fast16 = run({ vramGB: 16, bandwidthGBs: 672, useCases: ['coding'] });
assert.equal(slow16.excluded.memory, fast16.excluded.memory);
assert.ok(fast16.matches.some(x => x.model.name === 'Qwen2.5-Coder 14B'));
assert.ok(slow16.slower.some(x => x.model.name === 'Qwen2.5-Coder 14B'));

const tiny = run({ vramGB: 2, ramGB: 4, speedKnown: false, useCases: ['chat'] });
assert.ok(tiny.matches.some(x => x.model.parametersB < 2));
assert.ok(tiny.matches.every(x => x.requiredGB + x.reserveGB <= 2));

const workstation = run({ vramGB: 96, ramGB: 128, bandwidthGBs: 1792, preference: 5, minSpeed: 1, useCases: ['reasoning'] });
assert.ok(workstation.matches.some(x => x.model.parametersB >= 70));
const workstationDefaultSpeed = run({ vramGB: 96, ramGB: 128, bandwidthGBs: 1792, preference: 5, useCases: ['reasoning'] });
assert.ok(workstationDefaultSpeed.slower.some(x => x.model.parametersB >= 100));

const largeMac = run({ mode: 'mac', speedKnown: false, vramGB: 152, ramGB: 192, preference: 5, useCases: ['chat'] });
assert.ok(largeMac.matches.some(x => x.model.parametersB >= 70));

const ultraMac = run({ mode: 'mac', speedKnown: false, vramGB: 408, ramGB: 512, preference: 5, useCases: ['chat'] });
assert.ok(ultraMac.catalog.some(x => x.model.parametersB >= 400));
assert.ok(!workstation.catalog.some(x => x.model.parametersB >= 400));

const primaryCoding = run({ vramGB: 24, ramGB: 64, useCases: ['coding', 'reasoning'], primaryUse: 'coding', preference: 5 });
const primaryReasoning = run({ vramGB: 24, ramGB: 64, useCases: ['coding', 'reasoning'], primaryUse: 'reasoning', preference: 5 });
assert.ok(primaryCoding.matches.length > 0 && primaryReasoning.matches.length > 0);
assert.notEqual(primaryCoding.matches[0].model.name, primaryReasoning.matches[0].model.name);

const q5Only = run({ vramGB: 24, ramGB: 64, quantization: 'Q5_K_M', minSpeed: 1 });
assert.ok(q5Only.catalog.length > 0);
assert.ok(q5Only.catalog.every(item => item.quant.name === 'Q5_K_M'));

const capped = run({ vramGB: 24, ramGB: 64, maxWeightsGB: 4, minSpeed: 1 });
assert.ok(capped.catalog.length > 0);
assert.ok(capped.catalog.every(item => item.quant.weightsGB <= 4));
assert.ok(capped.excluded.filters > 0);

const llamaOnly = run({ vramGB: 96, ramGB: 128, family: 'Llama', minSpeed: 1 });
assert.ok(llamaOnly.catalog.length > 0);
assert.ok(llamaOnly.catalog.every(item => item.model.family === 'Llama'));
assert.ok(llamaOnly.excluded.filters > 0);

assert.throws(() => run({ quantization: 'Q3' }), /valid hardware/);

console.log(`Recommendation scenarios passed across ${MODELS.length} unique model profiles, tiered task weighting, filters, memory, context and speed.`);
