import { GPUs } from './data.js';
import { recommend } from './recommend.js';

const form = document.querySelector('#finder-form');
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
const shareButton = document.querySelector('#share-setup');
const shareStatus = document.querySelector('#share-status');
const gpuLabel = gpu => `${gpu.name} — ${gpu.vramGB} GB`;
const fmt = value => Number.isInteger(value) ? String(value) : value.toFixed(1);
const parameterText = value => value < 1 ? `${Math.round(value * 1000)} million` : `${fmt(value)} billion`;
const taskNames = { chat: 'chatting', coding: 'coding', reasoning: 'solving problems', writing: 'creative writing', longContext: 'reading long files' };
const preferenceNames = ['Fastest', 'Faster', 'Balanced', 'Stronger', 'Strongest'];
let touched = false;
let lastMode;
let catalogLimit = 8;

const options = GPUs.map(gpu => { const option = document.createElement('option'); option.value = gpuLabel(gpu); return option; });
document.querySelector('#gpu-options').replaceChildren(...options);
const selectedGPU = () => GPUs.find(item => gpuLabel(item).toLowerCase() === gpuInput.value.trim().toLowerCase());
const tasks = () => [...form.querySelectorAll('input[name="usecase"]:checked')].map(input => input.value);
const taskText = keys => keys.map(key => taskNames[key]).join(', ');
const setValueIfValid = (control, value) => {
  if (!control || value == null) return;
  const allowed = control.tagName === 'SELECT' ? [...control.options].some(option => option.value === value) : true;
  if (allowed) control.value = value;
};

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

  const requestedTasks = (params.get('u') || '').split(',').filter(key => taskNames[key]);
  if (requestedTasks.length) {
    for (const input of form.querySelectorAll('input[name="usecase"]')) input.checked = requestedTasks.includes(input.value);
  }
  setValueIfValid(priorityInput, params.get('p'));
  setValueIfValid(form.elements.context, params.get('c'));
  setValueIfValid(form.elements.ram, params.get('r'));
  if (params.get('s')) form.elements.speed.value = params.get('s');
  if (params.get('o')) vramInput.value = params.get('o');
  touched = true;
}

