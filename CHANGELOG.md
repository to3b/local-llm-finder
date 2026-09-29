# Changelog

## Interaction rendering fixes — 29 September 2026

- Replace the continuously animated, oversized blurred backdrop with static page gradients and use an inset hover highlight instead of a brightness filter.
- Render publisher links and speed-estimate labels with each result instead of rescanning and rewriting the whole document after DOM changes.
- Keep model-card links on finder rows, comparison cards and upgrade milestones; retain rough-speed and unknown-speed labels.

## Performance fixes — 29 September 2026

- Reuse validated public catalogue CSVs for five minutes on repeat visits, while preserving all live-sheet validation and bundled fallback checks.
- Preload the module graph to reduce sequential JavaScript downloads on first visits.
- Coalesce Improve/Upgrade changes and skip inactive journeys and partial GPU-name input.
- Cancel remaining sheet requests if one required tab fails; cover cache expiry, corruption, unavailable storage and timeout behavior in CI.

## 1.0.0 — 28 September 2026

First public release of Local LLM Finder.

### Finder

- Find local models from GPU, Mac or RAM-based hardware inputs.
- Separate Basic, Advanced and Power user controls through progressive disclosure.
- Main-use and secondary-use weighting for chat, coding, reasoning, writing and long-document work.
- Five-position speed-to-quality priority control.
- Quantization, context, family, file-size and manual-memory controls.
- Find, Improve and Upgrade journeys.
- Shareable setup links stored in the URL hash.

### Catalogue

- 142 GPU profiles across NVIDIA, AMD and Intel.
- 136 local model profiles spanning small dense models, coding/reasoning specialists, workstation-scale models and selected MoE models.
- Curated publisher Hugging Face destinations for common recommendations, with search fallback when a publisher repository has not been verified.
- Evidence-backed calibration layer for corrections that supersede older prototype inputs.

### Recommendation engine

- Estimated quantized-memory fit including runtime/context overhead and reserve headroom.
- Rough known-GPU speed ranges using memory-bandwidth/model-size planning assumptions.
- MoE active-weight hints for throughput without reducing full-model memory requirements.
- No hidden speed floor; minimum speed is an explicit Advanced constraint.
- Quality-led Stronger/Strongest modes and neutral speed treatment when exact-device speed is unknown.
- Engine-derived #1 and joint-#1 presentation.
- Broad public task-fit labels instead of unsupported precise capability scores.

### Release quality

- Automated catalogue, ranking, presentation, provenance, calibration, share-state and release tests.
- 165-scenario hardware/workload/preference QA matrix.
- 20 representative real-world recommendation spot checks retained as regression coverage.
- Privacy, terms/disclaimer and methodology pages.
- Custom production domain at `https://localllmfinder.com/` with canonical, sitemap and robots metadata.
- GitHub issue path for data corrections and missing hardware/models.

### Known V1 limitations

- Most task-fit inputs remain planning estimates rather than a benchmark database.
- Speed estimates are not backend-specific measured throughput.
- Exact Mac-chip speed is not estimated yet.
- Laptop GPUs, integrated GPUs, CPU-only inference and multi-GPU setups are not fully modeled.
- Runtime/format compatibility is not yet a complete structured filter.
