const PRIORITY_LABELS = ['Fastest', 'Faster', 'Balanced', 'Stronger', 'Strongest'];

function bindDevicePanelSync() {
  const form = document.querySelector('#finder-form');
  if (!form || form.dataset.devicePanelSync) return;
  form.dataset.devicePanelSync = 'true';
  let lastMode = form.elements.device?.value;

  const sync = () => {
    const mode = form.elements.device?.value;
    if (!mode) return;

    if (mode !== lastMode) {
      const override = document.querySelector('#vram-input');
      const gpuInput = document.querySelector('#gpu-input');
      const gpuSearch = document.querySelector('#gpu-search');
      const gpuToggle = document.querySelector('#toggle-gpu-search');
      if (override) override.value = '';
      if (gpuInput) gpuInput.value = '';
      if (gpuSearch) gpuSearch.hidden = true;
      if (gpuToggle) {
        gpuToggle.setAttribute('aria-expanded', 'false');
        gpuToggle.textContent = 'Search by card name';
      }
    }

    for (const type of ['gpu', 'mac', 'unsure']) {
      const fields = document.querySelector(`#${type}-fields`);
      if (fields) fields.hidden = type !== mode;
    }
    const ramField = document.querySelector('#gpu-ram-field');
    if (ramField) ramField.hidden = mode !== 'gpu';
    const speedField = document.querySelector('#speed-field');
    if (speedField && mode !== 'gpu') speedField.hidden = true;
    lastMode = mode;
  };

  const onDeviceChange = event => {
    if (event.target?.name === 'device') sync();
  };
  form.addEventListener('input', onDeviceChange);
  form.addEventListener('change', onDeviceChange);
  sync();
}

function enhancePriority() {
  const input = document.querySelector('#priority-input');
  const control = input?.closest('.priority-control');
  if (!input || !control) return;

  if (!control.querySelector('.priority-steps')) {
    const steps = document.createElement('div');
    steps.className = 'priority-steps';
    steps.setAttribute('role', 'group');
    steps.setAttribute('aria-label', 'Speed versus quality priority');
    steps.innerHTML = PRIORITY_LABELS.map((label, index) =>
      `<button type="button" class="priority-step" data-priority="${index + 1}" aria-pressed="false">${label}</button>`
    ).join('');
    control.append(steps);

    steps.addEventListener('click', event => {
      const button = event.target.closest('[data-priority]');
      if (!button) return;
      input.value = button.dataset.priority;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  control.classList.add('priority-enhanced');
  const sync = () => {
    const value = Number(input.value);
    for (const button of control.querySelectorAll('[data-priority]')) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.priority) === value));
    }
  };
  if (!input.dataset.prioritySync) {
    input.addEventListener('input', sync);
    input.addEventListener('change', sync);
    input.dataset.prioritySync = 'true';
  }
  sync();
}

function syncSpeedSummary() {
  const input = document.querySelector('#speed-input');
  const summary = document.querySelector('#advanced-summary');
  if (!input || !summary) return;
  if (input.value === '1') summary.textContent = summary.textContent.replace(/(?:1|—) tok\/s min/g, 'No speed minimum');
}

function enhanceSpeedFloor() {
  const field = document.querySelector('#speed-field');
  const input = document.querySelector('#speed-input');
  if (!field || !input || field.dataset.speedEnhanced) return;
  field.dataset.speedEnhanced = 'true';

  if (input.value === '15' || input.value === '10' || !input.value) input.value = '1';
  const label = field.querySelector('label');
  if (label) {
    label.textContent = 'Minimum speed';
    label.htmlFor = 'speed-choice';
  }

  const select = document.createElement('select');
  select.id = 'speed-choice';
  select.setAttribute('aria-label', 'Minimum estimated speed');
  select.innerHTML = [
    ['1', 'No minimum'],
    ['5', '5 tok/s'],
    ['10', '10 tok/s'],
    ['15', '15 tok/s'],
    ['20', '20 tok/s'],
    ['30', '30 tok/s'],
    ['50', '50 tok/s']
  ].map(([value, text]) => `<option value="${value}">${text}</option>`).join('');
  select.value = input.value;

  input.hidden = true;
  input.setAttribute('aria-hidden', 'true');
  input.insertAdjacentElement('afterend', select);
  if (!field.querySelector('.field-help')) {
    select.insertAdjacentHTML('afterend', '<p class="field-help">Optional. Only set this if you need a hard speed floor.</p>');
  }

  select.addEventListener('change', () => {
    input.value = select.value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    queueMicrotask(syncSpeedSummary);
  });

  const form = input.form;
  if (form && !form.dataset.speedSummarySync) {
    const refresh = () => queueMicrotask(syncSpeedSummary);
    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);
    form.dataset.speedSummarySync = 'true';
  }

  input.dispatchEvent(new Event('input', { bubbles: true }));
  queueMicrotask(syncSpeedSummary);
}