function setupUrl() {
  const url = new URL(window.location.href);
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
  params.set('u', tasks().join(','));
  params.set('p', priorityInput.value);
  params.set('c', form.elements.context.value);
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
function updateAdvanced() {
  const speedKnown = form.elements.device.value === 'gpu' && !!selectedGPU() && !vramInput.value.trim();
  const speedText = speedKnown ? ` · ${form.elements.speed.value || '—'} tokens/second minimum` : '';
  document.querySelector('#advanced-summary').textContent = `${(Number(form.elements.context.value) * 1000).toLocaleString('en-US')} tokens${speedText}${vramInput.value.trim() ? ` · ${vramInput.value.trim()} GB override` : ''}`;
}
function row(item, hardware, useCases, slower = false, extra = false) {
  const { model, quant, quality, requiredGB, speedLow, speedHigh, ramAdvisory } = item;
  const unknown = !hardware.speedKnown;
  const fit = hardware.mode === 'gpu' ? `Fits in ${fmt(hardware.vramGB)} GB of graphics memory.` : hardware.mode === 'mac' ? `Likely fits in your Mac's available memory.` : `Likely fits with ${fmt(hardware.ramGB)} GB of RAM.`;
  const why = `${quality >= 87 ? 'Strong' : 'Good'} for ${taskText(useCases)}. ${fit}`;
  const speed = unknown ? 'Not estimated' : `${speedLow}–${speedHigh} tok/s`;
  const speedText = unknown ? 'We do not have a speed estimate for this setup.' : slower ? `Estimated speed is below your ${fmt(hardware.minSpeed)} tokens/second minimum.` : `Estimated speed meets your ${fmt(hardware.minSpeed)} tokens/second minimum.`;
  return `<details class="model-row ${extra ? 'hidden-row' : ''}">
    <summary><span class="model-title"><strong>${model.name}</strong><small>${parameterText(model.parametersB)} parameters · ${quant.name}${slower ? ' · Below speed target' : unknown ? ' · Speed not estimated' : ''}</small></span><span class="metric"><span>Memory</span><strong>${fmt(requiredGB)} GB</strong></span><span class="metric speed"><span>Speed</span><strong>${speed}</strong></span><span class="chevron" aria-hidden="true"></span></summary>
    <div class="model-details"><p>${why} ${speedText}</p><div class="detail-grid"><div><span class="detail-label">Task fit</span><strong>${quality}/100</strong></div><div><span class="detail-label">Text limit</span><strong>${(model.contextK * 1000).toLocaleString('en-US')} tokens</strong></div><div><span class="detail-label">Memory</span><strong>${fmt(requiredGB)} GB estimated</strong></div><div><span class="detail-label">Speed</span><strong>${unknown ? 'Not estimated' : `${speedLow}–${speedHigh} tok/s estimated`}</strong></div></div>${hardware.mode === 'gpu' && !ramAdvisory ? `<p class="ram-warning">Loading this model may need around ${fmt(item.hostRAMGB)} GB of computer RAM. You selected ${fmt(hardware.ramGB)} GB.</p>` : ''}${model.licenseNote ? `<p>License: ${model.licenseNote}. Check terms before use.</p>` : ''}</div>
  </details>`;
}
function resources() {
  return `<section class="resources" aria-label="Other ways to use AI"><h3>Need a lighter option?</h3><p>Small local models can help with simpler tasks. Online services offer another option, but your prompts are sent to the provider.</p><div class="resource-grid"><div class="resource-card"><strong>Try a small local model</strong><p>Qwen3 0.6B is a starting point for modest hardware. It may be less capable, but your prompts stay on your device when you run it locally.</p><a href="https://ollama.com/library/qwen3:0.6b" target="_blank" rel="noopener noreferrer">Open in Ollama ↗</a><a href="https://huggingface.co/Qwen/Qwen3-0.6B" target="_blank" rel="noopener noreferrer">Read model card ↗</a></div><div class="resource-card"><strong>Use an online model</strong><p>ChatGPT and Claude run online. Check their privacy settings before sharing personal or sensitive information.</p><a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPT ↗</a><a href="https://claude.ai/" target="_blank" rel="noopener noreferrer">Claude ↗</a></div></div><p class="privacy-note">Privacy settings vary by service: <a href="https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt" target="_blank" rel="noopener noreferrer">ChatGPT data controls</a> · <a href="https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training" target="_blank" rel="noopener noreferrer">Claude training policy</a>.</p></section>`;
}
function render(data, hardware, useCases, contextK) {
  resultsNote.textContent = `${data.considered} models · sample estimates`;
  if (!touched) subtitle.textContent = 'Example: 16 GB RAM. Choose your amount above.';
  else if (hardware.mode === 'gpu') subtitle.textContent = `${hardware.deviceName} · ${taskText(useCases)}`;
  else if (hardware.mode === 'mac') subtitle.textContent = `Mac with ${fmt(hardware.ramGB)} GB memory · ${taskText(useCases)}`;
  else subtitle.textContent = `${fmt(hardware.ramGB)} GB RAM · ${taskText(useCases)}`;

  let html = '';
  if (data.matches.length) {
    html += `<div class="match-list">${data.matches.map((item, i) => row(item, hardware, useCases, false, i >= 3)).join('')}</div>`;
    if (data.matches.length > 3) html += `<button type="button" class="show-more" aria-expanded="false">Show ${data.matches.length - 3} more matches</button>`;
  } else {
    html += data.slower.length
      ? `<div class="empty-state"><strong>Nothing meets your speed minimum.</strong><p>Models that fit your memory but fall below that speed are listed below.</p></div>`
      : `<div class="empty-state"><strong>No model fits these choices.</strong><p>Try a shorter text limit or more available memory.</p></div>`;
  }
  if (data.catalog.length) html += `<details class="catalog"><summary>Browse all ${data.catalog.length} models that fit</summary><div class="catalog-body"><p>Includes the shortlist and models below your speed target.</p><label for="catalog-search">Search by model or family</label><input id="catalog-search" type="search" autocomplete="off" placeholder="e.g. Qwen, Gemma, Mistral"><p class="catalog-count" id="catalog-count" aria-live="polite"></p><div class="catalog-list">${data.catalog.map(item => row(item, hardware, useCases, item.meetsSpeed === false)).join('')}</div><p class="catalog-no-results" hidden>No model in this list matches your search.</p><button type="button" class="browse-more" hidden>Show more models</button></div></details>`;
  if (data.slower.length) html += `<section class="secondary"><h3 class="secondary-heading">Fits, but below your speed target</h3>${data.slower.map(item => row(item, hardware, useCases, true)).join('')}</section>`;
  if (hardware.vramGB <= 6 || !data.matches.length) html += resources();
  html += `<details class="method-note"><summary>How did we pick these?</summary><p>We estimate how much memory each model needs, including room for the text limit you chose, and leave some memory free. We rank those that fit by your tasks and speed or quality preference. Stronger task fits get priority when they meet your speed minimum. ${data.excluded.memory} models did not fit the estimated memory; ${data.excluded.context} did not support ${(contextK * 1000).toLocaleString('en-US')} tokens. Computer RAM is a guide for loading, not a strict cutoff. <strong>Memory, speed, and task scores are sample estimates, not measured benchmarks.</strong> A graphics card name helps us estimate speed, which also varies with software and settings.</p></details>`;
  results.innerHTML = html;
  catalogLimit = 8;
  filterCatalog();
}
function filterCatalog() {
  const search = results.querySelector('#catalog-search');
  if (!search) return;
  const query = search.value.trim().toLocaleLowerCase();
  const rows = [...results.querySelectorAll('.catalog-list .model-row')];
  let matches = 0;
  for (const item of rows) {
    const name = item.querySelector('.model-title strong').textContent.toLocaleLowerCase();
    const withinLimit = name.includes(query) && matches++ < catalogLimit;
    item.hidden = !withinLimit;
  }
  const shown = Math.min(matches, catalogLimit);
  results.querySelector('#catalog-count').textContent = `Showing ${shown} of ${matches} matching models`;
  results.querySelector('.catalog-no-results').hidden = matches !== 0;
  const more = results.querySelector('.browse-more');
  more.hidden = matches <= catalogLimit;
  more.textContent = `Show ${Math.min(8, matches - catalogLimit)} more models`;
}
function empty(message) {
  results.innerHTML = `<div class="empty-state"><strong>${message}</strong><p>Change your choice above to see models.</p></div>`;
  subtitle.textContent = 'Matches update as you choose.';
}
function update() {
  updateDevice(); updatePriority(); updateAdvanced(); error.hidden = true;
  const mode = form.elements.device.value;
  const useCases = tasks();
  if (!useCases.length) { empty('Pick at least one thing you want to do.'); return; }
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
    // Shared-memory planning budget: reserve approximately 20% plus 1 GB.
    vramGB = custom ? Number(vramInput.value) : Math.max(2, Math.floor(ramGB * .8 - 1));
    bandwidthGBs = undefined;
  }
  const minSpeed = speedKnown ? Number(form.elements.speed.value) : 15;
  const contextK = Number(form.elements.context.value);
  if (!Number.isFinite(vramGB) || vramGB < 2 || vramGB > 512) {
    error.textContent = 'Enter memory between 2 and 512 GB.'; error.hidden = false; advanced.open = true; empty('Check the memory amount.'); return;
  }
  if (!Number.isFinite(minSpeed) || minSpeed < 1 || minSpeed > 500) {
    error.textContent = 'Enter a speed between 1 and 500 tokens/sec.'; error.hidden = false; advanced.open = true; empty('Check the speed target.'); return;
  }
  try {
    const hardware = { mode, vramGB, ramGB, bandwidthGBs, deviceName, speedKnown, minSpeed };
    render(recommend({ hardware, useCases, preference: Number(priorityInput.value), minSpeed, contextK }), hardware, useCases, contextK);
  } catch (err) { empty(err.message); }
}
gpuSearchToggle.addEventListener('click', () => {
  gpuSearch.hidden = !gpuSearch.hidden;
  gpuSearchToggle.setAttribute('aria-expanded', String(!gpuSearch.hidden));
  gpuSearchToggle.textContent = gpuSearch.hidden ? 'Search by card name' : 'Hide card search';
  if (gpuSearch.hidden) { gpuInput.value = ''; touched = true; update(); }
  if (!gpuSearch.hidden) gpuInput.focus();
});
gpuInput.addEventListener('input', () => {
  const gpu = selectedGPU();
  if (gpu) gpuVram.value = String(gpu.vramGB);
});
gpuVram.addEventListener('input', () => { gpuInput.value = ''; });
form.addEventListener('input', () => { touched = true; update(); });
form.addEventListener('change', () => { touched = true; update(); });
form.addEventListener('submit', event => event.preventDefault());
shareButton.addEventListener('click', copySetupLink);
results.addEventListener('click', event => {
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
