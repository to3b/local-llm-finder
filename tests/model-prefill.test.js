import assert from 'node:assert/strict';
import {modelPrefill} from '../dist/model-prefill.js';
const models=[{id:'model-7',name:'Qwen3 8B'}];
assert.deepEqual(modelPrefill('#d=gpu&model=model-7&j=improve&q=Q4_K_M',models),{model:models[0],quant:'Q4_K_M'});
assert.equal(modelPrefill('#d=mac&m=32',models),null,'Mac memory must not be interpreted as a model ID');
assert.equal(modelPrefill('#model=missing',models),null,'Unknown IDs never prefill another model');
assert.equal(modelPrefill('#model=model-7&q=invalid',models).quant,'auto');
assert.equal(modelPrefill('#model=model-7&q=Q4_K_M&cq=Q5_K_M',models).quant,'Q5_K_M');
console.log('Model prefill: IDs, settings and memory-parameter isolation verified.');
