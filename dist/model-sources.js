// Curated publisher sources for models that commonly appear in recommendations.
// These records verify identity/publisher destination and selected model-card facts,
// not our performance or task-fit estimates.
export const MODEL_SOURCES = Object.freeze({
  'Qwen3 0.6B': { publisher: 'Qwen', repo: 'Qwen/Qwen3-0.6B' },
  'Qwen3 1.7B': { publisher: 'Qwen', repo: 'Qwen/Qwen3-1.7B' },
  'Qwen3 4B': { publisher: 'Qwen', repo: 'Qwen/Qwen3-4B' },
  'Qwen3 8B': { publisher: 'Qwen', repo: 'Qwen/Qwen3-8B' },
  'Qwen3 14B': { publisher: 'Qwen', repo: 'Qwen/Qwen3-14B' },
  'Qwen3 32B': { publisher: 'Qwen', repo: 'Qwen/Qwen3-32B' },
  'Qwen2.5-Coder 7B': { publisher: 'Qwen', repo: 'Qwen/Qwen2.5-Coder-7B-Instruct', license: 'Apache-2.0' },
  'Qwen2.5-Coder 14B': { publisher: 'Qwen', repo: 'Qwen/Qwen2.5-Coder-14B-Instruct', license: 'Apache-2.0' },
  'Qwen2.5-Coder 32B': { publisher: 'Qwen', repo: 'Qwen/Qwen2.5-Coder-32B-Instruct', license: 'Apache-2.0' },
  'Qwen3.5 9B': { publisher: 'Qwen', repo: 'Qwen/Qwen3.5-9B', license: 'Apache-2.0', multimodal: true },
  'Qwen3-Coder 30B-A3B Instruct': { publisher: 'Qwen', repo: 'Qwen/Qwen3-Coder-30B-A3B-Instruct', license: 'Apache-2.0', architecture: 'MoE', totalParametersB: 30, activeParametersB: 3 },
  'Gemma 3 4B': { publisher: 'Google', repo: 'google/gemma-3-4b-it' },
  'Gemma 3 12B': { publisher: 'Google', repo: 'google/gemma-3-12b-it' },
  'Gemma 3 27B': { publisher: 'Google', repo: 'google/gemma-3-27b-it' },
  'Gemma 4 12B IT': { publisher: 'Google', repo: 'google/gemma-4-12B', license: 'Apache-2.0', multimodal: true },
  'Gemma 4 31B IT': { publisher: 'Google', repo: 'google/gemma-4-31B', license: 'Apache-2.0', multimodal: true },
  'Llama 3.1 8B Instruct': { publisher: 'Meta', repo: 'meta-llama/Llama-3.1-8B-Instruct' },
  'Llama 3.3 70B Instruct': { publisher: 'Meta', repo: 'meta-llama/Llama-3.3-70B-Instruct' },
  'Phi-4-mini-instruct': { publisher: 'Microsoft', repo: 'microsoft/Phi-4-mini-instruct', license: 'MIT' },
  'Phi-4': { publisher: 'Microsoft', repo: 'microsoft/phi-4' },
  'Phi-4-reasoning': { publisher: 'Microsoft', repo: 'microsoft/Phi-4-reasoning', license: 'MIT', architecture: 'dense', totalParametersB: 14, nativeContextK: 32 },
  'Granite 3.3 8B Instruct': { publisher: 'IBM', repo: 'ibm-granite/granite-3.3-8b-instruct', license: 'Apache-2.0' },
  'Mistral Small 3.2 24B Instruct': { publisher: 'Mistral AI', repo: 'mistralai/Mistral-Small-3.2-24B-Instruct-2506', license: 'Apache-2.0' },
  'Mistral Medium 3.5 128B': { publisher: 'Mistral AI', repo: 'mistralai/Mistral-Medium-3.5-128B', license: 'Modified MIT', architecture: 'dense', totalParametersB: 128, nativeContextK: 256, multimodal: true },
  'Devstral 2 123B': { publisher: 'Mistral AI', repo: 'mistralai/Devstral-2-123B-Instruct-2512', architecture: 'dense', totalParametersB: 123, nativeContextK: 256 },
  'DeepSeek-R1-Distill-Qwen-7B': { publisher: 'DeepSeek', repo: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B' },
  'DeepSeek-R1-Distill-Qwen-14B': { publisher: 'DeepSeek', repo: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B' },
  'DeepSeek-R1-Distill-Qwen-32B': { publisher: 'DeepSeek', repo: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B' },
  'DeepSeek-R1-Distill-Llama-70B': { publisher: 'DeepSeek', repo: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B' },
  'DeepSeek-R1-0528-Qwen3-8B': { publisher: 'DeepSeek', repo: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B', license: 'MIT' },
  'DeepSeek-Coder-V2-Lite-Instruct': { publisher: 'DeepSeek', repo: 'deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct', license: 'DeepSeek License', architecture: 'MoE', totalParametersB: 16, activeParametersB: 2.4 },
  'gpt-oss-20b': { publisher: 'OpenAI', repo: 'openai/gpt-oss-20b', license: 'Apache-2.0', architecture: 'MoE', totalParametersB: 21, activeParametersB: 3.6 },
  'GLM-4.5-Air': { publisher: 'Z.ai', repo: 'zai-org/GLM-4.5-Air', license: 'MIT', architecture: 'MoE', totalParametersB: 106, activeParametersB: 12 },
  'LFM2.5 8B-A1B': { publisher: 'Liquid AI', repo: 'LiquidAI/LFM2.5-8B-A1B', architecture: 'MoE', totalParametersB: 8.3, activeParametersB: 1.5, nativeContextK: 128 },
  'EXAONE 4.0 32B': { publisher: 'LG AI Research', repo: 'LGAI-EXAONE/EXAONE-4.0-32B', license: 'EXAONE' }
});

export const MODEL_SOURCES_VERIFIED_AT = '2026-09-28';

export function modelSource(name) {
  const source = MODEL_SOURCES[name];
  return source ? { ...source, verifiedAt: MODEL_SOURCES_VERIFIED_AT } : null;
}
