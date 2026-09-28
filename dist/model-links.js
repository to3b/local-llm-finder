// Publisher Hugging Face repositories verified for the most common recommendations.
// Everything else falls back to Hugging Face search rather than guessing a community repo.
const VERIFIED_AT = '2026-09-28';
const DIRECT_REPOS = Object.freeze({
  'Qwen3 0.6B': 'Qwen/Qwen3-0.6B',
  'Qwen3 1.7B': 'Qwen/Qwen3-1.7B',
  'Qwen3 4B': 'Qwen/Qwen3-4B',
  'Qwen3 8B': 'Qwen/Qwen3-8B',
  'Qwen3 14B': 'Qwen/Qwen3-14B',
  'Qwen3 32B': 'Qwen/Qwen3-32B',
  'Qwen2.5-Coder 7B': 'Qwen/Qwen2.5-Coder-7B-Instruct',
  'Qwen2.5-Coder 14B': 'Qwen/Qwen2.5-Coder-14B-Instruct',
  'Qwen2.5-Coder 32B': 'Qwen/Qwen2.5-Coder-32B-Instruct',
  'Gemma 3 4B': 'google/gemma-3-4b-it',
  'Gemma 3 12B': 'google/gemma-3-12b-it',
  'Gemma 3 27B': 'google/gemma-3-27b-it',
  'Llama 3.1 8B Instruct': 'meta-llama/Llama-3.1-8B-Instruct',
  'Llama 3.3 70B Instruct': 'meta-llama/Llama-3.3-70B-Instruct',
  'Phi-4-mini-instruct': 'microsoft/Phi-4-mini-instruct',
  'Phi-4': 'microsoft/phi-4',
  'Phi-4-reasoning': 'microsoft/Phi-4-reasoning',
  'Granite 3.3 8B Instruct': 'ibm-granite/granite-3.3-8b-instruct',
  'Mistral Small 3.2 24B Instruct': 'mistralai/Mistral-Small-3.2-24B-Instruct-2506',
  'DeepSeek-R1-Distill-Qwen-7B': 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
  'DeepSeek-R1-Distill-Qwen-14B': 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B',
  'DeepSeek-R1-Distill-Qwen-32B': 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
  'DeepSeek-R1-Distill-Llama-70B': 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
  'gpt-oss-20b': 'openai/gpt-oss-20b',
  'Qwen3-Coder 30B-A3B Instruct': 'Qwen/Qwen3-Coder-30B-A3B-Instruct',
  'GLM-4.5-Air': 'zai-org/GLM-4.5-Air'
});

export function huggingFaceModelLink(model) {
  const repo = DIRECT_REPOS[model?.name];
  if (repo) return {
    url: `https://huggingface.co/${repo}`,
    label: 'Publisher model card',
    direct: true,
    verifiedAt: VERIFIED_AT
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

function linkElement(name) {
  const link = huggingFaceModelLink({ name });
  const a = document.createElement('a');
  a.className = 'model-external-link';
  a.href = link.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = `${link.label} ↗`;
  if (link.direct) a.title = `Publisher repository verified ${link.verifiedAt}`;
  return a;
}

function addLink(container, name) {
  if (!container || !name || container.querySelector(':scope > .model-links')) return;
  const p = document.createElement('p');
  p.className = 'model-links';
  p.append(linkElement(name));
  container.append(p);
}

function markSpeed(label, value) {
  if (!label || !value) return;
  const text = value.textContent.trim();
  if (/not estimated/i.test(text)) {
    label.textContent = 'Speed estimate';
    value.textContent = 'Needs exact GPU';
    return;
  }
  if (/tok\/s/i.test(text) && !/rough/i.test(text)) {
    label.textContent = 'Speed estimate · rough';
    value.textContent = `${text} · rough`;
  }
}

function enhance(root = document) {
  for (const row of root.querySelectorAll('.model-row')) {
    const name = row.querySelector('.model-title strong')?.textContent.trim();
    addLink(row.querySelector('.model-details'), name);
    markSpeed(row.querySelector('.metric.speed > span'), row.querySelector('.metric.speed > strong'));
    for (const cell of row.querySelectorAll('.detail-grid > div')) {
      const label = cell.querySelector('.detail-label');
      if (label?.textContent.trim() === 'Speed') markSpeed(label, cell.querySelector('strong'));
    }
  }

  for (const card of root.querySelectorAll('.decision-card, .upgrade-milestone')) {
    addLink(card, card.querySelector('h3')?.textContent.trim());
    for (const group of card.querySelectorAll('dl > div')) {
      const label = group.querySelector('dt');
      if (label?.textContent.trim() === 'Speed') markSpeed(label, group.querySelector('dd'));
    }
  }
}

function installBrowserEnhancements() {
  if (!document.getElementById('model-link-styles')) {
    const style = document.createElement('style');
    style.id = 'model-link-styles';
    style.textContent = `
      .model-links { margin: 12px 0 0 !important; }
      .model-external-link { color: #deded9; font-size: .78rem; line-height: 1.4; text-decoration: underline; text-decoration-color: var(--quiet); text-underline-offset: 3px; }
      .model-external-link:hover { text-decoration-color: currentColor; }
    `;
    document.head.append(style);
  }
  enhance();
  const observer = new MutationObserver(() => enhance());
  observer.observe(document.body, { childList: true, subtree: true });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  queueMicrotask(installBrowserEnhancements);
}
