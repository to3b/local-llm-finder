import assert from 'node:assert/strict';
import { huggingFaceModelLink, huggingFaceAnchor } from '../dist/model-links.js';

for (const [name, suffix] of [
  ['Qwen3 32B', 'Qwen/Qwen3-32B'],
  ['Qwen2.5-Coder 32B', 'Qwen/Qwen2.5-Coder-32B-Instruct'],
  ['Gemma 3 27B', 'google/gemma-3-27b-it'],
  ['Mistral Small 3.2 24B Instruct', 'mistralai/Mistral-Small-3.2-24B-Instruct-2506'],
  ['gpt-oss-20b', 'openai/gpt-oss-20b'],
  ['Qwen3-Coder 30B-A3B Instruct', 'Qwen/Qwen3-Coder-30B-A3B-Instruct'],
  ['GLM-4.5-Air', 'zai-org/GLM-4.5-Air']
]) {
  const link = huggingFaceModelLink({ name });
  assert.equal(link.direct, true, `${name} should have a verified publisher link`);
  assert.ok(link.url.endsWith(suffix), `${name} publisher URL should end with ${suffix}`);
  assert.equal(link.verifiedAt, '2026-09-28');
}

const fallback = huggingFaceModelLink({ name: 'Unknown Community Model' });
assert.equal(fallback.direct, false);
assert.match(fallback.url, /huggingface\.co\/models\?search=/);

console.log('Model-link provenance passed.');

const publisherAnchor = huggingFaceAnchor({ name: 'Qwen3 32B' });
assert.match(publisherAnchor, /href="https:\/\/huggingface\.co\/Qwen\/Qwen3-32B"/);
assert.match(publisherAnchor, /rel="noopener noreferrer"/);
assert.match(publisherAnchor, /Publisher repository verified 2026-09-28/);
const searchAnchor = huggingFaceAnchor({ name: 'Unknown "model" & family' });
assert.match(searchAnchor, /search=Unknown%20%22model%22%20%26%20family/);
assert.match(searchAnchor, /Search on Hugging Face/);
