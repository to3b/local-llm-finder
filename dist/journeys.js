import { GPUs, MODELS } from './data.js';
import { recommend } from './recommend.js';

const form = document.querySelector('#finder-form');
const findView = document.querySelector('#results');
const hero = document.querySelector('.hero');
if (!form || !findView || !hero) throw new Error('Journey UI unavailable.');

const fmt = n => Number.isInteger(n) ? String(n) : Number(n).toFixed(1);
const signed = n => `${n > 0 ? '+' : ''}${Number.isInteger(n) ? n : n.toFixed(1)}`;
const gpuLabel = gpu => `${gpu.name} — ${gpu.vramGB} GB`;

hero.querySelector('#page-heading').textContent = 'Find the local LLM setup that makes sense for you';
const heroCopy = hero.querySelectorAll(':scope > p');
if (heroCopy[1]) heroCopy[1].textContent = 'Find a model that fits, check whether your current model is still a good choice, or see what a memory upgrade would actually change.';
document.title = 'Local LLM Finder — Find, improve or upgrade your local AI setup';

hero.insertAdjacentHTML('afterend', `<nav class="journey-nav" aria-label="Choose what you want to do"><div class="journey-options">
  <button type="button" class="journey-option" data-journey="find" aria-pressed="true"><span>Find</span><small>Choose a model</small></button>
  <button type="button" class="journey-option" data-journey="improve" aria-pressed="false"><span>Improve</span><small>Check your current model</small></button>
  <button type="button" class="journey-option" data-journey="upgrade" aria-pressed="false"><span>Upgrade</span><small>See what more memory changes</small></button>
</div><p class="journey-help">The hardware and workload settings below are shared across all three views.</p></nav>`);

findView.insertAdjacentHTML('afterend', `<section class="results journey-results" id="improve-results" hidden>
  <div class="results-heading"><div><h2>Is your current model still a good fit?</h2><p>Compare what you run now with alternatives for the same hardware and workload.</p></div><span class="results-note">Prototype comparison</span></div>
  <div class="current-model-control"><div class="field"><label for="current-model">Current model</label><input id="current-model" list="current-model-list" autocomplete="off" placeholder="Start typing a model name"><datalist id="current-model-list"></datalist></div><div class="field"><label for="current-quant">Current quantization</label><select id="current-quant"><option value="auto">Automatic / not sure</option><option>Q4_K_M</option><option>Q5_K_M</option><option>Q8_0</option></select></div></div>
  <div id="improve-content" class="journey-content"><p class="initial-state">Choose the model you already run to compare it.</p></div>
</section>
<section class="results journey-results" id="upgrade-results" hidden>
  <div class="results-heading"><div><h2>When would more memory actually change your options?</h2><p>Find the next memory tiers where the recommendation meaningfully improves for the same workload.</p></div><span class="results-note">Capacity-only simulation</span></div>
  <div id="upgrade-content" class="journey-content"></div>
</section>`);

const improveView = document.querySelector('#improve-results');
const upgradeView = document.querySelector('#upgrade-results');
const improveContent = document.querySelector('#improve-content');
const upgradeContent = document.querySelector('#upgrade-content');
const currentInput = document.querySelector('#current-model');
const currentQuant = document.querySelector('#current-quant');
const buttons = [...document.querySelectorAll('[data-journey]')];
const modelList = document.querySelector('#current-model-list');
modelList.replaceChildren(...[...MODELS].sort((a,b) => a.name.localeCompare(b.name)).map(model => { const o = document.createElement('option'); o.value = model.name; return o; }));
let active = 'find';

function gpu() {
  const value = document.querySelector('#gpu-input')?.value.trim().toLowerCase();
  return GPUs.find(item => gpuLabel(item).toLowerCase() === value) || null;
}

