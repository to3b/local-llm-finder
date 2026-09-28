function tuneCopy() {
  const hero = document.querySelector('.hero');
  const nav = document.querySelector('.journey-nav');
  if (!hero || !nav) return false;

  const heading = hero.querySelector('#page-heading');
  const heroBody = hero.querySelector(':scope > p:not(.eyebrow):not(.hero-note)');
  const heroNote = hero.querySelector('.hero-note');
  if (heading) heading.textContent = 'Find the right local LLM';
  if (heroBody) heroBody.textContent = 'Find, compare and upgrade local models for your hardware.';
  if (heroNote) heroNote.textContent = 'Runs in your browser. Estimates, not benchmarks.';

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

  const gpuHelp = document.querySelector('#gpu-fields .field-help');
  if (gpuHelp) gpuHelp.textContent = 'VRAM affects fit. Card model improves speed estimates.';

  const taskHelp = document.querySelector('.task-section > .field-help');
  if (taskHelp) taskHelp.textContent = 'This gets the most weight.';

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
