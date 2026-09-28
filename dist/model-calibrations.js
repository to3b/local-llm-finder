// Evidence-backed adjustments to prototype ranking inputs.
// Keep this intentionally small: only override a value when publisher/benchmark
// evidence directly contradicts an older planning input.
export const MODEL_CALIBRATIONS = Object.freeze({
  'Mistral Medium 3.5 128B': {
    quality: { coding: 100 },
    source: 'https://huggingface.co/mistralai/Mistral-Medium-3.5-128B',
    verifiedAt: '2026-09-28',
    note: 'Mistral states Medium 3.5 supersedes its previous coding models and replaces Devstral 2 in Vibe.'
  },
  'LFM2.5 8B-A1B': {
    activeParametersB: 1.5,
    source: 'https://huggingface.co/LiquidAI/LFM2.5-8B-A1B',
    verifiedAt: '2026-09-28',
    note: 'Liquid AI lists 8.3B total parameters and 1.5B active parameters.'
  },
  'LFM2 24B-A2B': {
    activeParametersB: 2.3,
    source: 'https://huggingface.co/LiquidAI/LFM2-24B-A2B',
    verifiedAt: '2026-09-28',
    note: 'Liquid AI lists 24B total parameters and 2.3B active parameters.'
  }
});

function applyActiveWeightCalibration(model, activeParametersB) {
  model.activeParametersB = activeParametersB;
  const ratio = activeParametersB / model.parametersB;
  for (const quant of model.quantizations) {
    // Keep the same conservative floor used by the catalogue generator. This is a
    // speed-model hint only; memory still uses the full quantized weight footprint.
    quant.speedWeightsGB = +Math.max(.25, quant.weightsGB * ratio).toFixed(1);
  }
}

export function applyModelCalibrations(models) {
  for (const model of models) {
    const calibration = MODEL_CALIBRATIONS[model.name];
    if (!calibration) continue;
    if (calibration.quality) Object.assign(model.quality, calibration.quality);
    if (Number.isFinite(calibration.activeParametersB)) {
      applyActiveWeightCalibration(model, calibration.activeParametersB);
    }
    model.calibration = calibration;
  }
  return models;
}
