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

console.log('Sourced model calibration passed.');
