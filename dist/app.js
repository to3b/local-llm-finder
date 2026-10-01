import { speedAvailability } from './ui-state.js?v=cleanup-1';
import { GPUs, MODELS } from './data.js';
import { recommend } from './recommend.js?v=20260929e';
import { fitLabel, isTopTie } from './presentation.js';
import { huggingFaceAnchor } from './model-links.js?v=20260929e';

const form = document.querySelector('#finder-form');
const findView = document.querySelector('#results');
const results = document.querySelector('#results-content');
const subtitle = document.querySelector('#results-subtitle');
const resultsNote = document.querySelector('#results-note');
const error = document.querySelector('#form-error');
const gpuInput = document.querySelector('#gpu-input');
const gpuVram = document.querySelector('#gpu-vram');
const gpuSearch = document.querySelector('#gpu-search');
const gpuSearchToggle = document.querySelector('#toggle-gpu-search');
const vramInput = document.querySelector('#vram-input');
const priorityInput = document.querySelector('#priority-input');
const priorityOutput = document.querySelector('#priority-output');
const advanced = document.querySelector('#advanced-settings');
const power = document.querySelector('#power-settings');
const shareButton = document.querySelector('#share-setup');
const shareStatus = document.querySelector('#share-status');
const familyInput = document.querySelector('#family-input');
const gpuLabel = gpu => `${gpu.name} — ${gpu.vramGB} GB`;
const fmt = value => Number.isInteger(value) ? String(value) : value.toFixed(1);
const parameterText = value => value < 1 ? `${Math.round(value * 1000)} million` : `${fmt(value)} billion`;
const taskNames = { chat: 'chatting', coding: 'coding', reasoning: 'solving problems', writing: 'creative writing', longContext: 'reading long files' };
const taskShortNames = { chat: 'chat', coding: 'coding', reasoning: 'reasoning', writing: 'writing', longContext: 'long files' };
const preferenceNames = ['Fastest', 'Faster', 'Balanced', 'Stronger', 'Strongest'];
const listFormatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
let touched = false;
let lastMode;
let catalogLimit = 8;
let catalogState = null;
let updateFrame;

const gpuOptions = GPUs.map(gpu => { const option = document.createElement('option'); option.value = gpuLabel(gpu); return option; });
document.querySelector('#gpu-options').replaceChildren(...gpuOptions);

const familyOptions = [...new Set(MODELS.map(model => model.family))]
  .sort((a, b) => a.localeCompare(b))
  .map(family => { const option = document.createElement('option'); option.value = family; option.textContent = family; return option; });
familyInput.append(...familyOptions);

const selectedGPU = () => GPUs.find(item => gpuLabel(item).toLowerCase() === gpuInput.value.trim().toLowerCase());
const primaryTask = () => form.elements.primaryUse.value;
const secondaryTasks = () => [...form.querySelectorAll('input[name="secondaryUse"]:checked')].map(input => input.value);
const tasks = () => [primaryTask(), ...secondaryTasks().filter(key => key !== primaryTask())];
const taskText = keys => listFormatter.format(keys.map(key => taskNames[key]));
const taskShortText = keys => listFormatter.format(keys.map(key => taskShortNames[key]));
const setValueIfValid = (control, value) => {
  if (!control || value == null) return;
  const allowed = control.tagName === 'SELECT' ? [...control.options].some(option => option.value === value) : true;
  if (allowed) control.value = value;
};

function syncSecondaryTasks() {
  const primary = primaryTask();
  for (const input of form.querySelectorAll('input[name="secondaryUse"]')) {
    const same = input.value === primary;
    if (same) input.checked = false;
    input.disabled = same;
    input.closest('label')?.classList.toggle('choice-disabled', same);
  }
}

