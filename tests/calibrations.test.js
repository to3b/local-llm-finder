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

const llama = MODELS.find(model => model.name === 'Llama 3.1 8B Instruct');
assert.ok(llama, 'Llama 3.1 8B Instruct should exist');
const llamaQ4 = llama.quantizations.find(quant => quant.name === 'Q4_K_M');
const llamaQ5 = llama.quantizations.find(quant => quant.name === 'Q5_K_M');
assert.ok(llamaQ4 && llamaQ5);
assert.equal(llamaQ4.weightsGB, 4.92);
assert.equal(llamaQ5.weightsGB, 5.73);
assert.equal(llama.calibration?.quantWeightsGB?.Q5_K_M, 5.73);
assert.ok(llama.calibration?.source?.startsWith('https://'));
const llama3060Q5 = estimate(llama, llamaQ5, { mode: 'gpu', vramGB: 12, ramGB: 32, bandwidthGBs: 360, speedKnown: true }, 8);
assert.ok(llama3060Q5.fits, 'Llama 3.1 8B Q5_K_M should fit a 12 GB GPU at 8K context under the planning estimate');
assert.ok(llama3060Q5.requiredGB + llama3060Q5.reserveGB < 8, 'Llama 3.1 8B Q5_K_M should retain substantial headroom on a 12 GB GPU at 8K context');

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

console.log('Sourced model calibrations passed.');
