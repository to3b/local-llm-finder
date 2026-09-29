import { modelSource } from './model-sources.js';

// Verified publisher repositories get direct links. Everything else falls back
// to Hugging Face search so we never guess which community upload is canonical.
export function huggingFaceModelLink(model) {
  const source = modelSource(model?.name);
  if (source) return {
    url: `https://huggingface.co/${source.repo}`,
    label: `${source.publisher} model card`,
    direct: true,
    ...source
  };
  const name = model?.name || '';
  return {
    url: `https://huggingface.co/models?search=${encodeURIComponent(name)}`,
    label: 'Search on Hugging Face',
    direct: false,
    verifiedAt: null
  };
}

export function huggingFaceAnchor(model, className = 'model-external-link') {
  const link = huggingFaceModelLink(model);
  const title = link.direct ? `Publisher repository verified ${link.verifiedAt}` : 'Search Hugging Face for this model';
  return `<a class="${className}" href="${link.url}" target="_blank" rel="noopener noreferrer" title="${title}">${link.label} ↗</a>`;
}
