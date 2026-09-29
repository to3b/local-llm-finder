import assert from 'node:assert/strict';
import { MODELS } from '../dist/data.js';
import { estimate } from '../dist/recommend.js';
import { MODEL_CALIBRATIONS } from '../dist/model-calibrations.js';
import '../dist/catalog-extra.js';

const medium = MODELS.find(model => model.name === 'Mistral Medium 3.5 128B');
const devstral = MODELS.find(model => model.name === 'Devstral 2 123B');
assert.ok(medium && devstral);
assert.equal(medium.quality.coding, MODEL_CALIBRATIONS[medium.name].quality.coding);
assert.ok(medium.quality.coding >= devstral.quality.coding, 'Sourced calibration should not rank Devstral 2 above Medium 3.5 for coding');
assert.ok(medium.calibration?.source?.startsWith('https://'));

const quantCalibrations = {
  'Llama 3.1 8B Instruct': [4.92, 5.73],
  'Qwen3 8B': [5.03, 5.85],
  'Qwen3 14B': [9.00, 10.51],
  'Qwen2.5 7B Instruct': [4.68, 5.44],
  'Qwen2.5 14B Instruct': [8.99, 10.51],
  'Qwen2.5-Coder 7B': [4.68, 5.44],
  'Qwen2.5-Coder 14B': [8.99, 10.51],
  'DeepSeek-R1-Distill-Qwen-7B': [4.68, 5.44],
  'DeepSeek-R1-Distill-Qwen-14B': [8.99, 10.51],
  'Phi-3.5-mini-instruct': [2.39, 2.82],
  'Mistral NeMo 12B': [7.48, 8.73]
};

for (const [name, [q4GB, q5GB]] of Object.entries(quantCalibrations)) {
  const model = MODELS.find(item => item.name === name);
  assert.ok(model, `${name} should exist`);
  const q4 = model.quantizations.find(quant => quant.name === 'Q4_K_M');
  const q5 = model.quantizations.find(quant => quant.name === 'Q5_K_M');
  assert.ok(q4 && q5, `${name} should expose Q4_K_M and Q5_K_M`);
  assert.equal(q4.weightsGB, q4GB, `${name} Q4_K_M should use sourced GGUF size`);
  assert.equal(q5.weightsGB, q5GB, `${name} Q5_K_M should use sourced GGUF size`);
  assert.equal(model.calibration?.quantWeightsGB?.Q5_K_M, q5GB);
  assert.ok(model.calibration?.source?.startsWith('https://'));
}

const llama = MODELS.find(model => model.name === 'Llama 3.1 8B Instruct');
const llamaQ5 = llama.quantizations.find(quant => quant.name === 'Q5_K_M');
const llama3060Q5 = estimate(llama, llamaQ5, { mode: 'gpu', vramGB: 12, ramGB: 32, bandwidthGBs: 360, speedKnown: true }, 8);
assert.ok(llama3060Q5.fits, 'Llama 3.1 8B Q5_K_M should fit a 12 GB GPU at 8K context under the planning estimate');
assert.ok(llama3060Q5.requiredGB + llama3060Q5.reserveGB < 8, 'Llama 3.1 8B Q5_K_M should retain substantial headroom on a 12 GB GPU at 8K context');

for (const name of ['Qwen3 8B', 'Qwen2.5-Coder 7B', 'DeepSeek-R1-Distill-Qwen-7B', 'Phi-3.5-mini-instruct']) {
  const model = MODELS.find(item => item.name === name);
  const q5 = model.quantizations.find(quant => quant.name === 'Q5_K_M');
  const estimate12 = estimate(model, q5, { mode: 'gpu', vramGB: 12, ramGB: 32, bandwidthGBs: 360, speedKnown: true }, 8);
  assert.ok(estimate12.fits, `${name} Q5_K_M should fit a 12 GB GPU at 8K context`);
}

for (const [name, expectedActive] of [['LFM2.5 8B-A1B', 1.5], ['LFM2 24B-A2B', 2.3]]) {
  const model = MODELS.find(item => item.name === name);
  assert.ok(model, `${name} should exist`);
  assert.equal(model.activeParametersB, expectedActive);
  assert.equal(model.calibration?.activeParametersB, expectedActive);
  assert.ok(model.calibration?.source?.startsWith('https://'));
  for (const quant of model.quantizations) {
    assert.ok(Number.isFinite(quant.speedWeightsGB) && quant.speedWeightsGB > 0, `${name} ${quant.name} should have a calibrated speed-weight hint`);
  }
}

console.log(`Sourced model calibrations passed for ${Object.keys(quantCalibrations).length} common quant profiles plus capability and MoE overrides.`);