function state() {
  const mode = form.elements.device.value;
  const primaryUse = form.elements.primaryUse?.value || 'chat';
  const secondary = [...form.querySelectorAll('input[name="secondaryUse"]:checked')].map(x => x.value).filter(x => x !== primaryUse);
  const custom = form.elements.vram?.value.trim() || '';
  let vramGB, ramGB, bandwidthGBs, deviceName, speedKnown = false;
  if (mode === 'gpu') {
    const card = gpu();
    const chosen = Number(form.elements.gpuVram?.value || 0);
    if (!custom && !card && !chosen) return { error: 'Choose graphics memory or a graphics card first.' };
    vramGB = custom ? Number(custom) : card ? card.vramGB : chosen;
    ramGB = Number(form.elements.ram?.value || 32);
    speedKnown = !!card && !custom;
    bandwidthGBs = speedKnown ? card.bandwidthGBs : undefined;
    deviceName = card?.name || `${fmt(vramGB)} GB graphics memory`;
  } else {
    ramGB = Number(mode === 'mac' ? form.elements.macMemory.value : form.elements.unsureMemory.value);
    vramGB = custom ? Number(custom) : Math.max(2, Math.floor(ramGB * .8 - 1));
    deviceName = mode === 'mac' ? `Mac with ${fmt(ramGB)} GB memory` : `${fmt(ramGB)} GB RAM`;
  }
  if (!Number.isFinite(vramGB) || vramGB < 2) return { error: 'Choose a valid memory amount first.' };
  const maxRaw = form.elements.maxWeights?.value || '';
  return {
    mode, customMemory: !!custom,
    hardware: { mode, vramGB, ramGB, bandwidthGBs, speedKnown, deviceName },
    useCases: [primaryUse, ...secondary], primaryUse,
    preference: Number(form.elements.priority?.value || 3),
    minSpeed: speedKnown ? Number(form.elements.speed?.value || 15) : 15,
    contextK: Number(form.elements.context?.value || 8),
    quantization: form.elements.quantization?.value || 'auto',
    maxWeightsGB: maxRaw ? Number(maxRaw) : null,
    family: form.elements.family?.value || null
  };
}

function run(s, changes = {}, models = MODELS) {
  const pick = (key, fallback) => Object.prototype.hasOwnProperty.call(changes, key) ? changes[key] : fallback;
  return recommend({
    hardware: pick('hardware', s.hardware), useCases: s.useCases, primaryUse: s.primaryUse,
    preference: s.preference, minSpeed: pick('minSpeed', s.minSpeed), contextK: s.contextK,
    quantization: pick('quantization', s.quantization), maxWeightsGB: pick('maxWeightsGB', s.maxWeightsGB), family: pick('family', s.family)
  }, models);
}

function card(item, hardware, label) {
  const speed = hardware.speedKnown ? `${item.speedLow}–${item.speedHigh} tok/s` : 'Not estimated';
  return `<article class="decision-card"><span class="decision-label">${label}</span><h3>${item.model.name}</h3><p>${item.quant.name} · ${fmt(item.requiredGB)} GB estimated memory</p><dl><div><dt>Task fit</dt><dd>${item.quality}/100</dd></div><div><dt>Speed</dt><dd>${speed}</dd></div><div><dt>Context</dt><dd>${item.model.contextK}K</dd></div></dl></article>`;
}

