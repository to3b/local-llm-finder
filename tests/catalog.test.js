import assert from 'node:assert/strict';
import '../dist/catalog-extra.js';
import { GPUs, MODELS } from '../dist/data.js';

assert.ok(GPUs.length >= 135, `expected broad GPU coverage, got ${GPUs.length}`);
assert.ok(MODELS.length >= 130, `expected broad model coverage, got ${MODELS.length}`);
assert.equal(new Set(GPUs.map(gpu => gpu.id)).size, GPUs.length);
assert.equal(new Set(GPUs.map(gpu => gpu.name.toLowerCase())).size, GPUs.length);
assert.equal(new Set(MODELS.map(model => model.id)).size, MODELS.length);
assert.equal(new Set(MODELS.map(model => model.name.toLowerCase())).size, MODELS.length);

for (const name of [
  'NVIDIA GeForce RTX 5070',
  'AMD Radeon RX 9070 XT',
  'Intel Arc Pro B60',
  'NVIDIA A100 80GB PCIe',
  'AMD Instinct MI300X'
]) assert.ok(GPUs.some(gpu => gpu.name === name), `missing GPU: ${name}`);

for (const name of [
  'gpt-oss-20b',
  'Qwen3-Coder 30B-A3B Instruct',
  'GLM-4.5-Air',
  'Llama 4 Scout 17B-16E Instruct',
  'Gemma 3n E4B IT',
  'LFM2.5 8B-A1B'
]) assert.ok(MODELS.some(model => model.name === name), `missing model: ${name}`);

const moe = MODELS.find(model => model.name === 'gpt-oss-20b');
assert.ok(moe?.activeParametersB > 0);
assert.ok(moe.quantizations.every(quant => quant.speedWeightsGB > 0));

console.log(`Catalogue coverage passed: ${GPUs.length} GPUs and ${MODELS.length} local model profiles.`);
