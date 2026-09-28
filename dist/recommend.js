import { MODELS } from './data.js';

export const USE_CASES = {
  chat: 'general chat', coding: 'coding', reasoning: 'reasoning',
  writing: 'creative writing', longContext: 'long-context work'
};

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

export function recommend({ hardware, useCases, preference, minSpeed, contextK }, models = MODELS) {
  if (!hardware || !Number.isFinite(hardware.vramGB) || hardware.vramGB < 2 ||
      !Number.isFinite(hardware.ramGB) || hardware.ramGB < 4 ||
      !Array.isArray(useCases) || !useCases.length || useCases.some(key => !USE_CASES[key]) ||
      !Number.isInteger(preference) || preference < 1 || preference > 5 ||
      !Number.isFinite(minSpeed) || minSpeed < 1 || ![4, 8, 16, 32, 64].includes(contextK)) {
    throw new Error('Choose valid hardware and requirements to find matches.');
  }

  const excluded = { context: 0, memory: 0 };
  const eligible = [];
  for (const model of models) {
    if (model.contextK < contextK) { excluded.context++; continue; }
    const options = model.quantizations.map(quant => {
      const metrics = estimate(model, quant, hardware, contextK);
      const quality = Math.min(100, Math.round(useCases.reduce((total, key) => total + model.quality[key], 0) / useCases.length + (quant.qualityBonus ?? 0)));
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
    // Includes slower and weaker task fits, but never models that fail memory/context.
    catalog: eligible,
    excluded,
    considered: models.length
  };
}