function addStage(section, number) {
  if (!section) return;
  section.classList.add('stage-section');
  const heading = section.querySelector('.section-heading');
  if (heading && !heading.querySelector('.stage-index')) {
    heading.insertAdjacentHTML('afterbegin', `<span class="stage-index" aria-hidden="true">${number}</span>`);
  }
}

function tuneCopy() {
  const hero = document.querySelector('.hero');
  const nav = document.querySelector('.journey-nav');
  if (!hero || !nav) return false;

  document.querySelector('.app-header')?.remove();
  hero.querySelector('.eyebrow')?.remove();
  hero.querySelector('.hero-note')?.remove();

  const heading = hero.querySelector('#page-heading');
  const heroBody = hero.querySelector(':scope > p');
  if (heading) heading.textContent = 'Which local LLM can your computer run?';
  if (heroBody) heroBody.textContent = 'Choose your hardware and workload to compare local models by estimated memory use, context length and task fit. Speed estimates are available for supported GPUs.';

  const labels = {
    find: ['Find', 'Pick a model'],
    improve: ['Improve', 'Compare your model'],
    upgrade: ['Upgrade', 'See what memory unlocks']
  };
  for (const button of nav.querySelectorAll('[data-journey]')) {
    const copy = labels[button.dataset.journey];
    if (!copy) continue;
    const main = button.querySelector('span');
    const sub = button.querySelector('small');
    if (main) main.textContent = copy[0];
    if (sub) sub.textContent = copy[1];
  }
  nav.querySelector('.journey-help')?.remove();

  const basicExtra = document.querySelector('.tier-start > span:not(.tier-label)');
  if (basicExtra) basicExtra.remove();

  const hardwareHeading = document.querySelector('#computer-heading');
  if (hardwareHeading) hardwareHeading.textContent = 'Hardware';
  addStage(document.querySelector('.computer-section'), 1);
  addStage(document.querySelector('.task-section'), 2);
  addStage(document.querySelector('.priority-section'), 3);

  const gpuHelp = document.querySelector('#gpu-fields .field-help');
  if (gpuHelp) gpuHelp.textContent = 'VRAM affects fit. Card model improves speed estimates.';

  const taskHelp = document.querySelector('.task-section > .field-help');
  if (taskHelp) taskHelp.textContent = 'This gets the most weight.';

  bindDevicePanelSync();
  enhancePriority();
  enhanceSpeedFloor();

  const improve = document.querySelector('#improve-results');
  if (improve) {
    const title = improve.querySelector('.results-heading h2');
    const sub = improve.querySelector('.results-heading p');
    if (title) title.textContent = 'Compare your current model';
    if (sub) sub.textContent = 'See alternatives for the same setup.';
  }

  const upgrade = document.querySelector('#upgrade-results');
  if (upgrade) {
    const title = upgrade.querySelector('.results-heading h2');
    const sub = upgrade.querySelector('.results-heading p');
    if (title) title.textContent = 'What does more memory unlock?';
    if (sub) sub.textContent = 'See the next memory tiers that change your options.';
  }

  return true;
}

bindDevicePanelSync();
if (!tuneCopy()) {
  const observer = new MutationObserver(() => {
    if (tuneCopy()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