function renderImprove() {
  const s = state();
  if (s.error) return void (improveContent.innerHTML = `<div class="empty-state"><strong>Finish the hardware setup first.</strong><p>${s.error}</p></div>`);
  const model = MODELS.find(x => x.name.toLowerCase() === currentInput.value.trim().toLowerCase());
  if (!model) return void (improveContent.innerHTML = '<p class="initial-state">Choose the model you already run. The comparison will use the same settings shown above.</p>');
  let currentResult, alternatives;
  try {
    currentResult = run(s, { quantization: currentQuant.value, maxWeightsGB: null, family: null }, [model]);
    alternatives = run(s);
  } catch (err) {
    return void (improveContent.innerHTML = `<div class="empty-state"><strong>Could not compare these settings.</strong><p>${err.message}</p></div>`);
  }
  const current = currentResult.catalog[0];
  if (!current) {
    const reason = currentResult.excluded.context ? 'The selected text limit exceeds this model profile.' : currentResult.excluded.memory ? 'It does not fit the current memory budget at this quantization.' : 'That quantization is not available in the prototype catalogue.';
    return void (improveContent.innerHTML = `<div class="decision-summary decision-warning"><span class="decision-kicker">Current setup</span><h3>${model.name} is a difficult fit under these settings</h3><p>${reason}</p></div>`);
  }
  const alternative = alternatives.matches.find(x => x.model.id !== model.id) || alternatives.catalog.find(x => x.model.id !== model.id);
  if (!alternative) return void (improveContent.innerHTML = `<div class="decision-summary"><span class="decision-kicker">Refresh check</span><h3>Your current model is already among the only viable choices</h3><p>No different model survives the current filters and hardware limits.</p></div>${card(current, s.hardware, 'Current model')}`);
  const q = alternative.quality - current.quality;
  const mem = alternative.requiredGB - current.requiredGB;
  const speed = s.hardware.speedKnown ? alternative.speedLow - current.speedLow : null;
  const rank = alternative.rank - current.rank;
  let title = 'A trade-off, not a clear replacement', text = `${alternative.model.name} changes the balance, but not enough to call it an obvious upgrade.`, tone = '';
  if (rank >= .04 && q >= 3 && (speed === null || speed >= -Math.max(2, current.speedLow * .3))) {
    title = 'There may be a worthwhile model switch'; text = `${alternative.model.name} is a stronger fit for the workload you selected without an extreme estimated speed penalty.`; tone = ' decision-positive';
  } else if (rank <= .02 && q <= 2) {
    title = 'Your current model remains competitive'; text = 'The best alternative does not create a large enough improvement to make switching look compelling in the current scoring model.';
  }
  improveContent.innerHTML = `<div class="decision-summary${tone}"><span class="decision-kicker">Model refresh check</span><h3>${title}</h3><p>${text}</p><div class="delta-strip"><span>Task fit <strong>${signed(q)}</strong></span><span>Memory <strong>${signed(mem)} GB</strong></span><span>Speed <strong>${speed === null ? 'not comparable' : `${signed(speed)} tok/s`}</strong></span></div></div><div class="decision-grid">${card(current, s.hardware, 'Current model')}${card(alternative, s.hardware, 'Best alternative')}</div><p class="journey-caveat">Prototype only: these comparisons still use sample capability and performance data rather than benchmark-grade evidence.</p>`;
}

function budgets(s) {
  if (s.customMemory) return [4,6,8,10,12,16,20,24,32,48,64,80,96,128,192,256,512].filter(x => x > s.hardware.vramGB);
  if (s.mode === 'gpu') return [4,6,8,10,12,16,20,24,32,48,64,80,96].filter(x => x > s.hardware.vramGB);
  const list = s.mode === 'mac' ? [8,16,24,32,36,48,64,96,128,192,256,512] : [4,8,16,32,64,128,256,512];
  return list.filter(x => x > s.hardware.ramGB);
}

function hardwareAt(s, amount) {
  if (s.customMemory || s.mode === 'gpu') return { ...s.hardware, vramGB: amount, bandwidthGBs: undefined, speedKnown: false };
  return { ...s.hardware, ramGB: amount, vramGB: Math.max(2, Math.floor(amount * .8 - 1)), bandwidthGBs: undefined, speedKnown: false };
}

function capacityTop(s, hardware) {
  const r = run(s, { hardware, minSpeed: 1 });
  return r.matches[0] || r.catalog[0] || null;
}

