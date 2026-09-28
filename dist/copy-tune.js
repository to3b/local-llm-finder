const PRIORITY_LABELS = ['Fastest', 'Faster', 'Balanced', 'Stronger', 'Strongest'];

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
  if (heading) heading.textContent = 'Find the right local LLM';
  if (heroBody) heroBody.textContent = 'Match models to your hardware and workload.';

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

  enhancePriority();

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

if (!tuneCopy()) {
  const observer = new MutationObserver(() => {
    if (tuneCopy()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
