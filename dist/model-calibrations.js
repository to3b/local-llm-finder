// Evidence-backed adjustments to the prototype task rubric.
// Keep this intentionally small: only override a score when publisher/benchmark
// evidence directly contradicts the older prototype ordering.
export const MODEL_CALIBRATIONS = Object.freeze({
  'Mistral Medium 3.5 128B': {
    quality: { coding: 100 },
    source: 'https://huggingface.co/mistralai/Mistral-Medium-3.5-128B',
    verifiedAt: '2026-09-28',
    note: 'Mistral states Medium 3.5 supersedes its previous coding models and replaces Devstral 2 in Vibe.'
  }
});

export function applyModelCalibrations(models) {
  for (const model of models) {
    const calibration = MODEL_CALIBRATIONS[model.name];
    if (!calibration) continue;
    Object.assign(model.quality, calibration.quality);
    model.calibration = calibration;
  }
  return models;
}