function renderUpgrade() {
  const s = state();
  if (s.error) return void (upgradeContent.innerHTML = `<div class="empty-state"><strong>Finish the hardware setup first.</strong><p>${s.error}</p></div>`);
  const baseHardware = { ...s.hardware, bandwidthGBs: undefined, speedKnown: false };
  let base;
  try { base = capacityTop(s, baseHardware); } catch (err) { return void (upgradeContent.innerHTML = `<div class="empty-state"><strong>Could not simulate these settings.</strong><p>${err.message}</p></div>`); }
  if (!base) return void (upgradeContent.innerHTML = '<div class="empty-state"><strong>No baseline recommendation fits yet.</strong><p>Try a shorter context or loosen a Power User filter.</p></div>');
  const milestones = [];
  let previous = base;
  for (const amount of budgets(s)) {
    const candidate = capacityTop(s, hardwareAt(s, amount));
    if (!candidate) continue;
    const changed = candidate.model.id !== previous.model.id || candidate.quant.name !== previous.quant.name;
    const meaningful = candidate.quality >= previous.quality + 2 || (candidate.model.id === previous.model.id && candidate.quant.name !== previous.quant.name);
    if (changed && meaningful) { milestones.push({ amount, candidate, previous }); previous = candidate; if (milestones.length === 3) break; }
  }
  const unit = s.customMemory ? 'GB available memory' : s.mode === 'gpu' ? 'GB VRAM' : s.mode === 'mac' ? 'GB unified memory' : 'GB RAM';
  const start = `${fmt(s.customMemory || s.mode === 'gpu' ? s.hardware.vramGB : s.hardware.ramGB)} ${unit}`;
  if (!milestones.length) return void (upgradeContent.innerHTML = `<div class="decision-summary"><span class="decision-kicker">Capacity check</span><h3>More memory does not quickly change the top recommendation</h3><p>Starting from ${start}, the tested higher-memory tiers did not create a meaningfully stronger top pick under these preferences.</p></div>${card(base, baseHardware, 'Current capacity pick')}<p class="journey-caveat">This isolates memory capacity only; it does not compare compute, bandwidth, price or measured speed.</p>`);
  upgradeContent.innerHTML = `<div class="decision-summary decision-positive"><span class="decision-kicker">Next meaningful capacity steps</span><h3>Your current top capacity pick is ${base.model.name}</h3><p>Starting from ${start}, these are the first higher-memory tiers where the recommendation changes enough to matter in the prototype scoring.</p></div><div class="upgrade-list">${milestones.map(({amount,candidate,previous}) => `<article class="upgrade-milestone"><span class="decision-label">At ${amount} ${unit}</span><h3>${candidate.model.name}</h3><p>${previous.model.id === candidate.model.id ? `${previous.quant.name} → ${candidate.quant.name}` : `${previous.model.name} → ${candidate.model.name}`}</p><div class="milestone-meta"><span>Task fit <strong>+${candidate.quality - previous.quality}</strong></span><span>${candidate.quant.name}</span><span>${fmt(candidate.requiredGB)} GB estimated</span></div></article>`).join('')}</div><p class="journey-caveat">Capacity-only simulation: this does not say buying the hardware is worthwhile. Compute, bandwidth, price and real benchmarks still matter.</p>`;
}

function refresh() { if (active === 'improve') renderImprove(); else if (active === 'upgrade') renderUpgrade(); }
function activate(name, write = true) {
  active = ['find','improve','upgrade'].includes(name) ? name : 'find';
  findView.hidden = active !== 'find'; improveView.hidden = active !== 'improve'; upgradeView.hidden = active !== 'upgrade';
  buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.journey === active)));
  if (write) { const p = new URLSearchParams(location.hash.slice(1)); p.set('j', active); history.replaceState(null, '', `#${p}`); }
  refresh();
}
let frame;
function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(refresh); }
buttons.forEach(b => b.addEventListener('click', () => activate(b.dataset.journey)));
form.addEventListener('input', schedule); form.addEventListener('change', schedule);
currentInput.addEventListener('input', renderImprove); currentQuant.addEventListener('change', renderImprove);
activate(new URLSearchParams(location.hash.slice(1)).get('j') || 'find', false);