function applyUrlState() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (!params.size) return;
  const mode = params.get('d');
  const device = [...form.querySelectorAll('input[name="device"]')].find(input => input.value === mode);
  if (device) device.checked = true;

  if (form.elements.device.value === 'gpu') {
    const gpu = GPUs.find(item => item.id === params.get('g'));
    if (gpu) {
      gpuInput.value = gpuLabel(gpu);
      gpuVram.value = String(gpu.vramGB);
      gpuSearch.hidden = false;
      gpuSearchToggle.setAttribute('aria-expanded', 'true');
      gpuSearchToggle.textContent = 'Hide card search';
    } else {
      setValueIfValid(gpuVram, params.get('v'));
    }
  } else if (form.elements.device.value === 'mac') {
    setValueIfValid(form.elements.macMemory, params.get('m'));
  } else {
    const memoryValue = params.get('m');
    const memory = [...form.querySelectorAll('input[name="unsureMemory"]')].find(input => input.value === memoryValue);
    if (memory) memory.checked = true;
  }

  const oldTasks = (params.get('u') || '').split(',').filter(key => taskNames[key]);
  const requestedPrimary = params.get('t') && taskNames[params.get('t')] ? params.get('t') : oldTasks[0];
  if (requestedPrimary) {
    const primary = [...form.querySelectorAll('input[name="primaryUse"]')].find(input => input.value === requestedPrimary);
    if (primary) primary.checked = true;
  }
  const requestedSecondary = params.has('t') ? oldTasks : oldTasks.slice(1);
  for (const input of form.querySelectorAll('input[name="secondaryUse"]')) input.checked = requestedSecondary.includes(input.value);

  setValueIfValid(priorityInput, params.get('p'));
  setValueIfValid(form.elements.context, params.get('c'));
  setValueIfValid(form.elements.ram, params.get('r'));
  setValueIfValid(form.elements.quantization, params.get('q'));
  setValueIfValid(form.elements.maxWeights, params.get('z'));
  setValueIfValid(form.elements.family, params.get('f'));
  if (params.get('s')) form.elements.speed.value = params.get('s');
  if (params.get('o')) vramInput.value = params.get('o');
  touched = true;
}

function setupUrl() {
  const url = new URL("/", window.location.origin);
  url.search = '';
  url.hash = '';
  const params = new URLSearchParams();
  const mode = form.elements.device.value;
  params.set('d', mode);
  if (mode === 'gpu') {
    const gpu = selectedGPU();
    if (gpu && !vramInput.value.trim()) params.set('g', gpu.id);
    else if (gpuVram.value) params.set('v', gpuVram.value);
    params.set('r', form.elements.ram.value);
    if (gpu && !vramInput.value.trim()) params.set('s', form.elements.speed.value);
  } else if (mode === 'mac') params.set('m', form.elements.macMemory.value);
  else params.set('m', form.elements.unsureMemory.value);
  params.set('t', primaryTask());
  if (secondaryTasks().length) params.set('u', secondaryTasks().join(','));
  params.set('p', priorityInput.value);
  params.set('c', form.elements.context.value);
  if (form.elements.quantization.value !== 'auto') params.set('q', form.elements.quantization.value);
  if (form.elements.maxWeights.value) params.set('z', form.elements.maxWeights.value);
  if (form.elements.family.value) params.set('f', form.elements.family.value);
  if (vramInput.value.trim()) params.set('o', vramInput.value.trim());
  url.hash = params.toString();
  return url.toString();
}

