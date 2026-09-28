import assert from 'node:assert/strict';
import { MODELS } from '../dist/data.js';
import { MODEL_CALIBRATIONS } from '../dist/model-calibrations.js';
import '../dist/catalog-extra.js';

const medium = MODELS.find(model => model.name === 'Mistral Medium 3.5 128B');
const devstral = MODELS.find(model => model.name === 'Devstral 2 123B');
assert.ok(medium && devstral);
assert.equal(medium.quality.coding, MODEL_CALIBRATIONS[medium.name].quality.coding);
assert.ok(medium.quality.coding >= devstral.quality.coding, 'Sourced calibration should not rank Devstral 2 above Medium 3.5 for coding');
assert.ok(medium.calibration?.source?.startsWith('https://'));

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
