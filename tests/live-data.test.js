import assert from 'node:assert/strict';
import {
  parseCsv,
  buildModelsFromCsv,
  buildGpusFromCsv,
  applySheetCalibrations,
  validateCatalogue,
  LIVE_SHEET
} from '../dist/live-data.js';

const parsed = parseCsv('A,B\n"x,y","say ""hi"""\n');
assert.deepEqual(parsed, [['A', 'B'], ['x,y', 'say "hi"']]);

const modelsCsv = `Enabled,Model ID,Model Name,Parameters B,Active Params B,Family,Base Q4 GB,Context K,KV GB / 1K,Chat,Coding,Reasoning,Writing,Long Context,License Note,Provenance,Status,Notes
TRUE,test-model,Test Model,8,2,Test,5,64,0.05,80,81,82,83,84,,live-sheet,OK,
FALSE,disabled,Disabled Model,7,,Test,4,32,0.04,70,70,70,70,70,,,OK,`;
const models = buildModelsFromCsv(modelsCsv);
assert.equal(models.length, 1);
assert.equal(models[0].id, 'test-model');
assert.equal(models[0].quantizations[0].weightsGB, 5);
assert.equal(models[0].quantizations[1].weightsGB, 6.1);
assert.equal(models[0].quantizations[0].speedWeightsGB, 1.3);

const gpusCsv = `Enabled,GPU ID,GPU Name,VRAM GB,Bandwidth GB/s,Architecture,Vendor,Series,Status,Notes
TRUE,test-gpu,Test GPU,12,400,TestArch,TestVendor,TestSeries,OK,
FALSE,disabled-gpu,Disabled GPU,8,200,TestArch,TestVendor,,OK,`;
const gpus = buildGpusFromCsv(gpusCsv);
assert.equal(gpus.length, 1);
assert.equal(gpus[0].bandwidthGBs, 400);

const calibrationsCsv = `Model Name,Q4_K_M GB,Q5_K_M GB,Q8_0 GB,Active Params B,Chat,Coding,Reasoning,Writing,Long Context,Verified At,Source URL,Note,Status
Test Model,4.8,5.6,,1.5,,99,,,,2026-09-29,https://example.com/source,Test calibration,OK`;
applySheetCalibrations(models, calibrationsCsv);
assert.equal(models[0].quantizations[0].weightsGB, 4.8);
assert.equal(models[0].quantizations[1].weightsGB, 5.6);
assert.equal(models[0].activeParametersB, 1.5);
assert.equal(models[0].quality.coding, 99);
assert.equal(models[0].calibration.verifiedAt, '2026-09-29');

assert.equal(validateCatalogue(models, gpus, { minModels: 1, minGpus: 1 }), true);
assert.throws(() => validateCatalogue(models, gpus), /need at least 130/);
const duplicateModelsCsv = `${modelsCsv}\nTRUE,test-model,Another Model,8,,Test,5,64,0.05,80,80,80,80,80,,,OK,`;
assert.throws(() => buildModelsFromCsv(duplicateModelsCsv), /Duplicate Model ID/);
assert.match(LIVE_SHEET.base, /docs\.google\.com\/spreadsheets\/d\/e\//);
assert.equal(LIVE_SHEET.modelsGid, '624018495');
assert.equal(LIVE_SHEET.gpusGid, '1333766306');
assert.equal(LIVE_SHEET.calibrationsGid, '500465526');

console.log('Live-sheet data contract passed: CSV parsing, row validation, calibration overrides and fallback thresholds are enforced.');
