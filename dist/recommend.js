import { MODELS } from './data.js';

export const USE_CASES = {
  chat: 'general chat', coding: 'coding', reasoning: 'reasoning',
  writing: 'creative writing', longContext: 'long-context work'
};

const QUANTIZATIONS = new Set(['auto', 'Q4_K_M', 'Q5_K_M', 'Q8_0']);

// All values below are planning estimates, not device/model benchmarks.
// Keep the calculation pure so a future data source can replace these inputs.
export function estimate(model, quant, hardware, contextK) {
  const requiredGB = +(quant.weightsGB + 0.9 + model.kvGBPer1K * contextK).toFixed(1);
  const hostRAMGB = +(quant.weightsGB + 4).toFixed(1);
  const reserveGB = +(Math.max(.15, Math.min(1.5, hardware.vramGB * .03))).toFixed(2);
  // Bandwidth proxy with a gentle cap: real inference depends on more than bandwidth.
  // For manual VRAM, use a neutral 500 GB/s assumption and label that in the UI.
  const bandwidth = hardware.bandwidthGBs ?? 500;
  const nominal = 20 * (16 / quant.weightsGB) * Math.pow(bandwidth / 850, 0.72);
  const contextPenalty = Math.max(0.7, 1 - contextK / 320);
  const middle = Math.max(1, nominal * contextPenalty);
  return {
    requiredGB, hostRAMGB, reserveGB,
    speedLow: Math.round(middle * .85), speedHigh: Math.round(middle * 1.15),
    // Host RAM is advisory: memory-mapped loaders can behave differently.
    fits: requiredGB + reserveGB <= hardware.vramGB,
    ramAdvisory: hostRAMGB <= hardware.ramGB
  };
}

function taskQuality(model, useCases, primaryUse) {
  const unique = [...new Set(useCases)];
  if (!primaryUse || !unique.includes(primaryUse) || unique.length === 1) {
    return unique.reduce((total, key) => total + model.quality[key], 0) / unique.length;
  }

  // Keep the default interaction simple: the declared main job receives most of
  // the weight, while every secondary job still has a meaningful influence.
  const secondary = unique.filter(key => key !== primaryUse);
  const secondaryAverage = secondary.reduce((total, key) => total + model.quality[key], 0) / secondary.length;
  return model.quality[primaryUse] * .65 + secondaryAverage * .35;
}

export function recommend({
  hardware,
  useCases,
  primaryUse = null,
  preference,
  minSpeed,
  contextK,
  quantization = 'auto',
  maxWeightsGB = null,
  family = null
}, models = MODELS) {
  if (!hardware || !Number.isFinite(hardware.vramGB) || hardware.vramGB < 2 ||
      !Number.isFinite(hardware.ramGB) || hardware.ramGB < 4 ||
      !Array.isArray(useCases) || !useCases.length || useCases.some(key => !USE_CASES[key]) ||
      (primaryUse !== null && (!USE_CASES[primaryUse] || !useCases.includes(primaryUse))) ||
      !Number.isInteger(preference) || preference < 1 || preference > 5 ||
      !Number.isFinite(minSpeed) || minSpeed < 1 || ![4, 8, 16, 32, 64].includes(contextK) ||
      !QUANTIZATIONS.has(quantization) ||
      (maxWeightsGB !== null && (!Number.isFinite(maxWeightsGB) || maxWeightsGB <= 0)) ||
      (family !== null && typeof family !== 'string')) {
    throw new Error('Choose valid hardware and requirements to find matches.');
  }

  const excluded = { context: 0, memory: 0, filters: 0 };
  const eligible = [];
  for (const model of models) {
    if (family && model.family !== family) { excluded.filters++; continue; }
    if (model.contextK < contextK) { excluded.context++; continue; }

    const quantCandidates = model.quantizations.filter(quant => {
      if (quantization !== 'auto' && quant.name !== quantization) return false;
      if (maxWeightsGB !== null && quant.weightsGB > maxWeightsGB) return false;
      return true;
    });
    if (!quantCandidates.length) { excluded.filters++; continue; }

    const options = quantCandidates.map(quant => {
      const metrics = estimate(model, quant, hardware, contextK);
      const quality = Math.min(100, Math.round(taskQuality(model, useCases, primaryUse) + (quant.qualityBonus ?? 0)));
      // Preference changes the tradeoff, but fit and task quality remain visible.
      const qualityWeight = [.16, .34, .53, .70, .88][preference - 1];
      const speedKnown = hardware.speedKnown !== false && hardware.mode !== 'unsure';
      const speedUtility = !speedKnown
        ? .75 + .25 * Math.min(1, 6 / quant.weightsGB) // gentle size proxy; speed unknown
        : Math.min(1, Math.log2(1 + Math.max(1, metrics.speedLow)) / Math.log2(81));
      const rank = qualityWeight * quality / 100 + (1 - qualityWeight) * speedUtility;
      // VRAM alone tells us fit, not device-specific speed.
      const meetsSpeed = speedKnown ? metrics.speedLow >= minSpeed : null;
      return { model, quant, quality, ...metrics, rank, meetsSpeed };
    }).filter(option => option.fits);

    if (!options.length) { excluded.memory++; continue; }
    // One quantization per model. A qualifying option wins over a slower one.
    options.sort((a, b) => Number(b.meetsSpeed !== false) - Number(a.meetsSpeed !== false) || b.rank - a.rank);
    eligible.push(options[0]);
  }

  eligible.sort((a, b) => b.rank - a.rank || b.quality - a.quality);
  const qualifying = eligible.filter(item => item.meetsSpeed !== false);
  const bestTaskFit = Math.max(0, ...qualifying.map(item => item.quality));
  // Avoid filling the shortlist with tiny but weak models when stronger ones
  // already meet the user's speed target. Speed-first allows a wider range.
  const taskFloor = bestTaskFit - (preference <= 2 ? 28 : preference === 3 ? 18 : 14);
  return {
    matches: qualifying.filter(item => item.quality >= taskFloor).slice(0, 5),
    slower: eligible.filter(item => item.meetsSpeed === false).slice(0, 5),
    // Complete one-quantization-per-model list for the optional catalogue.
    // Includes slower and weaker task fits, but never models that fail memory/context/filters.
    catalog: eligible,
    excluded,
    considered: models.length
  };
}

// Load the decision-flow layer only in a browser. Keeping it out of Node makes
// the recommendation module remain usable as a pure, testable calculation API.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  queueMicrotask(() => {
    import('./journeys.js');
    import('./model-links.js');
  });
}
