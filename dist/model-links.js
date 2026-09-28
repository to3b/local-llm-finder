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