async function copySetupLink() {
  const url = setupUrl();
  history.replaceState(null, '', url);
  try {
    await navigator.clipboard.writeText(url);
    shareStatus.textContent = 'Link copied.';
  } catch {
    const input = document.createElement('textarea');
    input.value = url;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.append(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    shareStatus.textContent = copied ? 'Link copied.' : 'Link added to the address bar.';
  }
  window.setTimeout(() => { shareStatus.textContent = ''; }, 3000);
}

applyUrlState();
syncSecondaryTasks();
lastMode = form.elements.device.value;

function updateDevice() {
  const mode = form.elements.device.value;
  if (mode !== lastMode) {
    vramInput.value = '';
    gpuInput.value = '';
    gpuSearch.hidden = true;
    gpuSearchToggle.setAttribute('aria-expanded', 'false');
    gpuSearchToggle.textContent = 'Search by card name';
  }
  for (const type of ['gpu', 'mac', 'unsure']) document.querySelector(`#${type}-fields`).hidden = type !== mode;
  document.querySelector('#gpu-ram-field').hidden = mode !== 'gpu';
  document.querySelector('#speed-field').hidden = !(mode === 'gpu' && selectedGPU() && !vramInput.value.trim());
  lastMode = mode;
}

function updatePriority() {
  const label = preferenceNames[Number(priorityInput.value) - 1];
  priorityOutput.textContent = label;
  priorityInput.setAttribute('aria-valuetext', label);
}

function updateTierSummaries() {
  const speedKnown = form.elements.device.value === 'gpu' && !!selectedGPU() && !vramInput.value.trim();
  const extras = secondaryTasks().length;
  const advancedParts = [`${(Number(form.elements.context.value) * 1000).toLocaleString('en-US')} tokens`];
  if (extras) advancedParts.push(`${extras} secondary ${extras === 1 ? 'use' : 'uses'}`);
  if (speedKnown) advancedParts.push(`${form.elements.speed.value || '—'} tok/s min`);
  document.querySelector('#advanced-summary').textContent = advancedParts.join(' · ');

  const powerParts = [];
  if (form.elements.quantization.value === 'auto') powerParts.push('Auto quantization');
  else powerParts.push(form.elements.quantization.value);
  if (form.elements.family.value) powerParts.push(form.elements.family.value);
  if (form.elements.maxWeights.value) powerParts.push(`≤ ${form.elements.maxWeights.value} GB file`);
  if (vramInput.value.trim()) powerParts.push(`${vramInput.value.trim()} GB override`);
  document.querySelector('#power-summary').textContent = powerParts.join(' · ');
}

function row(item, hardware, primaryUse, useCases, slower = false, extra = false, isTop = false) {
  const { model, quant, quality, requiredGB, speedLow, speedHigh, ramAdvisory } = item;
  const unknown = !hardware.speedKnown;
  const fit = hardware.mode === 'gpu' ? `Fits in ${fmt(hardware.vramGB)} GB of graphics memory.` : hardware.mode === 'mac' ? `Likely fits in your Mac's available memory.` : `Likely fits with ${fmt(hardware.ramGB)} GB of RAM.`;
  const secondary = useCases.filter(key => key !== primaryUse);
  const useText = secondary.length ? `${taskNames[primaryUse]} first, with ${taskText(secondary)} as secondary needs` : taskNames[primaryUse];
  const why = `${fitLabel(quality)} fit for ${useText}. ${fit}`;
  const speed = unknown ? speedAvailability(hardware) : `${speedLow}–${speedHigh} tok/s`;
  const speedLabel = 'Estimated speed';
  const speedText = unknown ? 'Exact-device speed is not estimated for this setup.' : slower ? `Estimated speed is below your ${fmt(hardware.minSpeed)} tokens/second minimum.` : `Estimated speed meets your ${fmt(hardware.minSpeed)} tokens/second minimum.`;
  const memoryContext = hardware.mode === 'gpu' ? `${fmt(requiredGB)} GB estimated with ${fmt(hardware.vramGB)} GB graphics memory` : hardware.mode === 'mac' ? `${fmt(requiredGB)} GB estimated with ${fmt(hardware.ramGB)} GB unified memory` : `${fmt(requiredGB)} GB estimated with ${fmt(hardware.ramGB)} GB RAM`;
  const preferenceLabel = preferenceNames[Number(priorityInput.value) - 1] || 'Balanced';
  const whyTop = isTop ? `<span class="why-top-match"><strong>Why this match</strong><span>${fitLabel(quality)} ${taskShortNames[primaryUse]} fit · ${memoryContext} · ranks highest for ${preferenceLabel} priority</span></span>` : '';
  return `<details class="model-row ${unknown ? 'speed-unavailable ' : ''}${extra ? 'hidden-row ' : ''}${isTop ? 'top-choice' : ''}">
    <summary><span class="model-title">${isTop ? '<span class="top-choice-badge">Top match for your settings</span>' : ''}<strong>${model.name}</strong><small>${fitLabel(quality)} ${taskShortNames[primaryUse]} fit · ${parameterText(model.parametersB)} parameters · ${quant.name}${slower ? ' · Below speed target' : ''}</small></span><span class="metric"><span>Memory</span><strong>${fmt(requiredGB)} GB</strong></span>${unknown ? '' : `<span class="metric speed"><span>${speedLabel}</span><strong>${speed}</strong></span>`}<span class="chevron" aria-hidden="true"></span>${whyTop}</summary>
    <div class="model-details"><p>${why} ${speedText}</p><p class="estimate-context">Context used for this estimate: ${(Number(form.elements.context.value) * 1000).toLocaleString('en-US')} tokens.</p><div class="detail-grid"><div><span class="detail-label">Model context limit</span><strong>${(model.contextK * 1000).toLocaleString('en-US')} tokens</strong></div></div>${hardware.mode === 'gpu' && !ramAdvisory ? `<p class="ram-warning">Loading this model may need around ${fmt(item.hostRAMGB)} GB of computer RAM. You selected ${fmt(hardware.ramGB)} GB.</p>` : ''}${model.licenseNote ? `<p>License: ${model.licenseNote}. Check terms before use.</p>` : ''}<p class="model-links">${huggingFaceAnchor(model)}</p></div>
  </details>`;
}

function resources() {
  return `<section class="resources" aria-label="Other ways to use AI"><h3>Need a lighter option?</h3><p>Small local models can help with simpler tasks. Online services offer another option, but your prompts are sent to the provider.</p><div class="resource-grid"><div class="resource-card"><strong>Try a small local model</strong><p>Qwen3 0.6B is a starting point for modest hardware. It may be less capable, but your prompts stay on your device when you run it locally.</p><a href="https://ollama.com/library/qwen3:0.6b" target="_blank" rel="noopener noreferrer">Open in Ollama ↗</a><a href="https://huggingface.co/Qwen/Qwen3-0.6B" target="_blank" rel="noopener noreferrer">Read model card ↗</a></div><div class="resource-card"><strong>Use an online model</strong><p>ChatGPT and Claude run online. Check their privacy settings before sharing personal or sensitive information.</p><a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPT ↗</a><a href="https://claude.ai/" target="_blank" rel="noopener noreferrer">Claude ↗</a></div></div><p class="privacy-note">Privacy settings vary by service: <a href="https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt" target="_blank" rel="noopener noreferrer">ChatGPT data controls</a> · <a href="https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training" target="_blank" rel="noopener noreferrer">Claude training policy</a>.</p></section>`;
}

function render(data, hardware, primaryUse, useCases, contextK, settings) {
  resultsNote.textContent = `${data.considered} models · catalogue Sep 2026`;
  const secondary = useCases.filter(key => key !== primaryUse);
  const taskSummary = secondary.length ? `${taskShortNames[primaryUse]} + ${taskShortText(secondary)}` : taskShortNames[primaryUse];
  if (!touched) subtitle.textContent = 'Example: 16 GB RAM. Choose your amount above.';
  else if (hardware.mode === 'gpu') subtitle.textContent = `${hardware.deviceName} · ${taskSummary}`;
  else if (hardware.mode === 'mac') subtitle.textContent = `Mac with ${fmt(hardware.ramGB)} GB memory · ${taskSummary}`;
  else subtitle.textContent = `${fmt(hardware.ramGB)} GB RAM · ${taskSummary}`;

  catalogState = data.catalog.length ? { items: data.catalog, hardware, primaryUse, useCases } : null;
  let html = `<p class="speed-availability">${hardware.speedKnown ? 'Speed ranges are planning estimates, not benchmarks.' : speedAvailability(hardware) + '.'}</p>`;
  if (data.matches.length) {
    const top = data.matches[0];
    html += `<div class="match-list">${data.matches.map((item, i) => row(item, hardware, primaryUse, useCases, false, i >= 3, isTopTie(item, top))).join('')}</div>`;
    if (data.matches.length > 3) html += `<button type="button" class="show-more" aria-expanded="false">Show ${data.matches.length - 3} more matches</button>`;
  } else {
    html += data.slower.length
      ? `<div class="empty-state"><strong>Nothing meets your speed minimum.</strong><p>Models that fit your other choices but fall below that speed are listed below.</p></div>`
      : `<div class="empty-state"><strong>No model fits these choices.</strong><p>Try a shorter context, fewer model filters, or more available memory.</p></div>`;
  }
  if (data.catalog.length) html += `<details class="catalog"><summary>Browse all ${data.catalog.length} models that fit</summary><div class="catalog-body"><p>Includes the shortlist and models below your speed target.</p><label for="catalog-search">Search by model or family</label><input id="catalog-search" type="search" autocomplete="off" placeholder="e.g. Qwen, Gemma, Mistral"><p class="catalog-count" id="catalog-count" aria-live="polite">Open this section to load the catalogue.</p><div class="catalog-list"></div><p class="catalog-no-results" hidden>No model in this list matches your search.</p><button type="button" class="browse-more" hidden>Show more models</button></div></details>`;
  if (data.slower.length) html += `<section class="secondary"><h3 class="secondary-heading">Fits, but below your speed target</h3>${data.slower.map(item => row(item, hardware, primaryUse, useCases, true)).join('')}</section>`;
  if (hardware.vramGB <= 6 || !data.matches.length) html += resources();
  const filterText = data.excluded.filters
    ? ` ${data.excluded.filters} models were removed by your quantization, family or file-size filters.`
    : '';
  html += `<details class="method-note"><summary>How did we pick these?</summary><p>We estimate model memory, context overhead and headroom, then rank viable models for your main use and speed-versus-quality preference. ${data.excluded.memory} models did not fit the estimated memory; ${data.excluded.context} did not support ${(contextK * 1000).toLocaleString('en-US')} tokens.${filterText} Task fit is shown as a broad label because the underlying capability scores are still prototype ranking inputs, not benchmark-grade measurements. Speed is also an estimate unless stated otherwise.</p></details>`;
  results.innerHTML = html;
  catalogLimit = 8;
}

function filterCatalog() {
  const search = results.querySelector('#catalog-search');
  const list = results.querySelector('.catalog-list');
  if (!search || !list || !catalogState) return;
  const query = search.value.trim().toLocaleLowerCase();
  const matches = catalogState.items.filter(item => `${item.model.name} ${item.model.family}`.toLocaleLowerCase().includes(query));
  const visible = matches.slice(0, catalogLimit);
  list.innerHTML = visible.map(item => row(item, catalogState.hardware, catalogState.primaryUse, catalogState.useCases, item.meetsSpeed === false)).join('');
  results.querySelector('#catalog-count').textContent = matches.length ? `Showing ${visible.length} of ${matches.length} matching models` : `No matches for “${search.value.trim()}”.`;
  results.querySelector('.catalog-no-results').hidden = matches.length !== 0;
  results.querySelector('.catalog-no-results').textContent = 'Clear the search or try another model or family.';
  const more = results.querySelector('.browse-more');
  more.hidden = matches.length <= catalogLimit;
  more.textContent = `Show ${Math.min(8, matches.length - catalogLimit)} more models`;
}

function empty(message) {
  catalogState = null;
  results.innerHTML = `<div class="empty-state"><strong>${message}</strong><p>Change your choice above to see models.</p></div>`;
  subtitle.textContent = 'Matches update as you choose.';
}

function update() {
  syncSecondaryTasks();
  updateDevice();
  updatePriority();
  updateTierSummaries();
  error.hidden = true;

  const mode = form.elements.device.value;
  const primaryUse = primaryTask();
  const useCases = tasks();
  const custom = vramInput.value.trim() !== '';
  let vramGB, ramGB, bandwidthGBs, deviceName, speedKnown = false;

  if (mode === 'gpu') {
    const gpu = selectedGPU();
    const chosenMemory = Number(gpuVram.value);
    if (!custom && !gpu && !chosenMemory) { empty('Choose graphics memory or search by card name.'); return; }
    vramGB = custom ? Number(vramInput.value) : gpu ? gpu.vramGB : chosenMemory;
    ramGB = Number(form.elements.ram.value);
    speedKnown = !!gpu && !custom;
    bandwidthGBs = speedKnown ? gpu.bandwidthGBs : undefined;
    deviceName = speedKnown ? gpu.name : `${fmt(vramGB)} GB graphics memory`;
  } else {
    ramGB = Number(mode === 'mac' ? form.elements.macMemory.value : form.elements.unsureMemory.value);
    vramGB = custom ? Number(vramInput.value) : Math.max(2, Math.floor(ramGB * .8 - 1));
    bandwidthGBs = undefined;
  }

  const minSpeed = speedKnown ? Number(form.elements.speed.value) : 1;
  const contextK = Number(form.elements.context.value);
  const quantization = form.elements.quantization.value;
  const maxWeightsGB = form.elements.maxWeights.value ? Number(form.elements.maxWeights.value) : null;
  const family = form.elements.family.value || null;

  if (!Number.isFinite(vramGB) || vramGB < 2 || vramGB > 512) {
    error.textContent = 'Enter memory between 2 and 512 GB.';
    error.hidden = false;
    power.open = true;
    empty('Check the memory amount.');
    return;
  }
  if (!Number.isFinite(minSpeed) || minSpeed < 1 || minSpeed > 500) {
    error.textContent = 'Enter a speed between 1 and 500 tokens/sec.';
    error.hidden = false;
    advanced.open = true;
    empty('Check the speed target.');
    return;
  }

  try {
    const hardware = { mode, vramGB, ramGB, bandwidthGBs, deviceName, speedKnown, minSpeed, customMemory: !!custom };
    const settings = { quantization, maxWeightsGB, family };
    const data = recommend({
      hardware,
      useCases,
      primaryUse,
      preference: Number(priorityInput.value),
      minSpeed,
      contextK,
      ...settings
    });
    render(data, hardware, primaryUse, useCases, contextK, settings);
  } catch (err) {
    empty(err.message);
  }
}

const isFindActive = () => !findView.hidden;
function scheduleUpdate() {
  // Hardware controls are shared by every journey, so keep their visible state current even when Find is hidden.
  updateDevice();
  if (!isFindActive()) return;
  cancelAnimationFrame(updateFrame);
  updateFrame = requestAnimationFrame(() => {
    updateFrame = undefined;
    update();
  });
}

gpuSearchToggle.addEventListener('click', () => {
  gpuSearch.hidden = !gpuSearch.hidden;
  gpuSearchToggle.setAttribute('aria-expanded', String(!gpuSearch.hidden));
  gpuSearchToggle.textContent = gpuSearch.hidden ? 'Search by card name' : 'Hide card search';
  if (gpuSearch.hidden) { gpuInput.value = ''; touched = true; scheduleUpdate(); }
  if (!gpuSearch.hidden) gpuInput.focus();
});

gpuInput.addEventListener('input', () => {
  const gpu = selectedGPU();
  if (gpu) gpuVram.value = String(gpu.vramGB);
});

gpuVram.addEventListener('input', () => { gpuInput.value = ''; });
form.addEventListener('input', event => {
  touched = true;
  // Typing a partial GPU name should not rebuild the recommendation list on every keypress.
  if (event.target === gpuInput && gpuInput.value.trim() && !selectedGPU()) {
    updateDevice();
    return;
  }
  scheduleUpdate();
});
form.addEventListener('submit', event => event.preventDefault());
shareButton.addEventListener('click', copySetupLink);

document.addEventListener('click', event => {
  const journey = event.target.closest?.('[data-journey]');
  if (journey?.dataset.journey === 'find') scheduleUpdate();
});

results.addEventListener('click', event => {
  if (event.target.closest('details.catalog > summary')) {
    requestAnimationFrame(filterCatalog);
    return;
  }
  if (event.target.closest('.browse-more')) { catalogLimit += 8; filterCatalog(); return; }
  const button = event.target.closest('.show-more');
  if (!button) return;
  const list = results.querySelector('.match-list');
  const expanded = list.classList.toggle('expanded-list');
  button.setAttribute('aria-expanded', String(expanded));
  button.textContent = expanded ? 'Show fewer matches' : `Show ${list.querySelectorAll('.hidden-row').length} more matches`;
});

results.addEventListener('input', event => {
  if (event.target.id !== 'catalog-search') return;
  catalogLimit = 8;
  filterCatalog();
});

update();
// Same-document links and browser Back/Forward must restore the shared controls too.
window.addEventListener('hashchange', () => {
  form.reset(); gpuInput.value = ''; vramInput.value = '';
  gpuSearch.hidden = true; gpuSearchToggle.setAttribute('aria-expanded', 'false');
  gpuSearchToggle.textContent = 'Search by card name';
  applyUrlState(); syncSecondaryTasks();
  lastMode = form.elements.device.value;
  const speedChoice = document.querySelector('#speed-choice');
  if (speedChoice) {
    const value = form.elements.speed.value;
    if (![...speedChoice.options].some(option => option.value === value)) {
      const option = document.createElement('option'); option.value = value; option.textContent = value + ' tok/s'; speedChoice.append(option);
    }
    speedChoice.value = value;
  }
  priorityInput.dispatchEvent(new Event('input', {bubbles:true}));
  const mode = new URLSearchParams(location.hash.slice(1)).get('j') || 'find';
  document.querySelector('[data-journey="' + (['find','improve','upgrade'].includes(mode) ? mode : 'find') + '"]')?.click();
});
