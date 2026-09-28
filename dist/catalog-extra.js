// Side-effect module: expands the base catalogue before app.js builds its controls.
import { GPUs, MODELS } from './data.js';
import { EXTRA_GPUS } from './gpu-extra.js';
import { EXTRA_MODELS } from './model-extra.js';

function appendUnique(target, additions) {
  const ids = new Set(target.map(item => item.id));
  const names = new Set(target.map(item => item.name.toLowerCase()));
  for (const item of additions) {
    if (ids.has(item.id) || names.has(item.name.toLowerCase())) continue;
    target.push(item);
    ids.add(item.id);
    names.add(item.name.toLowerCase());
  }
}

appendUnique(GPUs, EXTRA_GPUS);
appendUnique(MODELS, EXTRA_MODELS);
GPUs.sort((a, b) => a.name.localeCompare(b.name));
MODELS.sort((a, b) => a.name.localeCompare(b.name));
