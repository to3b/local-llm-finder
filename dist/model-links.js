// Curated Hugging Face repositories are direct links. Everything else falls back
// to Hugging Face search so we do not pretend an unverified community repo is official.
const DIRECT_REPOS = Object.freeze({
  'Qwen3 0.6B': 'Qwen/Qwen3-0.6B',
  'Qwen3 8B': 'Qwen/Qwen3-8B',
  'Qwen3 14B': 'Qwen/Qwen3-14B',
  'Gemma 3 12B': 'google/gemma-3-12b-it',
  'Llama 3.3 70B Instruct': 'meta-llama/Llama-3.3-70B-Instruct',
  'Phi-4-mini-instruct': 'microsoft/Phi-4-mini-instruct'
});

export function huggingFaceModelLink(model) {
  const repo = DIRECT_REPOS[model?.name];
  if (repo) return {
    url: `https://huggingface.co/${repo}`,
    label: 'View official model on Hugging Face',
    direct: true
  };
  const name = model?.name || '';
  return {
    url: `https://huggingface.co/models?search=${encodeURIComponent(name)}`,
    label: 'Search this model on Hugging Face',
    direct: false
  };
}

export function huggingFaceAnchor(model, className = 'model-external-link') {
  const link = huggingFaceModelLink(model);
  return `<a class="${className}" href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label} ↗</a>`;
}
